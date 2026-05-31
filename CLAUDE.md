# CLAUDE.md — Senzedy Agency
> Fichier de contexte projet — mis à jour à chaque évolution majeure.

---

## Projet

Application mobile **React Native / Expo** pour une agence immobilière de luxe à **Kinshasa, RDC**.
Clients cibles : acheteurs et locataires premium (villas, appartements, terrains).

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81.5 |
| Langage | TypeScript strict |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Styling | NativeWind v4 (Tailwind CSS for RN) |
| Navigation | React Navigation v7 |
| Gradients | expo-linear-gradient |
| Icons | @expo/vector-icons (Ionicons) |
| Fonts | Cormorant (serif) + Raleway (sans) |
| Storage local | @react-native-async-storage/async-storage |
| Sécurité | expo-secure-store |
| Notifications | expo-notifications |
| IA | Claude API (claude-haiku-4-5-20251001) |
| Recherche | Google Custom Search JSON API |

---

## Palette de Couleurs (OFFICIELLE — ne pas modifier)

```
BG sombre (dark screens)  : #0E0705
Surface                   : #1A0F0A
Surface 2                 : #221510

brown.DEFAULT             : #3B1F1A
brown.dark                : #2A1510
brown.medium              : #5C2E24
brown.light               : #7A3B2E

gold.DEFAULT              : #C9943A
gold.light                : #D4A85A
gold.pale                 : #E8C97E

cream.DEFAULT             : #F2EBD9
cream.light               : #F8F4EC
cream.dark                : #DDD0B8

offwhite.DEFAULT          : #FAF7F2
text.primary              : #2A1510
text.secondary            : #7A6050
text.muted                : #A08070
border.DEFAULT            : #DDD0B8
surface                   : #FAF7F2
maroon                    : #6D433C
```

---

## Structure de Navigation

```
App.tsx  (NavigationContainer + AuthProvider)
  └── RootNavigator
        ├── [loading]       → SplashScreen (dark #0E0705)
        ├── [non connecté]  → AuthScreen (Magic Link OTP)
        └── [connecté]      → AppNavigator (MainStack)
              ├── DrawerRoot → DrawerNavigator (right drawer)
              │     └── MainTabs → BottomTabNavigator
              │           ├── Home
              │           ├── Search
              │           ├── Favorites
              │           ├── AIChat  (✦ — IA)
              │           ├── Profile
              │           └── Admin   (⊛ — visible si isAdmin=true)
              └── PropertyDetail  ← native stack, slide from right
```

**Deep linking scheme :** `senzedy://`
- `senzedy://bien/:propertyId` → PropertyDetailScreen

---

## Auth System

- **Magic Link OTP** (email) via `supabase.auth.signInWithOtp` + `verifyOtp`
- Rôles : `client` | `agent` | `admin` (champ `profiles.role`)
- `AuthContext` expose :
  - `user`, `profile`, `loading`, `isAdmin`, `isAgent`
  - `sendOtp(email)`, `verifyOtp(email, token)`
  - `signIn(email, password)` ← fallback mot de passe
  - `signUp(email, password, fullName, phone?)`
  - `resetPassword(email)`, `signOut()`, `refreshProfile()`

---

## Supabase Tables

### `profiles`
| Colonne | Type |
|---|---|
| id | uuid (PK, = auth.uid) |
| email | text |
| full_name | text nullable |
| phone | text nullable |
| avatar_url | text nullable |
| role | text ('client' / 'agent' / 'admin') |
| push_token | text nullable |
| created_at | timestamptz |

### `properties` / `properties_with_agent` (vue)
Colonnes principales : id, title, category, status, transaction_type, price, currency, commune, quartier, surface_m2, bedrooms, bathrooms, images[], is_featured, is_published, agent_id, created_at

### `favorites`
| Colonne | Type |
|---|---|
| id | uuid |
| user_id | uuid |
| property_id | uuid |
| created_at | timestamptz |

---

## Fonctionnalités Complétées

