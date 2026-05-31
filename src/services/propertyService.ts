/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/services/propertyService.ts
 *
 *  Service de récupération et manipulation des biens
 *  immobiliers depuis Supabase.
 *
 *  Fonctions exportées :
 *    getProperties(filters?, pagination?)  → liste paginée
 *    getFeaturedProperties()               → 5 villas en vedette
 *    searchProperties(params)              → recherche filtrée
 *    getPropertyById(id)                   → détail d'un bien
 *    getPropertyBySlug(slug)               → détail par URL slug
 *    getRecentProperties(limit?)           → dernières annonces
 *    getSimilarProperties(id, category)    → biens similaires
 *    getPropertiesByAgent(agentId)         → biens d'un agent
 *    getPropertyStats()                    → compteurs dashboard
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { supabase } from "../lib/supabase";
import type {
  TransactionType,
  PropertyCategory,
  PropertyStatus,
  PropertyWithAgent,
  Currency,
} from "../types/database";

// ═══════════════════════════════════════════════════════════════════════
//  INTERFACES MÉTIER
// ═══════════════════════════════════════════════════════════════════════

/**
 * Interface principale Property — correspond à la vue
 * `properties_with_agent` qui joint la table `properties`
 * avec `profiles` (agent responsable).
 */
export interface Property {
  // ── Identification ────────────────────────────────────────────────
  id:           string;
  slug:         string | null;

  // ── Contenu ───────────────────────────────────────────────────────
  title:        string;
  description:  string | null;

  // ── Prix ──────────────────────────────────────────────────────────
  price:        number;
  currency:     Currency;

  // ── Classification ────────────────────────────────────────────────
  /** "vente" | "location" */
  transaction:  TransactionType;
  /** "appartement" | "villa" | "maison" | "terrain" | "bureau" | "local" | "entrepot" | "hotel" */
  category:     PropertyCategory;
  /** "disponible" | "reserve" | "vendu" | "loue" */
  status:       PropertyStatus;

  // ── Localisation ──────────────────────────────────────────────────
  commune:      string | null;
  quartier:     string | null;
  address:      string | null;

  // ── Caractéristiques ──────────────────────────────────────────────
  surface_m2:   number | null;
  bedrooms:     number | null;
  bathrooms:    number | null;
  floors:       number | null;

  // ── Médias ────────────────────────────────────────────────────────
  /** Tableau d'URLs publiques (Supabase Storage) */
  images:       string[];
  video_url:    string | null;

  // ── Flags ─────────────────────────────────────────────────────────
  is_featured:  boolean;
  is_published: boolean;

  // ── Statistiques ──────────────────────────────────────────────────
  views_count:  number;

  // ── Agent (jointure via vue properties_with_agent) ────────────────
  agent_id:     string | null;
  agent_name:   string | null;
  agent_avatar: string | null;
  agent_phone:  string | null;

  // ── Timestamps ────────────────────────────────────────────────────
  created_at:   string;
  updated_at:   string;
}

/** Résultat paginé générique */
export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  hasMore:    boolean;
}

/** Résultat d'un appel service */
export interface ServiceResult<T> {
  data:    T | null;
  error:   string | null;
  loading: false;
}

// ─── Paramètres de filtre ─────────────────────────────────────────────

export interface PropertyFilters {
  /** "vente" | "location" */
  transaction?:  TransactionType;
  /** Catégorie de bien */
  category?:     PropertyCategory;
  /** Nom de la commune (ex: "Ngaliema") */
  commune?:      string;
  /** Prix minimum en USD */
  minPrice?:     number;
  /** Prix maximum en USD */
  maxPrice?:     number;
  /** Surface minimum en m² */
  minSurface?:   number;
  /** Nombre de chambres minimum */
  bedrooms?:     number;
  /** Uniquement les biens en vedette */
  isFeatured?:   boolean;
  /** Recherche full-text (titre + description + commune) */
  searchQuery?:  string;
  /** Statut du bien */
  status?:       PropertyStatus;
}

export interface SearchParams extends PropertyFilters {
  page?:     number;
  pageSize?: number;
  orderBy?:  "price_asc" | "price_desc" | "newest" | "featured";
}

