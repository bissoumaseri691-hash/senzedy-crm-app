/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/config/aiConfig.ts
 *  Configuration IA — Groq via Edge Function (sécurisé)
 *
 *  ⚠️  Les clés API ne doivent JAMAIS être dans le code client.
 *      Elles sont stockées côté serveur (Supabase Secrets).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const AI_CONFIG = {
  GROQ_MODEL:   "llama-3.3-70b-versatile",
  MAX_TOKENS:   1024,
  EDGE_FUNCTION: "ai-chat",
} as const;