- [x] **Étape 1–6** : Écrans de base (Home, Search, Favorites, Profile, PropertyDetail)
- [x] **Étape 7** : Navigation complète (Drawer + Tabs + Stack)
- [x] **Étape 8** : Agent IA premium (Claude API + Google Custom Search)
  - `AIChatScreen.tsx` — dark premium design, animations fluides
  - `googleSearchService.ts` + `aiService.ts`
  - Bulles animées, suggestions, sources collapsibles
- [x] **Étape 8b** : Auth + Admin System
  - `AuthScreen.tsx` — Magic Link OTP, 3 étapes : email → OTP → connexion
  - `ProfileScreen.tsx` redesigné — 3 onglets : Profil / ✦ IA / Visites
  - `AdminDashboard.tsx` — KPIs, Leads IA, Gestion statuts biens
  - Onglet Admin : toujours enregistré dans le navigateur, `tabBarButton: () => null` si non-admin
- [x] **Étape 9** : Notifications & Alertes
  - `useNotifications.ts` — permissions, push token, deep link tap handler
  - `notificationService.ts` — local notifications + matching alertes
  - `navigationRef.ts` — ref global pour navigation hors composant
  - `linking.ts` — deep linking config
  - Switches notif dans ProfileScreen
- [x] **Étape 10** : Robustesse & Qualité
  - `ErrorBoundary.tsx` — Error Boundary global (écran de secours Senzedy)
  - `Skeleton.tsx` — SkeletonBox, SkeletonFeaturedCard, SkeletonRecentCard, SkeletonPropertyDetail
  - `OfflineBanner.tsx` — Bannière hors-ligne animée (slide-in/slide-out)
  - `useNetInfo.ts` — Détection connectivité (NetInfo + fallback web navigator.onLine)
  - HomeScreen : skeletons animés sur les sections En vedette + Dernières annonces
  - PropertyDetailScreen : ActivityIndicator → SkeletonPropertyDetail
  - SearchScreen : LoadingList → SkeletonRecentCard, footer ActivityIndicator → skeleton, validation 2+ chars

---

## Fichiers Clés

```
src/
  config/
    aiConfig.ts            ← Clés API (Anthropic, Google CSE)
  context/
    AuthContext.tsx         ← Auth complète (OTP + rôles)
  hooks/
    useProperties.ts        ← Hooks CRUD biens + favoris
    useNotifications.ts     ← Permissions + token + tap handler
    useNetInfo.ts           ← Détection connectivité réseau
  components/
    ErrorBoundary.tsx       ← Écran de secours global (class component)
    Skeleton.tsx            ← Composants squelette animés
    OfflineBanner.tsx       ← Bannière mode hors-ligne
    AdminGuard.tsx          ← Protection d'écran admin (sans useNavigation)
  navigation/
    AppNavigator.tsx        ← MainStack + BottomTabs + Drawer
    RootNavigator.tsx       ← Aiguillage auth/splash/app
    navigationRef.ts        ← Ref global NavigationContainer
    linking.ts              ← Config deep linking
  screens/
    HomeScreen.tsx
    SearchScreen.tsx
    FavoritesScreen.tsx
    PropertyDetailScreen.tsx
    AIChatScreen.tsx        ← Chat IA premium (dark)
    ProfileScreen.tsx       ← 3 onglets + notif switches
    AdminDashboard.tsx      ← Panel admin (3 onglets)
    auth/
      AuthScreen.tsx        ← Magic Link OTP
      LoginScreen.tsx       ← Fallback (legacy)
      RegisterScreen.tsx    ← Fallback (legacy)
  hooks/
    useAdmin.ts             ← { isAdmin, loading } depuis AuthContext
  services/
    authService.ts          ← fetchProfileWithRole, getMembersCount, getRecentMembers
    propertyService.ts      ← CRUD Supabase + helpers formatage
    aiService.ts            ← Orchestration Claude + Google Search
    googleSearchService.ts  ← Google Custom Search API
    notificationService.ts  ← Local notifs + alert matching
  theme/
    colors.ts               ← Palette officielle
    typography.ts           ← Cormorant + Raleway
    index.ts                ← Re-exports
  types/
    database.ts             ← Types Supabase (Profile, Property...)
    property.ts             ← Re-exports + UI constants (LABELS, COLORS)
  lib/
    supabase.ts             ← Client Supabase
    queryClient.ts          ← TanStack QueryClient (staleTime 5min, gcTime 24h)
    queryKeys.ts            ← Clés de cache centralisées (QK.*)
```

