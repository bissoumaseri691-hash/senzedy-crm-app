# Étape 6 — Service & Hooks : Guide d'intégration

## Fichiers à placer

| Fichier ZIP | Destination |
|-------------|-------------|
| `src/services/propertyService.ts` | → `src/services/propertyService.ts` (nouveau dossier) |
| `src/hooks/useProperties.ts`      | → `src/hooks/useProperties.ts` |
| `src/screens/HomeScreen.tsx`      | → remplace l'existant |

## Créer le dossier services
```bash
mkdir src/services
```

---

## Architecture du service

```
propertyService.ts
│
├── Interface Property        ← type métier complet (id, title, price, transaction...)
├── PropertyFilters           ← paramètres de filtre
├── SearchParams              ← filtre + pagination + tri
├── PaginatedResult<T>        ← { data, total, page, hasMore }
│
├── getProperties()           ← liste paginée avec filtres
├── getFeaturedProperties()   ← 5 biens en vedette (home hero)
├── searchProperties()        ← barre de recherche complète
├── getRecentProperties()     ← dernières annonces
├── getPropertyById()         ← détail + tracking vue
├── getPropertyBySlug()       ← détail par URL
├── getSimilarProperties()    ← recommandations
├── getPropertiesByAgent()    ← portefeuille agent
├── getFavoriteProperties()   ← favoris utilisateur
├── getPropertyStats()        ← dashboard admin
│
└── PropertyUtils             ← formatPrice, getMainImage, getCategoryLabel...
```

## Architecture des hooks

```
useProperties.ts
│
├── useFeaturedProperties(limit?)   → { data, loading, error, refetch }
├── useRecentProperties(limit?)     → { data, loading, error, refetch }
├── useSearchProperties(params)     → { data, total, hasMore, loading, error }
│                                     ↑ Debounce 400ms intégré
├── usePropertyDetail(id, userId?)  → { data, loading, error, refetch }
└── useInfiniteProperties(filters)  → { properties, loadMore, hasMore, loading }
                                      ↑ Pour FlatList avec scroll infini
```

## Utilisation dans un écran

```tsx
// Biens en vedette
const { data: featured, loading } = useFeaturedProperties(5);

// Recherche
const { data, total } = useSearchProperties({
  transaction: "vente",
  commune: "Gombe",
  minPrice: 50000,
  page: 0,
});

// Détail
const { data: property } = usePropertyDetail(propertyId, userId);

// Scroll infini
const { properties, loadMore, hasMore } = useInfiniteProperties({ transaction: "vente" });
// → onEndReached={loadMore} dans FlatList
```

## Logique getFeaturedProperties()
1. Cherche d'abord les biens `is_featured=true`
2. Si moins de 5 résultats → complète avec des villas/maisons récentes
3. Garantit toujours `limit` biens (sauf si la BD est vide)
