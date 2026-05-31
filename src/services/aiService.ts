/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/services/aiService.ts
 *  Chat IA connecté à Supabase + Groq via Edge Function
 *  Unifié avec le site web et le CRM (mêmes tables)
 *
 *  Architecture sécurisée :
 *    📱 App → 🔒 Edge Function → 🤖 Groq API
 *    Les clés API ne quittent jamais le serveur.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { AI_CONFIG } from "../config/aiConfig";
import { supabase } from "../lib/supabase";
import type { SearchResult } from "./googleSearchService";
import type { Property } from "./propertyService";
import { formatPrice } from "./propertyService";

// ── Types ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:           string;
  role:         "user" | "assistant";
  content:      string;
  timestamp:    Date;
  sources?:     SearchResult[];
  properties?:  Property[];
  isSearching?: boolean;
}

export type ApiMessage = {
  role:    "user" | "assistant";
  content: string;
};

// ── Conversation unifiée (partagée web/crm/app) ─────────────────────

let _conversationId: string | null = null;

async function ensureConversation(): Promise<string | null> {
  if (_conversationId) return _conversationId;

  try {
    const sessionId = `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data, error } = await supabase
      .from("chatbot_conversations")
      .insert([{ session_id: sessionId, source: "app", is_admin: false }])
      .select("id")
      .single();

    if (error) {
      console.warn("[aiService] Error creating conversation:", error);
      return null;
    }
    _conversationId = data.id;
    return data.id;
  } catch (e) {
    console.warn("[aiService] Conversation error:", e);
    return null;
  }
}

export function resetConversation() {
  _conversationId = null;
}

async function saveMessages(userContent: string, botContent: string) {
  const convId = _conversationId;
  if (!convId) return;
  try {
    await supabase.from("chatbot_messages").insert([
      { conversation_id: convId, role: "user", content: userContent },
      { conversation_id: convId, role: "assistant", content: botContent },
    ]);
  } catch (e) {
    console.warn("[aiService] Error saving messages:", e);
  }
}

async function createAppointment(reply: string): Promise<boolean> {
  const match = reply.match(/<APPOINTMENT_DATA>([\s\S]*?)<\/APPOINTMENT_DATA>/);
  if (!match) return false;

  try {
    const data = JSON.parse(match[1]);
    const { error } = await supabase.from("appointments").insert([{
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      service_type: data.service_type,
      appointment_date: data.appointment_date,
      appointment_time: data.appointment_time,
      message: data.message || "",
      status: "en_attente",
      source: "app",
      conversation_id: _conversationId,
    }]);

    if (error) {
      console.warn("[aiService] Appointment error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[aiService] Appointment parse error:", e);
    return false;
  }
}

// ── Détection de recherche immobilière ───────────────────────────────

const PROPERTY_KEYWORDS = [
  "villa", "appartement", "maison", "terrain", "bureau", "local",
  "cherche", "recherche", "trouver", "montre", "voir", "disponible",
  "acheter", "louer", "vente", "location", "prix",
  "chambre", "sdb", "m²", "surface",
  "gombe", "ngaliema", "limete", "kintambo", "lemba", "kalamu",
  "bandalungwa", "mont-ngafula", "nsele", "masina",
  "combien", "budget", "cher", "pas cher", "luxe", "premium",
  "bien", "biens", "propriété", "annonce", "catalogue",
  "investir", "investissement",
];

function shouldSearchProperties(message: string): boolean {
  const lower = message.toLowerCase();
  return PROPERTY_KEYWORDS.some((kw) => lower.includes(kw));
}

// ── Extraction de filtres depuis le message ─────────────────────────

interface ExtractedFilters {
  category?:    string;
  transaction?: string;
  commune?:     string;
  minPrice?:    number;
  maxPrice?:    number;
  bedrooms?:    number;
}

function extractFilters(message: string): ExtractedFilters {
  const lower = message.toLowerCase();
  const filters: ExtractedFilters = {};

  // Catégorie
  if (lower.includes("villa"))        filters.category = "villa";
  else if (lower.includes("appartement")) filters.category = "appartement";
  else if (lower.includes("maison"))  filters.category = "maison";
  else if (lower.includes("terrain")) filters.category = "terrain";
  else if (lower.includes("bureau"))  filters.category = "bureau";
  else if (lower.includes("local"))   filters.category = "local";

  // Transaction
  if (lower.includes("louer") || lower.includes("location") || lower.includes("à louer"))
    filters.transaction = "location";
  else if (lower.includes("acheter") || lower.includes("vente") || lower.includes("à vendre"))
    filters.transaction = "vente";

  // Commune
  const communes = [
    "gombe", "ngaliema", "limete", "kintambo", "lemba",
    "kalamu", "bandalungwa", "mont-ngafula", "nsele", "masina",
  ];
  for (const c of communes) {
    if (lower.includes(c)) {
      filters.commune = c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  // Prix — avec validation NaN
  const priceMatch = lower.match(/(\d[\d\s.]*)\s*(?:\$|usd|dollars?)/);
  if (priceMatch) {
    const val = parseInt(priceMatch[1].replace(/[\s.]/g, ""), 10);
    if (!isNaN(val) && val > 0) {
      if (lower.includes("moins") || lower.includes("max") || lower.includes("budget")) {
        filters.maxPrice = val;
      } else if (lower.includes("plus") || lower.includes("min") || lower.includes("partir")) {
        filters.minPrice = val;
      } else {
        filters.maxPrice = val * 1.3;
        filters.minPrice = val * 0.7;
      }
    }
  }

  // Chambres — avec validation NaN
  const bedMatch = lower.match(/(\d+)\s*(?:chambre|ch\b|bedroom)/);
  if (bedMatch) {
    const beds = parseInt(bedMatch[1], 10);
    if (!isNaN(beds) && beds > 0) filters.bedrooms = beds;
  }

  return filters;
}

// ── Recherche Supabase ──────────────────────────────────────────────

async function fetchRelevantProperties(message: string): Promise<Property[]> {
  try {
    const filters = extractFilters(message);

    let query = supabase
      .from("properties_with_agent")
      .select("*")
      .eq("is_published", true)
      .eq("status", "disponible")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6);

    if (filters.category)    query = query.eq("category", filters.category);
    if (filters.transaction) query = query.eq("transaction", filters.transaction);
    if (filters.commune)     query = query.ilike("commune", `%${filters.commune}%`);
    if (filters.minPrice)    query = query.gte("price", filters.minPrice);
    if (filters.maxPrice)    query = query.lte("price", filters.maxPrice);
    if (filters.bedrooms)    query = query.gte("bedrooms", filters.bedrooms);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Property[];
  } catch (e) {
    console.warn("[aiService] fetchRelevantProperties:", e);
    return [];
  }
}

// ── Formatage du contexte propriétés pour l'IA ──────────────────────

function formatPropertiesContext(properties: Property[]): string {
  if (!properties.length) return "";

  const lines = properties.map((p, i) => {
    const features: string[] = [];
    if (p.surface_m2) features.push(`${p.surface_m2} m²`);
    if (p.bedrooms)   features.push(`${p.bedrooms} chambres`);
    if (p.bathrooms)  features.push(`${p.bathrooms} SDB`);
    if (p.floors)     features.push(`${p.floors} étages`);

    return [
      `Bien ${i + 1}: "${p.title}"`,
      `  Prix: ${formatPrice(p.price, p.currency)}`,
      `  Type: ${p.category} (${p.transaction})`,
      `  Localisation: ${[p.commune, p.quartier].filter(Boolean).join(", ") || "Kinshasa"}`,
      features.length ? `  Caractéristiques: ${features.join(", ")}` : "",
      p.description ? `  Description: ${p.description.slice(0, 150)}` : "",
      p.images?.length ? `  Photos: ${p.images.length} photo(s) disponible(s)` : "",
      p.video_url ? `  Vidéo disponible` : "",
    ].filter(Boolean).join("\n");
  });

  return `\n\n[CATALOGUE SENZEDY AGENCY — ${properties.length} bien(s) trouvé(s) :\n${lines.join("\n\n")}\n\nPrésente ces biens de façon premium et engageante. L'app affichera les photos automatiquement.]`;
}

// ── Contexte HNC La Main de l'Espoir ──────────────────────────────────

const HNC_CONTEXT = `CONTEXTE — Association HNC La Main de l'Espoir :
Senzedy Agency soutient l'association humanitaire "HNC La Main de l'Espoir", fondée par Huguette, Nadia et Carine (H-N-C = leurs initiales).
Mission : tendre la main aux personnes en difficulté au Congo RDC.
Missions court terme : fournir des produits d'hygiène féminine, campagnes de prévention/sensibilisation MST, kits post-accouchement (vêtements bébés, couches, biberons), aide matérielle/financière/alimentaire aux orphelinats, présence humaine et écoute.
Missions long terme : ouvrir un centre de suivi gynécologique et d'accompagnement social, étendre l'aide en RDC et en Afrique, formation professionnelle des enfants, centre d'accueil de jour pour enfants de la rue.
Association à but non lucratif — tous les fonds récoltés vont à la population ciblée.
Contact : Email HNC.lamaindelespoir@hotmail.com | Facebook "HNC la main de l'espoir" | TikTok @hnc.lamaindelespoir | Dons PayPal : https://www.paypal.me/hnclamaindelespoir
"L'altruiste est un être dévoué et charitable qui n'attend jamais rien en retour de sa bonté"`;

function shouldIncludeHNC(msg: string): boolean {
  const lower = msg.toLowerCase();
  return /hnc|association|humanitaire|espoir|don|orphelin|main de l.espoir|huguette|nadia|carine/.test(lower);
}

// ── Envoi de message via Edge Function (sécurisé) ───────────────────

export async function sendChatMessage(
  userMessage: string,
  history:     ApiMessage[]
): Promise<{ content: string; sources?: SearchResult[]; properties?: Property[]; usedSearch: boolean }> {
  try {
    // 0. S'assurer qu'on a une conversation unifiée
    await ensureConversation();

    // 1. Chercher des biens pertinents si la question touche à l'immobilier
    let properties: Property[] = [];
    let propertyContext = "";

    if (shouldSearchProperties(userMessage)) {
      properties = await fetchRelevantProperties(userMessage);
      propertyContext = formatPropertiesContext(properties);
    }

    // 1b. Ajouter contexte HNC si pertinent
    if (shouldIncludeHNC(userMessage)) {
      propertyContext = propertyContext + "\n\n" + HNC_CONTEXT;
    }

    // 2. Appel Edge Function via fetch direct (plus fiable que supabase.functions.invoke)
    const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b3FveXZxamd2dmh5d3NtcmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzQ0NTcsImV4cCI6MjA5NTgxMDQ1N30.LnJxBGBZRDgmPMnoMheZu5ZYjufLqBVIXPJbGt-6vKs";
    let userToken: string | null = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      userToken = session?.access_token ?? null;
    } catch { /* pas de session = pas grave */ }

    const res = await fetch(
      `https://fxoqoyvqjgvvhywsmrln.supabase.co/functions/v1/${AI_CONFIG.EDGE_FUNCTION}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken || SUPABASE_ANON}`,
          "apikey": SUPABASE_ANON,
        },
        body: JSON.stringify({
          message: userMessage,
          history: history.slice(-20),
          propertyContext,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Erreur service IA (${res.status})`);
    }

    const fnData = await res.json();

    const rawContent = fnData?.reply ?? fnData?.content ?? "";
    if (!rawContent) throw new Error("Réponse vide du service IA.");

    // 3. Vérifier si un RDV a été créé
    await createAppointment(rawContent).catch((e) =>
      console.warn("[aiService] Appointment check failed:", e)
    );

    // 4. Nettoyer la réponse (retirer le JSON de RDV)
    const content = rawContent.replace(/<APPOINTMENT_DATA>[\s\S]*?<\/APPOINTMENT_DATA>/, "").trim();

    // 5. Sauvegarder dans les tables unifiées (async, non-bloquant)
    saveMessages(userMessage, content).catch((e) =>
      console.warn("[aiService] Async save failed:", e)
    );

    return {
      content,
      properties: properties.length > 0 ? properties : undefined,
      usedSearch: properties.length > 0,
    };
  } catch (err) {
    if (err instanceof Error && err.message) throw err;
    throw new Error("Impossible de contacter le service IA.");
  }
}

// ── Suggestions rapides ───────────────────────────────────────────────

export const QUICK_SUGGESTIONS = [
  { label: "Biens en vedette",     icon: "star-outline",            text: "Montre-moi les biens en vedette disponibles chez Senzedy Agency" },
  { label: "Villas à Ngaliema",    icon: "home-outline",            text: "Je cherche une villa de luxe à Ngaliema" },
  { label: "Appartements Gombe",   icon: "business-outline",        text: "Quels appartements avez-vous à Gombe ?" },
  { label: "Investir en RDC",      icon: "diamond-outline",         text: "Est-ce rentable d'investir dans l'immobilier à Kinshasa ?" },
  { label: "Biens à louer",        icon: "key-outline",             text: "Montrez-moi les biens disponibles à la location" },
  { label: "Prix du marché",       icon: "trending-up-outline",     text: "Quels sont les prix de l'immobilier à Kinshasa ?" },
];
