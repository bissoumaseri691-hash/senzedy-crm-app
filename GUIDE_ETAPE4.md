# Étape 4 — Authentification : Guide d'intégration

## 1. Correctif SQL (PRIORITÉ)
Avant tout, corriger les buckets Storage :
→ Supabase → SQL Editor → New Query
→ Coller le contenu de `CORRECTIF_storage_buckets.sql` → Run

---

## 2. Commandes d'installation

```bash
npx expo install expo-secure-store
npx expo install @react-native-async-storage/async-storage
```

---

## 3. Fichiers à placer dans le projet

| Fichier ZIP | Destination |
|-------------|-------------|
| `src/context/AuthContext.tsx`         | → `src/context/AuthContext.tsx` (nouveau) |
| `src/navigation/RootNavigator.tsx`    | → `src/navigation/RootNavigator.tsx` (nouveau) |
| `src/screens/auth/LoginScreen.tsx`    | → `src/screens/auth/LoginScreen.tsx` (nouveau) |
| `src/screens/auth/RegisterScreen.tsx` | → `src/screens/auth/RegisterScreen.tsx` (nouveau) |
| `src/screens/ProfileScreen.tsx`       | → remplace l'existant |
| `App.tsx`                             | → remplace l'existant |

---

## 4. Créer le dossier auth
```bash
mkdir src/screens/auth
mkdir src/context
```

---

## 5. Relancer Expo
```bash
npx expo start --clear
```

---

## Flux de navigation (logique)

```
App.tsx
└── AuthProvider          ← gère user + profile + loading
    └── NavigationContainer
        └── RootNavigator
            ├── loading=true  → SplashScreen (logo animé)
            ├── user=null     → AuthNavigator
            │   ├── LoginScreen    (Email + Password)
            │   └── RegisterScreen (Nom, Email, Téléphone, Password)
            └── user≠null     → AppNavigator (Tabs + Drawer)
                                  Étapes 1 & 2 intactes
```

## Ce que fait AuthContext

| État / Méthode | Description |
|----------------|-------------|
| `user` | Utilisateur Supabase Auth (`null` = déconnecté) |
| `profile` | Données de la table `profiles` |
| `loading` | Vrai pendant la vérification initiale de session |
| `signIn(email, password)` | Connexion |
| `signUp(email, pass, name, phone?)` | Inscription + update profil |
| `signOut()` | Déconnexion + vide les états |
| `refreshProfile()` | Recharge les données profil depuis Supabase |

## Features des écrans auth

**LoginScreen**
- Validation email (format regex)
- Validation mot de passe (min 6 car.)
- Affichage/masquage du mot de passe
- Messages d'erreur Supabase traduits en français
- Lien "Mot de passe oublié" (à brancher étape suivante)

**RegisterScreen**
- Validation complète (nom, email, téléphone, password, confirmation)
- Indicateur de force du mot de passe (4 niveaux)
- Affichage/masquage sur les 2 champs password
- Alert de confirmation d'email après inscription
