# 🏠 Senzedy Agency — Guide d'installation Étape 1

## Palette de couleurs
| Rôle | Couleur | Hex |
|------|---------|-----|
| Marron Profond (fond header/footer) | ████ | `#3B1F1A` |
| Or Principal (titres, icônes) | ████ | `#C9943A` |
| Beige Crème (fond app) | ████ | `#F2EBD9` |
| Blanc Cassé (fond cards/forms) | ████ | `#FAF7F2` |

---

## ① Créer le projet Expo

```bash
# Créer le projet avec le template TypeScript
npx create-expo-app@latest senzedy-agency --template blank-typescript

# Entrer dans le dossier
cd senzedy-agency
```

---

## ② Installer React Navigation

```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

---

## ③ Installer NativeWind v4 + Tailwind CSS

```bash
npm install nativewind@^4.0.1
npm install --save-dev tailwindcss@^3.4.0
```

---

## ④ Installer les dépendances utilitaires

```bash
# Icônes (déjà inclus dans Expo mais on s'assure de la version)
npx expo install @expo/vector-icons

# Pour les fonts Cormorant + Raleway (Étape 2 - déjà listées ici)
npx expo install expo-font @expo-google-fonts/cormorant @expo-google-fonts/raleway

# Variables d'environnement (pour Supabase plus tard)
npx expo install expo-constants
```

---

## ⑤ Copier les fichiers du projet

Remplacer / créer les fichiers suivants avec le contenu fourni dans le ZIP :

```
senzedy-agency/
├── App.tsx                        ← Remplacer
├── global.css                     ← Créer (NativeWind v4)
├── tailwind.config.js             ← Créer
├── babel.config.js                ← Remplacer
├── metro.config.js                ← Créer
├── tsconfig.json                  ← Remplacer
├── nativewind-env.d.ts            ← Créer
└── src/
    ├── theme/
    │   ├── colors.ts              ← Créer
    │   ├── typography.ts          ← Créer
    │   └── index.ts               ← Créer
    ├── lib/
    │   └── supabase.ts            ← Créer (placeholder)
    ├── types/
    │   └── index.ts               ← Créer
    ├── components/                ← Dossier vide (prêt)
    ├── screens/                   ← Dossier vide (prêt)
    ├── navigation/                ← Dossier vide (prêt)
    └── hooks/                     ← Dossier vide (prêt)
```

---

## ⑥ Lancer le projet

```bash
# Démarrer le serveur de développement
npx expo start

# Sur Android (émulateur ou appareil)
npx expo start --android

# Sur iOS (Mac uniquement)
npx expo start --ios
```

---

## Structure des dossiers

```
src/
├── components/    → Éléments UI réutilisables (boutons, cards, inputs...)
├── screens/       → Pages complètes (Home, Search, Property, Profile...)
├── navigation/    → Configuration React Navigation (tabs, stack...)
├── theme/         → Couleurs, typographie, espacements
├── lib/           → Configuration Supabase, helpers
├── hooks/         → Custom hooks React
├── types/         → Types TypeScript globaux
└── assets/        → Images, fonts locales
```

---

## ⚠️ Notes importantes NativeWind v4

- **`global.css`** doit être importé dans `App.tsx` : `import "./global.css"`
- **`metro.config.js`** doit utiliser `withNativeWind` 
- **`babel.config.js`** doit avoir `jsxImportSource: "nativewind"`
- **`nativewind-env.d.ts`** est requis pour que TypeScript reconnaisse `className`

---

*Senzedy Agency © 2025 — Étape 1/N ✅*
