/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/services/googleSearchService.ts
 *  Étape 17 — La recherche Google est désormais côté serveur.
 *
 *  Ce fichier conserve l'interface SearchResult pour la compatibilité
 *  avec AIChatScreen. La recherche réelle est effectuée par l'Edge
 *  Function Supabase (supabase/functions/ai-chat/index.ts).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface SearchResult {
  title:   string;
  link:    string;
  snippet: string;
  source:  string;
}
