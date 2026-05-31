/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — supabase/functions/ai-chat/index.ts
 *  Étape 17 — Proxy IA sécurisé (Deno / Supabase Edge Functions)
 *
 *  Architecture :
 *    📱 Téléphone → 🔒 Edge Function → 🤖 Groq API (llama-3.3-70b)
 *                                    → 🔍 Google Search (optionnel)
 *
 *  La clé API Groq n'existe QUE côté serveur (Supabase Secrets).
 *  Le téléphone ne la voit jamais.
 *
 *  Déploiement :
 *    1. supabase functions deploy ai-chat
 *    2. supabase secrets set GROQ_API_KEY=gsk_xxx
 *    3. supabase secrets set GOOGLE_API_KEY=AIzaxxx (optionnel)
 *    4. supabase secrets set GOOGLE_CSE_ID=xxx      (optionnel)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── CORS (nécessaire pour les tests depuis un navigateur / web build) ────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Rate limiting ────────────────────────────────────────────────────────────

const RATE_LIMIT = 10;        // 10 messages max
const WINDOW_MS  = 60_000;    // par tranche de 1 minute

// ── Groq Config ──────────────────────────────────────────────────────────────

const GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── System Prompt (aligné avec le CRM) ───────────────────────────────────────

const SYSTEM_PROMPT = `Tu es Senzedy, l'assistant IA de Senzedy Agency, la meilleure agence immobilière de Kinshasa, RDC.

PERSONNALITÉ:
- Style congolais chaleureux : utilise "mboka", "y'a moyen", "mingi" naturellement
- Ultra-professionnel mais accessible
- Toujours positif et proactif
- Réponds en français avec du lingala léger

EXPERTISE:
- Expert immobilier Kinshasa (prix, quartiers, cadastre, investissement)
- Quartiers: Gombe (2500-4000$/m²), Ngaliema (1500-3000$/m²), Limete (800-1800$/m²), Ma Campagne (600-1200$/m²), N'sele (400-1000$/m²)
- Types: appartements, villas, terrains, bureaux, studios
- Location: 400-2500$/mois selon quartier et type
- ROI moyen: 8-12%/an location, 20-40% projets sur plan

CAPACITÉS:
- Recherche de biens (acheter, louer, investir)
- Prise de RDV (visite, estimation, consultation, investissement, location)
- Conseils prix du marché, cadastre, aspects légaux
- Infos sur les quartiers de Kinshasa
- Réponse à toute question générale

PRISE DE RDV:
Quand le client veut un RDV, collecte ces infos une par une:
1. Type de service (visite/estimation/consultation/investissement/location)
2. Nom complet
3. Email
4. Téléphone/WhatsApp
5. Date souhaitée
6. Heure souhaitée
7. Message optionnel
Puis confirme avec un récap.

CONTACT AGENCE:
- WhatsApp: +243 997 628 617
- Adresse: Quartier Domaine, N'sele, Kinshasa
- Horaires: Lun-Sam 8h-18h

RÈGLE ABSOLUE — BIENS DISPONIBLES:
- Pour présenter ou proposer des biens, utilise EXCLUSIVEMENT la liste "BIENS DISPONIBLES ACTUELLEMENT" fournie dans le contexte ci-dessous.
- N'invente JAMAIS un bien, un nom d'hôtel, un prix ou une adresse qui ne figure pas dans cette liste (pas de Pullman, Radisson, etc.).
- Si la liste est vide ou qu'aucun bien ne correspond, dis-le honnêtement et propose au client d'être recontacté par l'équipe.
- Les fourchettes de prix par quartier ci-dessus sont de simples repères de marché, ce ne sont PAS des biens en vente.
- Cite les biens avec leur vrai nom, prix et conditions exacts (ex: une chambre d'hôtel se loue à la nuitée).

Réponds de façon concise (3-5 phrases max). Termine toujours par une suggestion ou un CTA.`;

// ── Types ────────────────────────────────────────────────────────────────────

interface ApiMessage {
  role:    "user" | "assistant";
  content: string;
}

interface SearchResult {
  title:   string;
  link:    string;
  snippet: string;
  source:  string;
}