- [x] **Étape 15** : Performance & Cache
  - `@tanstack/react-query` + persistance AsyncStorage (hors-ligne 24h)
  - `src/lib/queryClient.ts` — QueryClient : staleTime 5 min, gcTime 24h, retry 2
  - `src/lib/queryKeys.ts` — Clés centralisées (featured, recent, detail, infinite, search, favorite)
  - `App.tsx` — PersistQueryClientProvider wrapping avec `senzedy-rq-v1` comme clé AsyncStorage
  - `src/hooks/useProperties.ts` réécriture complète : useQuery / useInfiniteQuery / useMutation
    - `useFeaturedProperties` / `useRecentProperties` : cache 5 min + persisté
    - `usePropertyDetail` : staleTime 10 min
    - `useInfiniteProperties` : useInfiniteQuery, initialPageParam 0
    - `useFavoriteToggle` : useMutation + optimistic update (rollback on error)
  - `HomeScreen.tsx` : vraies données Supabase (fin des données mock), expo-image + blurhash placeholder, FlatList horizontal optimisée (initialNumToRender:3, windowSize:3)
  - `SearchScreen.tsx` : FlatList optimisée (getItemLayout, windowSize:5, initialNumToRender:8, maxToRenderPerBatch:8, removeClippedSubviews Android), blurhash sur ResultCard
  - expo-image blurhash générique : `LEHV6nWB2yk8pyo0adR*.7kCMdnj` (warm neutral placeholder)

- [x] **Étape 11** : Sécurité Admin
  - `src/services/authService.ts` — fetchProfileWithRole, isRoleAdmin, getMembersCount, getRecentMembers
  - `src/hooks/useAdmin.ts` — `{ isAdmin, loading }` depuis AuthContext
  - `src/components/AdminGuard.tsx` — Protection de route (Alert + écran Accès Restreint)
  - `AdminDashboard.tsx` réécrit — données Supabase réelles, design noir profond
    - Stats Flash : vues totales (SUM views_count), favoris cumulés (COUNT favorites), biens actifs
    - Leads : derniers membres inscrits (profiles) + bouton Appeler (Linking tel:)
    - Inventaire : changement de statut en 1 clic via pills (UPDATE Supabase + rollback si erreur)
  - **Fix critique** : Tab Admin toujours enregistré dans BottomTabNavigator, `tabBarButton: () => null` pour masquer (évite re-registration React Navigation qui cassait tous les onglets)

---
## ⚠️ Règles de Navigation (IMPORTANT)

- **NE JAMAIS** utiliser `{condition && <Tab.Screen>}` pour masquer un onglet → casse les event handlers de React Navigation
- **Toujours** enregistrer tous les screens, utiliser `tabBarButton: () => null` pour masquer visuellement
- **NE JAMAIS** appeler `navigation.navigate()` dans un `useEffect` avec `navigation` dans les dépendances → boucle infinie potentielle
- `AdminGuard` : ne pas importer `useNavigation`, juste afficher un écran d'erreur

---
##Note : Pour les notifications push réelles (hors Expo Go), remplacez "your-expo-project-id" dans useNotifications.ts par l'ID obtenu via eas project:init.
## Conventions de Code

- Tous les écrans "dark" (AuthScreen, AIChatScreen, ProfileScreen, AdminDashboard) utilisent `BG = "#0E0705"` comme fond
- Les écrans "light" (Home, Search, Favorites) utilisent `colors.cream.DEFAULT`
- Toujours utiliser `StyleSheet.create` pour les styles complexes
- Animations : `Animated.spring` pour les entrées, `Animated.loop` pour les pulsations
- Pas de `console.log` en production — utiliser `console.warn` préfixé `[NomDuModule]`
- Les données mock sont préfixées `MOCK_` et seront remplacées par des appels Supabase réels

