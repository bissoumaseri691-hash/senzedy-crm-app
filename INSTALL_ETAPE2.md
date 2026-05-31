# ⚠️ Guide d'installation Étape 2 — Expo SDK 52 + React Navigation v7

## Pourquoi cette mise à jour ?

Votre projet a été créé avec **Expo SDK 52** qui impose **React Navigation v7**.
Les versions v6 de `@react-navigation/bottom-tabs` etc. ne sont **pas compatibles**.

---

## ✅ Procédure complète (repartir de zéro proprement)

### Étape A — Supprimer node_modules et package-lock
```bash
# Dans votre dossier senzedy-agency
Remove-Item -Recurse -Force node_modules   # PowerShell
Remove-Item package-lock.json              # PowerShell

# OU sous cmd classique :
rmdir /s /q node_modules
del package-lock.json
```

### Étape B — Remplacer les fichiers modifiés
Copier depuis ce ZIP dans votre projet :
- `package.json`         ← versions React Navigation v7 corrigées
- `app.json`             ← SDK version explicite + newArchEnabled: false
- `App.tsx`              ← inchangé
- `babel.config.js`      ← inchangé
- `src/navigation/AppNavigator.tsx`  ← adapté API v7

### Étape C — Réinstaller toutes les dépendances
```bash
npm install
```

### Étape D — Lancer (vider le cache Metro)
```bash
npx expo start --clear
```

---

## Versions installées (toutes compatibles Expo SDK 52)

| Package | Version |
|---------|---------|
| expo | ~52.0.0 |
| react-native | 0.76.5 |
| @react-navigation/native | ^7.0.14 |
| @react-navigation/bottom-tabs | ^7.2.0 |
| @react-navigation/drawer | ^7.1.1 |
| @react-navigation/native-stack | ^7.2.0 |
| react-native-gesture-handler | ~2.20.2 |
| react-native-reanimated | ~3.16.1 |
| react-native-screens | ~4.4.0 |
| react-native-safe-area-context | 4.12.0 |

---

## ⚠️ Rappels importants

1. `import "react-native-gesture-handler"` → **première ligne** de App.tsx
2. `react-native-reanimated/plugin` → **dernier plugin** de babel.config.js  
3. Toujours lancer avec `--clear` après avoir changé babel.config.js
4. `newArchEnabled: false` dans app.json évite les conflits Reanimated sur Android