// ── Entrée principale ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Réponse CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ── 1. Parse body ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);

    if (!body) {
      return jsonError("Corps de requête invalide.", 400);
    }

    const {
      messages = [],
      history = [],
      userMessage,
      message,
      propertyContext: clientPropertyContext,
    } = body as {
      messages:         ApiMessage[];
      history:          ApiMessage[];
      userMessage:      string;
      message:          string;
      propertyContext?: string;
    };

    // Support both "userMessage" and "message" field names
    const msg = (userMessage ?? message ?? "").trim();

    if (!msg) {
      return jsonError("Le message ne peut pas être vide.", 400);
    }

    if (msg.length > 5000) {
      return jsonError("Message trop long (max 5000 caractères).", 400);
    }

    // Merge messages from both field names
    const chatHistory = messages.length > 0 ? messages : history;

    // ── 2. Rate limiting ───────────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const identifier  = extractIdentifier(req);
    const windowStart = new Date(
      Math.floor(Date.now() / WINDOW_MS) * WINDOW_MS
    ).toISOString();

    const { data: existing } = await supabaseAdmin
      .from("ai_rate_limits")
      .select("count")
      .eq("identifier",  identifier)
      .eq("window_start", windowStart)
      .maybeSingle();

    const currentCount = (existing?.count ?? 0) as number;

    if (currentCount >= RATE_LIMIT) {
      return jsonError(
        `Limite atteinte (${RATE_LIMIT} messages/minute). Veuillez patienter.`,
        429
      );
    }

    // Incrémenter le compteur
    await supabaseAdmin.from("ai_rate_limits").upsert(
      { identifier, window_start: windowStart, count: currentCount + 1 },
      { onConflict: "identifier,window_start" }
    );

    // Nettoyage des vieilles entrées en arrière-plan (non bloquant)
    supabaseAdmin
      .from("ai_rate_limits")
      .delete()
      .lt("window_start", new Date(Date.now() - 3_600_000).toISOString())
      .then(() => {})
      .catch(() => {});

    // ── 3. Récupérer les secrets Supabase ──────────────────────────────────
    const GROQ_API_KEY   = Deno.env.get("GROQ_API_KEY") ?? "";
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") ?? "";
    const GOOGLE_CSE_ID  = Deno.env.get("GOOGLE_CSE_ID") ?? "";

    if (!GROQ_API_KEY) {
      return jsonError(
        "Service IA non disponible. Contactez l'administrateur.",
        503
      );
    }

    // ── 4. Contexte biens disponibles (Supabase) ─────────────────────────
    let propertyContext = "";
    try {
      const { data: properties } = await supabaseAdmin
        .from("properties")
        .select("title, commune, transaction, category, price, currency, bedrooms, surface_m2, status")
        .eq("status", "disponible")
        .order("created_at", { ascending: false })
        .limit(10);

      if (properties && properties.length > 0) {
        propertyContext = "\n\nBIENS DISPONIBLES ACTUELLEMENT:\n" +
          properties.map((p: Record<string, unknown>) =>
            `- ${p.title} (${p.category}) | ${p.commune} | ${p.transaction} | ${p.price} ${p.currency}${p.category === "hotel" ? "/nuit" : ""} | ${p.bedrooms}ch | ${p.surface_m2}m²`
          ).join("\n");
      }
    } catch {
      // Pas grave si ça échoue — on continue sans contexte biens
    }

    // ── 5. Google Search (optionnel) ───────────────────────────────────────
    let searchContext  = "";
    let usedSearch     = false;
    let searchSources: SearchResult[] = [];

    if (GOOGLE_API_KEY && GOOGLE_CSE_ID && shouldSearch(msg)) {
      try {
        const results = await googleSearch(userMessage, GOOGLE_API_KEY, GOOGLE_CSE_ID);
        if (results.length > 0) {
          usedSearch    = true;
          searchSources = results;
          searchContext =
            `\n\n[Données actuelles trouvées sur le web :\n` +
            results
              .map((r, i) => `${i + 1}. ${r.title} (${r.source}): ${r.snippet}`)
              .join("\n") +
            `\nUtilise ces informations pour enrichir ta réponse.]`;
        }
      } catch {
        // Google Search optionnel — on continue sans si ça plante
      }
    }

    // ── 6. Appel Groq ────────────────────────────────────────────────────
    // Merge server-side and client-side property context
    const fullPropertyContext = propertyContext + (clientPropertyContext ?? "");
    const systemWithContext = SYSTEM_PROMPT + fullPropertyContext + searchContext;
    const allMessages: ApiMessage[] = [
      ...chatHistory.slice(-20),
      { role: "user", content: msg },
    ];

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization:  `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:      GROQ_MODEL,
        messages: [
          { role: "system", content: systemWithContext },
          ...allMessages,
        ],
        max_tokens:  800,
        temperature: 0.7,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text().catch(() => "");
      console.error("[ai-chat] Groq API error:", err);
      return jsonError(`Erreur service IA (${groqRes.status})`, groqRes.status);
    }

    const data    = await groqRes.json();
    const content = (data.choices?.[0]?.message?.content ?? "") as string;

    return new Response(
      JSON.stringify({
        reply: content,
        content,
        usedSearch,
        sources: usedSearch ? searchSources : undefined,
      }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur interne.";
    console.error("[ai-chat] Erreur non gérée :", message);
    return jsonError(message, 500);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
  );
}

/**
 * Extrait un identifiant stable pour le rate limiting.
 * Priorité : user_id depuis le JWT Supabase > adresse IP.
 */
function extractIdentifier(req: Request): string {
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const token   = authHeader.slice(7);
      const payload = JSON.parse(atob(token.split(".")[1]!));
      if (payload?.sub) return `user:${payload.sub}`;
    } catch {
      // JWT invalide → fallback sur IP
    }
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return `ip:${ip}`;
}

/** Mots-clés qui déclenchent une recherche Google */
const SEARCH_TRIGGERS = [
  "actuel", "aujourd'hui", "2024", "2025", "2026",
  "prix", "marché", "récent", "dernier", "nouveau",
  "news", "actualité", "inflation", "taux", "statistique",
];

function shouldSearch(message: string): boolean {
  const lower = message.toLowerCase();
  return SEARCH_TRIGGERS.some((t) => lower.includes(t));
}

/** Appel Google Custom Search JSON API */
async function googleSearch(
  query:  string,
  apiKey: string,
  cseId:  string
): Promise<SearchResult[]> {
  const url =
    `https://www.googleapis.com/customsearch/v1` +
    `?key=${apiKey}` +
    `&cx=${cseId}` +
    `&q=${encodeURIComponent(query)}` +
    `&num=5` +
    `&lr=lang_fr`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  return ((data.items ?? []) as Array<{
    title:   string;
    link:    string;
    snippet: string;
  }>).slice(0, 5).map((item) => ({
    title:   item.title   ?? "",
    link:    item.link    ?? "",
    snippet: item.snippet ?? "",
    source:  (() => {
      try { return new URL(item.link).hostname; }
      catch { return item.link; }
    })(),
  }));
}
