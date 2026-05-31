# Étape 7 — Écran de Détail : Guide d'intégration

## Fichiers à placer

| Fichier ZIP | Destination |
|-------------|-------------|
| `src/screens/PropertyDetailScreen.tsx` | → `src/screens/PropertyDetailScreen.tsx` (nouveau) |
| `src/navigation/AppNavigator.tsx`      | → remplace l'existant |
| `src/theme/colors.ts`                  | → remplace l'existant |

## Activer la navigation depuis HomeScreen

Ajouter dans `src/screens/HomeScreen.tsx` :

### 1. Imports
```tsx
import { useNavigation } from "@react-navigation/native";
import type { MainStackNavProp } from "../navigation/AppNavigator";
```

### 2. Dans le composant
```tsx
const navigation = useNavigation<MainStackNavProp>();

const goToDetail = useCallback((propertyId: string) => {
  navigation.navigate("PropertyDetail", { propertyId });
}, [navigation]);
```

### 3. Sur chaque card
```tsx
// FeaturedCard et CompactPropertyCard
<TouchableOpacity onPress={() => goToDetail(property.id)} ...>
```

---

## Ce que contient PropertyDetailScreen

### Galerie photos
- ScrollView horizontal paginé avec `expo-image`
- Dégradés haut (boutons) + bas (transition)
- Indicateurs dots animés
- Compteur "1 / N"
- Badge "EN VEDETTE" et badge transaction
- **Tap sur photo → Modal galerie plein écran** avec thumbnails

### Header flottant
- Apparaît progressivement au scroll (`Animated.interpolate`)
- Titre de la propriété + bouton retour + partage natif (`Share.share`)

### Contenu
- Prix avec badge transaction coloré
- Badge statut (Disponible / Réservé / Vendu)
- Grille de caractéristiques (surface, chambres, sdb, étages, type, date)
- Description avec "Lire la suite" expandable
- Bloc localisation avec bouton "Carte"
- Card agent : avatar initiales ou photo, statut en ligne, boutons Appeler + Message

### Biens similaires
- Scroll horizontal, même catégorie + commune
- Fallback sur toute la BD si pas assez localement

### CTA sticky
- Bouton favori (toggle avec state Supabase)
- Bouton "CONTACTER L'AGENT" → **Modal contact**

### Modal contact
- Formulaire : nom, téléphone, message pré-rempli
- Envoi dans la table `contact_requests`
- Confirmation + fermeture automatique

### États de chargement
- `LoadingScreen` : logo SA + ActivityIndicator
- `ErrorScreen` : icône alerte + bouton Réessayer
