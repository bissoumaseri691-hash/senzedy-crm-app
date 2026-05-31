/**
 * SENZEDY AGENCY — src/i18n/index.ts
 * i18next configuration with French/English support
 * Persists language choice in AsyncStorage
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr.json";
import en from "./locales/en.json";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: "fr", // default language
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false, // React Native already escapes
  },
  compatibilityJSON: "v4",
  react: {
    useSuspense: false, // Required for React Native
  },
});

export default i18n;