// ─── Constantes ───────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 20;
const FEATURED_LIMIT    = 5;
const RECENT_LIMIT      = 10;

const VIEW_COLUMNS = `
  id, slug, title, description,
  price, currency, transaction, category, status,
  commune, quartier, address,
  surface_m2, bedrooms, bathrooms, floors,
  images, video_url,
  is_featured, is_published, views_count,
  agent_id, agent_name, agent_avatar, agent_phone,
  created_at, updated_at
` as const;

// ═══════════════════════════════════════════════════════════════════════
//  HELPERS INTERNES
// ═══════════════════════════════════════════════════════════════════════

/** Applique tous les filtres sur une query Supabase */
function applyFilters(
  query: ReturnType<typeof supabase.from<any, any>>,
  filters: PropertyFilters
) {
  if (filters.transaction)  query = (query as any).eq("transaction", filters.transaction);
  if (filters.category)     query = (query as any).eq("category",    filters.category);
  if (filters.commune)      query = (query as any).ilike("commune",  `%${filters.commune}%`);
  if (filters.minPrice)     query = (query as any).gte("price",      filters.minPrice);
  if (filters.maxPrice)     query = (query as any).lte("price",      filters.maxPrice);
  if (filters.minSurface)   query = (query as any).gte("surface_m2", filters.minSurface);
  if (filters.bedrooms)     query = (query as any).gte("bedrooms",   filters.bedrooms);
  if (filters.status)       query = (query as any).eq("status",      filters.status);
  if (filters.isFeatured)   query = (query as any).eq("is_featured", true);
  if (filters.searchQuery?.trim()) {
    // Recherche full-text française via la colonne fts
    query = (query as any).textSearch("fts", filters.searchQuery.trim(), {
      config: "french",
      type:   "websearch",
    });
  }
  return query as any;
}

/** Applique le tri */
function applyOrder(query: any, orderBy?: SearchParams["orderBy"]) {
  switch (orderBy) {
    case "price_asc":  return query.order("price",      { ascending: true });
    case "price_desc": return query.order("price",      { ascending: false });
    case "newest":     return query.order("created_at", { ascending: false });
    case "featured":
    default:
      return query
        .order("is_featured", { ascending: false })
        .order("created_at",  { ascending: false });
  }
}

/** Formate l'erreur Supabase en message lisible */
function formatError(error: unknown): string {
  if (!error) return "Erreur inconnue";
  if (typeof error === "object" && "message" in (error as any)) {
    return (error as any).message as string;
  }
  return String(error);
}

// ═══════════════════════════════════════════════════════════════════════
//  FONCTIONS PUBLIQUES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Récupère une liste paginée de biens avec filtres optionnels.
 *
 * @example
 * const { data, total } = await getProperties({ transaction: "vente", commune: "Gombe" });
 */
