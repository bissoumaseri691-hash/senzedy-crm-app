/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/types/property.ts
 *  Types métier Property + constantes UI
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ── Re-export des types database ─────────────────────────────────────
export type {
  TransactionType,
  PropertyCategory,
  PropertyStatus,
  Currency,
} from "./database";

// ── Re-export du type Property depuis le service ──────────────────────
export type {
  Property,
  PropertyFilters,
  SearchParams,
  PaginatedResult,
} from "../services/propertyService";

// ── Constantes UI ─────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  appartement: "Appartement",
  villa:       "Villa",
  maison:      "Maison",
  terrain:     "Terrain",
  bureau:      "Bureau",
  local:       "Local commercial",
  entrepot:    "Entrepôt",
  hotel:       "Hôtel",
};

export const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible",
  reserve:    "Réservé",
  vendu:      "Vendu",
  loue:       "Loué",
};

export const STATUS_COLORS: Record<string, string> = {
  disponible: "#27AE60",
  reserve:    "#F39C12",
  vendu:      "#7F8C8D",
  loue:       "#2980B9",
};

export const TRANSACTION_LABELS: Record<string, string> = {
  vente:    "À Vendre",
  location: "À Louer",
};
