/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/hooks/useProperties.ts
 *  Étape 15 — Réécriture avec TanStack Query
 *
 *  Bénéfices :
 *    • Déduplication des requêtes (même clé = 1 fetch)
 *    • Cache 5 min stale + 24 h en mémoire
 *    • Persistance AsyncStorage → données hors-ligne
 *    • Invalidation ciblée via queryClient
 *    • Optimistic updates pour les favoris
 *
 *  API externe inchangée pour compatibilité avec
 *  les écrans existants.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { QK } from "../lib/queryKeys";
import { supabase } from "../lib/supabase";
import {
  getFeaturedProperties,
  getRecentProperties,
  searchProperties,
  getPropertyById,
  getProperties,
  type Property,
  type SearchParams,
  type PaginatedResult,
  type PropertyFilters,
} from "../services/propertyService";

// ═══════════════════════════════════════════════════════════════════════
//  useFeaturedProperties
//  Cache 5 min · Persisté · Scroll carrousel accueil
// ═══════════════════════════════════════════════════════════════════════

export function useFeaturedProperties(limit = 5) {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: QK.featured(limit),
    queryFn:  () => getFeaturedProperties(limit),
  });

  return {
    data:    data as Property[],
    loading: isLoading,
    error:   error ? (error as Error).message : null,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  useRecentProperties
//  Cache 5 min · Persisté · Section "Dernières annonces"
// ═══════════════════════════════════════════════════════════════════════

export function useRecentProperties(limit = 10) {
  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: QK.recent(limit),
    queryFn:  () => getRecentProperties(limit),
  });

  return {
    data:    data as Property[],
    loading: isLoading,
    error:   error ? (error as Error).message : null,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  useSearchProperties
//  staleTime 2 min · Les params déboncés viennent de l'écran
// ═══════════════════════════════════════════════════════════════════════

export function useSearchProperties(params: SearchParams): {
  data:    Property[];
  total:   number;
  hasMore: boolean;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
} {
  const { data, isFetching, error, refetch } = useQuery<PaginatedResult<Property>>({
    queryKey: QK.search(params),
    queryFn:  () => searchProperties(params),
    staleTime: 2 * 60 * 1000,
  });

  return {
    data:    data?.data    ?? [],
    total:   data?.total   ?? 0,
    hasMore: data?.hasMore ?? false,
    loading: isFetching,
    error:   error ? (error as Error).message : null,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  usePropertyDetail
//  Cache 10 min par propriété · Enregistre la vue analytics
// ═══════════════════════════════════════════════════════════════════════

export function usePropertyDetail(
  id:        string | undefined,
  userId?:   string,
  _currency?: string    // conservé pour compatibilité
): {
  data:    Property | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
} {
  const { data = null, isLoading, error, refetch } = useQuery<Property | null>({
    queryKey: QK.detail(id ?? ""),
    queryFn:  () => getPropertyById(id!, userId),
    enabled:  !!id,
    staleTime: 10 * 60 * 1000,  // 10 min — les détails changent peu
  });

  return {
    data:    data,
    loading: isLoading,
    error:   error
      ? (error as Error).message
      : data === null && !isLoading && !!id
        ? "Annonce introuvable."
        : null,
    refetch,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  useInfiniteProperties
//  Scroll infini paginé · 20 items/page · Persisté
// ═══════════════════════════════════════════════════════════════════════

export function useInfiniteProperties(filters: PropertyFilters = {}): {
  properties:   Property[];
  total:        number;
  hasMore:      boolean;
  loading:      boolean;
  loadingMore:  boolean;
  error:        string | null;
  loadMore:     () => void;
  reset:        () => void;
} {
  const PAGE_SIZE = 20;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    error,
    refetch,
  } = useInfiniteQuery<PaginatedResult<Property>>({
    queryKey:         QK.infinite(filters),
    queryFn:          ({ pageParam }) =>
      getProperties(filters, pageParam as number, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
  });

  const properties = data?.pages.flatMap((p) => p.data) ?? [];
  const lastPage   = data?.pages[data.pages.length - 1];

  return {
    properties,
    total:       lastPage?.total        ?? 0,
    hasMore:     hasNextPage            ?? false,
    loading:     isFetching && !isFetchingNextPage,
    loadingMore: isFetchingNextPage,
    error:       error ? (error as Error).message : null,
    loadMore:    () => {
      if (hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
    reset: () => refetch(),
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  useFavoriteToggle
//  useQuery initial state + useMutation avec optimistic update
// ═══════════════════════════════════════════════════════════════════════

export function useFavoriteToggle(
  userId:     string | undefined,
  propertyId: string
): {
  isFav:   boolean;
  loading: boolean;
  toggle:  () => void;
} {
  const qc = useQueryClient();

  // ── Chargement de l'état initial ──────────────────────────────────
  const { data: isFav = false, isLoading: loadingInit } = useQuery<boolean>({
    queryKey: QK.favorite(userId ?? "", propertyId),
    queryFn:  async () => {
      if (!userId) return false;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id",     userId)
        .eq("property_id", propertyId)
        .maybeSingle();
      return !!data;
    },
    enabled:  !!userId,
    staleTime: 5 * 60 * 1000,
  });

  // ── Mutation avec optimistic update ───────────────────────────────
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id",     userId)
          .eq("property_id", propertyId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .upsert(
            { user_id: userId, property_id: propertyId },
            { onConflict: "user_id,property_id", ignoreDuplicates: true }
          );
        if (error) throw error;
      }
    },

    onMutate: async () => {
      // Annuler les requêtes en vol pour éviter les conflits
      const key = QK.favorite(userId ?? "", propertyId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<boolean>(key);
      // Mise à jour optimiste instantanée
      qc.setQueryData(key, !prev);
      return { prev };
    },

    onError: (_err, _vars, context) => {
      // Rollback si erreur
      if (context?.prev !== undefined) {
        qc.setQueryData(QK.favorite(userId ?? "", propertyId), context.prev);
      }
    },
  });

  return {
    isFav,
    loading: loadingInit || isPending,
    toggle:  () => mutate(),
  };
}