---

## Variables d'Environnement / Clés API (Étape 17 — Sécurisé)

- [x] **Étape 17** : Blindage sécurité complet
  - **RLS** : `supabase/rls_securite.sql` — politiques à exécuter dans Supabase Dashboard
    - `properties` : SELECT public, INSERT/UPDATE/DELETE admin/agent only
    - `contact_requests` : INSERT public, SELECT par utilisateur ou admin
    - `profiles` : protection contre l'auto-escalade de rôle (`role` ne peut être changé que par admin)
    - `ai_rate_limits` : accessible uniquement via service_role (Edge Function)
  - **Edge Function** : `supabase/functions/ai-chat/index.ts` (Deno TypeScript)
    - Proxy Anthropic + Google Search côté serveur
    - Rate limiting : 10 messages/minute par user_id ou IP (table `ai_rate_limits`)
    - Les clés API ne quittent jamais le serveur
  - **`src/services/aiService.ts`** : appel Edge Function via `supabase.functions.invoke("ai-chat")`
  - **`src/config/aiConfig.ts`** : clés API supprimées (ne jamais les remettre ici)
  - **`src/services/googleSearchService.ts`** : recherche déplacée côté serveur, fichier conservé pour le type `SearchResult`
  - **Guide** : `supabase/GUIDE_SECURITE.md` — déploiement pas à pas

**⚠️ Architecture IA sécurisée :**
```
📱 Téléphone → supabase.functions.invoke("ai-chat") → 🔒 Edge Function → 🤖 Anthropic API
```

**Supabase Secrets à configurer (jamais dans le code) :**
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx
supabase secrets set GOOGLE_API_KEY=AIzaxxx     # optionnel
supabase secrets set GOOGLE_CSE_ID=xxx          # optionnel
```

Pour les notifications push :
- `projectId` dans `useNotifications.ts` → obtenir via `npx expo login` + `eas project:init`

---

- [x] **Étape 18** : CRM Admin Web (senzedy-crm)
  - Dashboard Next.js 16 (App Router) + Tailwind CSS + PWA
  - Dossier : `c:/Users/admin/Desktop/senzedy-crm/`
  - **Même Supabase** : même URL/anon key que l'app mobile
  - Nouvelles tables : `contracts`, `client_documents`, `crm_activity_logs` → exécuter `senzedy-crm/supabase/crm_schema.sql`
  - Pages : `/dashboard`, `/dashboard/clients`, `/dashboard/biens`, `/dashboard/contrats`, `/dashboard/documents`, `/dashboard/alertes`
  - Auth : middleware (`proxy.ts`) vérifie `profiles.role = 'admin'`
  - Realtime : flux activité via `crm_activity_logs` (postgres_changes)
  - Lancer : `cd senzedy-crm && npm run dev` → http://localhost:3001

---

## Architecture Unifiée Senzedy

```
Supabase (cerveau)
  ├── 📱 App Mobile (senzedy-agency/)  → Expo SDK 54, clients finaux
  ├── 🖥️  CRM Admin   (senzedy-crm/)   → Next.js 16, admin/agents
  └── 🌐 Site Vitrine (senzedyagency.com) → composant PropertyCard exportable
```

**Clés Supabase communes :**
- URL : `https://tkncugkmfjupbngqrgga.supabase.co`
- Anon Key : dans `src/lib/supabase.ts` (app mobile) et `senzedy-crm/.env.local` (CRM)

---

## Commandes Utiles

```bash
# App mobile
npx expo start --web          # Dev web rapide
npx expo start                # Dev avec QR code (Expo Go)
npx expo install <package>    # Installer un package compatible SDK 54

# CRM Admin
cd ../senzedy-crm
npm run dev                   # http://localhost:3001
npm run build                 # Build production (webpack mode)
```
