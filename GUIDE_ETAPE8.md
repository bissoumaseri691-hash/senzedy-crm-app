# Étape 8 — Filtres & Recherche : Guide d'intégration

## Fichiers à placer

| Fichier ZIP | Destination |
|-------------|-------------|
| `src/components/FilterBar.tsx` | → `src/components/FilterBar.tsx` (nouveau) |
| `src/screens/SearchScreen.tsx` | → remplace l'existant |

---

## Architecture des composants

```
FilterBar.tsx — exports
│
├── FilterBar              ← barre chips horizontale
├── AdvancedFilterModal    ← modal filtres avancés
├── EmptyResults           ← état vide élégant
├── useFilters()           ← hook gestion d'état
├── formatCurrencyAmount() ← formatage USD/EUR
├── CURRENCIES             ← [USD, EUR]
├── CATEGORY_CHIPS         ← chips catégories
└── COMMUNES_RDC           ← groupes de communes
```

---

## Utilisation dans HomeScreen (mise à jour facultative)

```tsx
import { useFilters, AdvancedFilterModal, FilterBar } from "../components/FilterBar";

// Dans le composant :
const { filters, updateFilter, resetFilters, activeCount } = useFilters();
const [showModal, setShowModal] = useState(false);

// Intégrer le sélecteur de devise dans le header
// Passer currency au propertyService pour affichage des prix
```

---

## Fonctionnalités clés

### FilterBar
- Chips scrollables sans texte emoji (icônes `Ionicons` uniquement)
- Indicateur doré sur filtre actif
- Badge compteur en doré sur le bouton "Filtres"
- Catégories : Tous, Villas, Appartements, Maisons, Terrains, Bureaux, Locaux

### AdvancedFilterModal
- Animation spring à l'ouverture, ease-out à la fermeture
- **Devise** : USD / EUR avec taux de conversion indicatif (0.92)
- **Transaction** : Vente / Location
- **Catégorie** : chips avec icônes fines
- **Slider de prix** : double curseur natif `PanResponder`, plages adaptées à la devise
- **Commune** : barre de recherche + groupes (Kinshasa, Lubumbashi, Goma, Autres)
- **Chambres** : chips 1 à 5+
- **Surface** : chips 50 à 500 m²
- Footer : bouton Réinitialiser + bouton "Voir les résultats (N filtres)"

### SearchScreen
- Barre de recherche textuelle sur fond marron
- Badge devise active dans le header
- Compteur de résultats formaté
- Switch liste / grille
- Menu de tri : Pertinence, Plus récent, Prix croissant / décroissant
- Scroll infini avec `useInfiniteProperties`
- Squelettes de chargement
- EmptyResults avec bouton reset si filtres actifs

### EmptyResults
- Ornement décoratif neutre (sans emoji)
- Message "Aucun bien ne correspond à vos critères actuels."
- Bouton reset visible seulement si des filtres sont actifs

---

## Note sur les prix EUR

Le taux USD → EUR est fixé à **0.92** (taux indicatif).
Pour la production, l'idéal est de récupérer le taux depuis une API (ex: exchangerate-api.com)
et de le stocker dans un contexte global.

```tsx
// src/context/CurrencyContext.tsx (à créer si besoin)
const { rate } = useCurrency(); // ex: { USD: 1, EUR: 0.92 }
```
