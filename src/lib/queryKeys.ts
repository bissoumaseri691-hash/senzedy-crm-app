/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/lib/queryKeys.ts
 *  Étape 15 — Clés de cache TanStack Query
 *
 *  Centralise toutes les query keys pour éviter les
 *  typos et permettre l'invalidation ciblée.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import type { PropertyFilters, SearchParams } from "../services/propertyService";

export const QK = {
  /** Biens en vedette (accueil hero) */
  featured:   (limit: number)               => ["properties", "featured",   limit]   as const,

  /** Dernières annonces (accueil liste) */
  recent:     (limit: number)               => ["properties", "recent",     limit]   as const,

  /** Détail d'un bien par UUID */
  detail:     (id: string)                  => ["properties", "detail",     id]      as const,

  /** Scroll infini avec filtres */
  infinite:   (filters: PropertyFilters)    => ["properties", "infinite",   filters] as const,

  /** Recherche full-text + filtres */
  search:     (params: SearchParams)        => ["properties", "search",     params]  as const,

  /** État favori d'un bien pour un utilisateur */
  favorite:   (userId: string, pid: string) => ["favorites",  userId,       pid]     as const,
} as const;
