/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/lib/queryClient.ts
 *  Étape 15 — Configuration TanStack Query
 *
 *  • staleTime  5 min  → données considérées fraîches
 *  • gcTime    24 h   → données gardées en mémoire
 *  • retry      2     → 2 tentatives avant erreur
 *  • refetchOnWindowFocus false → pas de re-fetch au focus
 *  • refetchOnReconnect "always" → rafraîchit à la reconnexion
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            5 * 60 * 1000,        // 5 minutes
      gcTime:               24 * 60 * 60 * 1000,  // 24 heures
      retry:                2,
      retryDelay:           (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      refetchOnWindowFocus: false,
      refetchOnReconnect:   "always",
    },
  },
});
