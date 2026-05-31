/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ─── Palette Senzedy Luxury ───────────────────────────────
        brown: {
          DEFAULT: "#3B1F1A",   // Marron profond principal (fond header/footer)
          dark:    "#2A1510",   // Marron très sombre (fond sidebar)
          medium:  "#5C2E24",   // Marron moyen (card contact)
          light:   "#7A3B2E",   // Marron clair (hover, border)
        },
        gold: {
          DEFAULT: "#C9943A",   // Or principal (texte SENZEDY, icônes actives)
          light:   "#D4A85A",   // Or clair (sous-titres)
          pale:    "#E8C97E",   // Or pâle (highlights)
        },
        cream: {
          DEFAULT: "#F2EBD9",   // Beige crème (fond principal)
          light:   "#F8F4EC",   // Beige très clair (fond cards)
          dark:    "#DDD0B8",   // Beige foncé (bordures)
        },
        offwhite: {
          DEFAULT: "#FAF7F2",   // Blanc cassé (fond formulaires)
          pure:    "#FFFFFF",   // Blanc pur
        },
        // ─── Couleurs fonctionnelles ──────────────────────────────
        primary:   "#3B1F1A",   // Alias → brown
        accent:    "#C9943A",   // Alias → gold
        background:"#F2EBD9",   // Alias → cream
        surface:   "#FAF7F2",   // Alias → offwhite
        text: {
          primary:   "#2A1510", // Texte principal
          secondary: "#7A6050", // Texte secondaire
          light:     "#FAF7F2", // Texte sur fond sombre
          gold:      "#C9943A", // Texte doré
        },
        border: {
          DEFAULT: "#C9943A",   // Bordure or
          light:   "#DDD0B8",   // Bordure beige
          dark:    "#5C2E24",   // Bordure marron
        },
        status: {
          sell:  "#7A3B2E",     // Badge "À Vendre"
          rent:  "#C9943A",     // Badge "À Louer"
        },
      },
      fontFamily: {
        // À charger via expo-font dans l'étape suivante
        serif:       ["Cormorant_700Bold",    "serif"],
        "serif-med": ["Cormorant_500Medium",  "serif"],
        sans:        ["Raleway_400Regular",   "sans-serif"],
        "sans-med":  ["Raleway_500Medium",    "sans-serif"],
        "sans-semi": ["Raleway_600SemiBold",  "sans-serif"],
        "sans-bold": ["Raleway_700Bold",      "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        luxury: "0 8px 32px rgba(59,31,26,0.18)",
        card:   "0 4px 16px rgba(59,31,26,0.12)",
      },
    },
  },
  plugins: [],
};