export async function getProperties(
  filters: PropertyFilters = {},
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Property>> {
  try {
    // Requête comptage
    let countQuery = supabase
      .from("properties_with_agent")
      .select("id", { count: "exact", head: true });
    countQuery = applyFilters(countQuery as any, filters) as any;
    const { count } = await countQuery;

    // Requête données
    let dataQuery = supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    dataQuery = applyFilters(dataQuery as any, filters) as any;
    dataQuery = applyOrder(dataQuery, "featured");

    const { data, error } = await dataQuery;

    if (error) throw error;

    const total = count ?? 0;
    return {
      data:     (data ?? []) as Property[],
      total,
      page,
      pageSize,
      hasMore:  (page + 1) * pageSize < total,
    };
  } catch (e) {
    console.error("[propertyService] getProperties:", e);
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère les 5 biens en vedette pour le Hero de l'accueil.
 * Priorité : is_featured=true, villas, status disponible, plus récents.
 *
 * @example
 * const featured = await getFeaturedProperties();
 */
export async function getFeaturedProperties(
  limit = FEATURED_LIMIT
): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("is_featured",  true)
      .eq("is_published", true)
      .eq("status",       "disponible")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Si moins de 5 biens en vedette, compléter avec des villas récentes
    if ((data?.length ?? 0) < limit) {
      const needed  = limit - (data?.length ?? 0);
      const existingIds = (data ?? []).map((p: any) => p.id);

      const { data: extra } = await supabase
        .from("properties_with_agent")
        .select(VIEW_COLUMNS)
        .eq("is_published", true)
        .eq("status",       "disponible")
        .in("category",     ["villa", "maison"])
        .not("id",          "in", `(${existingIds.join(",") || "null"})`)
        .order("created_at", { ascending: false })
        .limit(needed);

      return [...(data ?? []), ...(extra ?? [])] as Property[];
    }

    return (data ?? []) as Property[];
  } catch (e) {
    console.error("[propertyService] getFeaturedProperties:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Fonction principale de recherche pour la barre de l'accueil.
 * Combine type de transaction, commune, et filtres avancés.
 *
 * @example
 * const results = await searchProperties({
 *   transaction: "vente",
 *   commune: "Ngaliema",
 *   minPrice: 50000,
 *   maxPrice: 200000,
 *   category: "villa",
 *   page: 0,
 * });
 */
export async function searchProperties(
  params: SearchParams
): Promise<PaginatedResult<Property>> {
  const {
    page     = 0,
    pageSize = DEFAULT_PAGE_SIZE,
    orderBy  = "featured",
    ...filters
  } = params;

  try {
    // Comptage
    let countQuery = supabase
      .from("properties_with_agent")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true);
    countQuery = applyFilters(countQuery as any, filters) as any;
    const { count } = await countQuery;

    // Données
    let dataQuery = supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("is_published", true)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    dataQuery = applyFilters(dataQuery as any, filters) as any;
    dataQuery = applyOrder(dataQuery, orderBy);

    const { data, error } = await dataQuery;

    if (error) throw error;

    const total = count ?? 0;
    return {
      data:    (data ?? []) as Property[],
      total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < total,
    };
  } catch (e) {
    console.error("[propertyService] searchProperties:", e);
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère les dernières annonces publiées.
 * Utilisé dans la section "Nouvelles annonces" de l'accueil.
 */
export async function getRecentProperties(
  limit = RECENT_LIMIT
): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("is_published", true)
      .eq("status",       "disponible")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as Property[];
  } catch (e) {
    console.error("[propertyService] getRecentProperties:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère le détail complet d'un bien par son UUID.
 * Enregistre aussi une vue (analytics).
 */
export async function getPropertyById(
  id: string,
  userId?: string
): Promise<Property | null> {
  try {
    const { data, error } = await supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Tracking de la vue (non-bloquant)
    (async () => {
      try {
        await supabase
          .from("property_views")
          .upsert(
            { property_id: id, user_id: userId ?? null },
            { onConflict: "property_id,user_id", ignoreDuplicates: true }
          );
      } catch { /* fire-and-forget */ }
    })().catch(() => {});

    return data as Property;
  } catch (e) {
    console.error("[propertyService] getPropertyById:", e);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère un bien par son slug (URL-friendly).
 * Plus adapté pour le partage de liens.
 */
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  try {
    const { data, error } = await supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data as Property;
  } catch (e) {
    console.error("[propertyService] getPropertyBySlug:", e);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère des biens similaires (même catégorie + même commune).
 * Affiché en bas de l'écran de détail.
 */
export async function getSimilarProperties(
  currentId: string,
  category:  PropertyCategory,
  commune?:  string | null,
  limit = 4
): Promise<Property[]> {
  try {
    let query = supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("is_published", true)
      .eq("status",       "disponible")
      .eq("category",     category)
      .neq("id",          currentId)
      .limit(limit);

    if (commune) query = query.eq("commune", commune);

    const { data, error } = await query;

    if (error) throw error;

    // Si pas assez de résultats dans la même commune, élargir à toute la BD
    if ((data?.length ?? 0) < limit) {
      const needed     = limit - (data?.length ?? 0);
      const existingIds = [currentId, ...(data ?? []).map((p: any) => p.id)];

      const { data: extra } = await supabase
        .from("properties_with_agent")
        .select(VIEW_COLUMNS)
        .eq("is_published", true)
        .eq("category",     category)
        .not("id", "in",    `(${existingIds.join(",")})`)
        .limit(needed);

      return [...(data ?? []), ...(extra ?? [])] as Property[];
    }

    return (data ?? []) as Property[];
  } catch (e) {
    console.error("[propertyService] getSimilarProperties:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère tous les biens d'un agent spécifique.
 * Utilisé dans le profil agent.
 */
export async function getPropertiesByAgent(
  agentId: string,
  page = 0,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Property>> {
  try {
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("agent_id", agentId);

    const { data, error } = await supabase
      .from("properties_with_agent")
      .select(VIEW_COLUMNS)
      .eq("agent_id",    agentId)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    const total = count ?? 0;
    return {
      data:    (data ?? []) as Property[],
      total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < total,
    };
  } catch (e) {
    console.error("[propertyService] getPropertiesByAgent:", e);
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Statistiques globales pour le dashboard admin/agent.
 * Retourne les compteurs par statut et par transaction.
 */
export interface PropertyStats {
  total:        number;
  disponibles:  number;
  vendus:       number;
  loues:        number;
  reserves:     number;
  enVente:      number;
  enLocation:   number;
  featured:     number;
}

export async function getPropertyStats(): Promise<PropertyStats> {
  const zero: PropertyStats = {
    total: 0, disponibles: 0, vendus: 0, loues: 0,
    reserves: 0, enVente: 0, enLocation: 0, featured: 0,
  };

  try {
    const { data, error } = await supabase
      .from("properties")
      .select("status, transaction, is_featured");

    if (error || !data) throw error;

    return data.reduce((acc, row: any) => ({
      total:       acc.total + 1,
      disponibles: acc.disponibles + (row.status      === "disponible" ? 1 : 0),
      vendus:      acc.vendus      + (row.status      === "vendu"      ? 1 : 0),
      loues:       acc.loues       + (row.status      === "loue"       ? 1 : 0),
      reserves:    acc.reserves    + (row.status      === "reserve"    ? 1 : 0),
      enVente:     acc.enVente     + (row.transaction === "vente"      ? 1 : 0),
      enLocation:  acc.enLocation  + (row.transaction === "location"   ? 1 : 0),
      featured:    acc.featured    + (row.is_featured                  ? 1 : 0),
    }), zero);
  } catch (e) {
    console.error("[propertyService] getPropertyStats:", e);
    return zero;
  }
}

// ──────────────────────────────────────────────────────────────────────

/**
 * Récupère les biens favoris d'un utilisateur avec détails complets.
 */
export async function getFavoriteProperties(userId: string): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select(`property_id, properties_with_agent (${VIEW_COLUMNS})`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? [])
      .map((row: any) => row.properties_with_agent)
      .filter(Boolean) as Property[];
  } catch (e) {
    console.error("[propertyService] getFavoriteProperties:", e);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────────────

// ── Aliases pour compatibilité avec les imports existants ─────────────

/** Alias de getProperties (compatibilité SearchScreen) */
export const fetchProperties = getProperties;

/** Alias de getSimilarProperties avec paramètre currency optionnel ignoré */
export async function fetchSimilarProperties(
  currentId: string,
  category:  PropertyCategory,
  commune?:  string | null,
  limit = 4,
  _currency?: string
): Promise<Property[]> {
  return getSimilarProperties(currentId, category, commune, limit);
}

/** Formate le prix avec séparateurs */
export function formatPrice(price: number, currency: Currency = "USD"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(price);
  return currency === "USD" ? `$${formatted}` : `${formatted} CDF`;
}

/** Retourne la première image ou chaîne vide */
export function getMainImage(property: Property): string {
  return property.images?.[0] ?? "";
}

/** Calcule le libellé relatif de date — accepte un t() optionnel pour i18n */
export function getDaysAgo(createdAt: string, t?: (key: string, opts?: any) => string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (t) {
    if (days === 0) return t("dates.today");
    if (days === 1) return t("dates.yesterday");
    if (days < 7)   return t("dates.daysAgo", { count: days });
    if (days < 30)  return t("dates.weeksAgo", { count: Math.floor(days / 7) });
    return t("dates.monthsAgo", { count: Math.floor(days / 30) });
  }
  // Fallback without translation (French)
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7)   return `Il y a ${days} jours`;
  if (days < 30)  return `Il y a ${Math.floor(days / 7)} semaine(s)`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

/** Construit un résumé compact des caractéristiques — accepte un t() optionnel pour i18n */
export function getFeaturesSummary(property: Property, t?: (key: string) => string): string {
  const bdAbbr   = t ? t("common.bedroomsAbbr") : "ch.";
  const bathAbbr = t ? t("common.bathroomsAbbr") : "sdb";
  const parts: string[] = [];
  if (property.surface_m2) parts.push(`${property.surface_m2} m²`);
  if (property.bedrooms)   parts.push(`${property.bedrooms} ${bdAbbr}`);
  if (property.bathrooms)  parts.push(`${property.bathrooms} ${bathAbbr}`);
  return parts.join("  ·  ");
}

// ─────────────────────────────────────────────────────────────────────

/**
 * Utilitaires de formatage à utiliser dans les écrans.
 */
export const PropertyUtils = {
  /** Formate le prix avec séparateurs de milliers */
  formatPrice(price: number, currency: Currency = "USD"): string {
    const formatted = new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: 0,
    }).format(price);
    return currency === "USD" ? `$${formatted}` : `${formatted} CDF`;
  },

  /** Retourne la première image ou un placeholder */
  getMainImage(property: Property): string {
    return property.images?.[0] ?? "";
  },

  /** Retourne le label lisible d'une catégorie */
  getCategoryLabel(category: PropertyCategory): string {
    const labels: Record<PropertyCategory, string> = {
      appartement: "Appartement",
      villa:       "Villa",
      maison:      "Maison",
      terrain:     "Terrain",
      bureau:      "Bureau",
      local:       "Local commercial",
      entrepot:    "Entrepôt",
      hotel:       "Hôtel",
    };
    return labels[category] ?? category;
  },

  /** Retourne le label de transaction */
  getTransactionLabel(transaction: TransactionType): string {
    return transaction === "vente" ? "À Vendre" : "À Louer";
  },

  /** Retourne la couleur du badge de statut */
  getStatusColor(status: PropertyStatus): string {
    const colors: Record<PropertyStatus, string> = {
      disponible: "#27AE60",
      reserve:    "#F39C12",
      vendu:      "#7F8C8D",
      loue:       "#2980B9",
    };
    return colors[status] ?? "#7F8C8D";
  },

  /** Retourne le label de statut */
  getStatusLabel(status: PropertyStatus): string {
    const labels: Record<PropertyStatus, string> = {
      disponible: "Disponible",
      reserve:    "Réservé",
      vendu:      "Vendu",
      loue:       "Loué",
    };
    return labels[status] ?? status;
  },

  /** Construit un résumé compact des caractéristiques */
  getFeaturesSummary(property: Property, t?: (key: string) => string): string {
    const bdAbbr   = t ? t("common.bedroomsAbbr") : "ch.";
    const bathAbbr = t ? t("common.bathroomsAbbr") : "sdb";
    const parts: string[] = [];
    if (property.surface_m2) parts.push(`${property.surface_m2} m²`);
    if (property.bedrooms)   parts.push(`${property.bedrooms} ${bdAbbr}`);
    if (property.bathrooms)  parts.push(`${property.bathrooms} ${bathAbbr}`);
    return parts.join("  ·  ");
  },

  /** Calcule combien de jours depuis la publication */
  getDaysAgo(createdAt: string, t?: (key: string, opts?: any) => string): string {
    const diff = Date.now() - new Date(createdAt).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (t) {
      if (days === 0) return t("dates.today");
      if (days === 1) return t("dates.yesterday");
      if (days < 7)   return t("dates.daysAgo", { count: days });
      if (days < 30)  return t("dates.weeksAgo", { count: Math.floor(days / 7) });
      return t("dates.monthsAgo", { count: Math.floor(days / 30) });
    }
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7)   return `Il y a ${days} jours`;
    if (days < 30)  return `Il y a ${Math.floor(days / 7)} semaine(s)`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  },
} as const;
