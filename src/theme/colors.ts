/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/theme/colors.ts
 *  Palette officielle (alignée CLAUDE.md)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const colors = {
  // ── Marrons ───────────────────────────────────────────────────────
  brown: {
    DEFAULT: "#3B1F1A",
    dark:    "#2A1510",
    medium:  "#5C2E24",
    light:   "#7A3B2E",
  },

  // ── Or / Doré ─────────────────────────────────────────────────────
  gold: {
    DEFAULT: "#C9943A",
    light:   "#D4A85A",
    pale:    "#E8C97E",
  },

  // ── Crème / Beige ─────────────────────────────────────────────────
  cream: {
    DEFAULT: "#F2EBD9",
    light:   "#F8F4EC",
    dark:    "#DDD0B8",
  },

  // ── Blanc cassé ───────────────────────────────────────────────────
  offwhite: {
    DEFAULT: "#FAF7F2",
    pure:    "#FFFFFF",
  },

  // ── Texte ─────────────────────────────────────────────────────────
  text: {
    primary:   "#2A1510",
    secondary: "#7A6050",
    muted:     "#A08070",
  },

  // ── Bordures ──────────────────────────────────────────────────────
  border: {
    DEFAULT: "#DDD0B8",
    light:   "#EDE5D5",
  },

  // ── Surfaces ──────────────────────────────────────────────────────
  surface: "#FAF7F2",

  // ── Marron acajou / Accent rouge ──────────────────────────────────
  maroon: "#6D433C",

  // ── Dark backgrounds ──────────────────────────────────────────────
  dark: {
    bg:       "#0E0705",
    surface:  "#1A0F0A",
    surface2: "#221510",
  },
} as const;

export type ColorScheme = typeof colors;
