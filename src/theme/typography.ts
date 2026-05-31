/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — Typographie
 *  Alignée avec senzedy-web : Playfair Display + Montserrat
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const fonts = {
  // Polices à charger via expo-font
  serif: {
    regular: "PlayfairDisplay_400Regular",
    italic:  "PlayfairDisplay_400Regular_Italic",
    bold:    "PlayfairDisplay_700Bold",
  },
  sans: {
    light:      "Montserrat_300Light",
    regular:    "Montserrat_400Regular",
    medium:     "Montserrat_500Medium",
    semiBold:   "Montserrat_600SemiBold",
    bold:       "Montserrat_700Bold",
  },
};

export const fontSizes = {
  xs:   12,
  sm:   14,
  base: 16,
  lg:   18,
  xl:   20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
};

export const lineHeights = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
};

export const letterSpacings = {
  tight:   -0.5,
  normal:  0,
  wide:    1,
  wider:   2,
  widest:  4,
};

export default { fonts, fontSizes, lineHeights, letterSpacings };
