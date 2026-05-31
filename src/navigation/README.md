# Navigation — Senzedy Agency

## Arbre de navigation

```
App.tsx
└── NavigationContainer
    └── SafeAreaProvider
        └── AppNavigator (BottomTabNavigator)
            │
            ├── [TAB] Accueil ──→ HomeDrawer (DrawerNavigator, côté droit)
            │       ├── HomeStack → HomeScreen          ← écran principal
            │       ├── Vendre                          ← sous-menu: Maison, Villa...
            │       ├── Louer                           ← sous-menu: Maison, Bureau...
            │       ├── Kinbnb                          ← sous-menu: Courte/Longue durée
            │       ├── Divers                          ← sous-menu: Estimation...
            │       ├── Projets
            │       ├── Actualites
            │       ├── Agence
            │       └── Contact
            │
            ├── [TAB] Recherche  → SearchScreen
            ├── [TAB] Favoris    → FavoritesScreen
            ├── [TAB] Messages   → MessagesScreen
            └── [TAB] Profil     → ProfileScreen
```

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/navigation/AppNavigator.tsx` | Navigateur principal (Tabs + Drawer + Stack) |
| `src/components/CustomDrawerContent.tsx` | Menu latéral personnalisé avec accordéons |
| `src/screens/HomeScreen.tsx` | Accueil avec bouton d'ouverture du drawer |
| `src/screens/SearchScreen.tsx` | Placeholder Recherche |
| `src/screens/FavoritesScreen.tsx` | Placeholder Favoris |
| `src/screens/MessagesScreen.tsx` | Placeholder Messages |
| `src/screens/ProfileScreen.tsx` | Placeholder Profil |
| `src/screens/DrawerScreens.tsx` | Tous les écrans du drawer |
| `App.tsx` | Point d'entrée, wrappé dans NavigationContainer |
