# Migration SDK 52 → SDK 54 — Senzedy Agency
# ════════════════════════════════════════════

## 1. Remplacer les fichiers de config

Copier dans la racine du projet (en remplaçant l'existant) :
  • app.json
  • package.json
  • babel.config.js
  • metro.config.js

Copier dans assets/ :
  • assets/icon.png          (placeholder marron — remplacer par votre vrai logo)
  • assets/splash.png        (placeholder marron — remplacer par votre vrai splash)
  • assets/adaptive-icon.png
  • assets/favicon.png


## 2. Supprimer le cache

  rm -rf node_modules
  rm -rf .expo


## 3. Réinstaller les dépendances

  npm install


## 4. Fixer les versions compatibles automatiquement

  npx expo install --fix


## 5. Vérifier la santé du projet

  npx expo-doctor


## 6. Lancer

  npx expo start --clear


## Ce qui change dans SDK 54

  • newArchEnabled: true  (nouvelle architecture React Native activée)
  • react-native: 0.77.2  (était 0.76.5)
  • android.edgeToEdgeEnabled: true  (requis SDK 54)
  • expo-secure-store ajouté dans plugins[]
  • Toutes les dépendances Expo bumped aux versions compatibles SDK 54


## Versions clés SDK 54

  expo                          ~54.0.0
  react-native                   0.77.2
  react-native-safe-area-context 4.14.0
  react-native-screens          ~4.5.0
  react-native-reanimated       ~3.17.0
  react-native-gesture-handler  ~2.22.0
  expo-image                    ~2.1.0
  expo-linear-gradient          ~14.1.0
  @react-native-async-storage    2.1.0


## Note sur les assets

Les fichiers PNG fournis sont des placeholders (fond marron uni).
Remplacez-les par vos vrais visuels avant la publication :
  - icon.png         : 1024×1024 px, fond transparent ou marron
  - splash.png       : 1284×2778 px minimum, logo centré
  - adaptive-icon.png: 1024×1024 px, fond transparent
