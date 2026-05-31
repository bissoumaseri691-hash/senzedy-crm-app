-- ═══════════════════════════════════════════════════════════════════════
--  SENZEDY AGENCY — Blindage RLS complet + Rate limiting IA
--  Étape 17 — Sécurité
--
--  👉 Exécuter dans : Supabase Dashboard → SQL Editor → New Query → Run
--
--  Ce script :
--    1. Crée la table ai_rate_limits (anti-flood du chatbot)
--    2. Recrée proprement toutes les politiques RLS critiques
--    3. Protège le champ `role` contre l'auto-escalade de privilèges
-- ═══════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABLE DE RATE LIMITING (utilisée par l'Edge Function ai-chat)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  identifier    TEXT        NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (identifier, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON ai_rate_limits (window_start);

COMMENT ON TABLE ai_rate_limits IS
  'Compteur de requêtes par fenêtre temporelle — protège le chatbot IA contre les abus.';

-- RLS : cette table est UNIQUEMENT accessible via service_role (Edge Function).
-- Aucun client ne peut la lire/modifier directement.
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
-- Aucune politique SELECT/INSERT côté client → service_role uniquement via Edge Function.


-- ─────────────────────────────────────────────────────────────────────────
-- 2. FONCTIONS HELPERS (recrée pour s'assurer qu'elles sont à jour)
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_agent_or_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('agent', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. PROPERTIES — Tout le monde lit les annonces publiées,
--                seul admin/agent peut créer/modifier/supprimer
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Suppression des anciennes politiques (idempotent)
DROP POLICY IF EXISTS "properties_select_published"      ON properties;
DROP POLICY IF EXISTS "properties_insert_agent"          ON properties;
DROP POLICY IF EXISTS "properties_update_own_or_admin"   ON properties;
DROP POLICY IF EXISTS "properties_delete_admin"          ON properties;

-- ✅ SELECT : tout le monde voit les annonces publiées,
--            les agents/admins voient TOUT (brouillons inclus)
CREATE POLICY "properties_select_published" ON properties
  FOR SELECT
  USING (is_published = TRUE OR is_agent_or_admin());

-- ✅ INSERT : uniquement agent ou admin
CREATE POLICY "properties_insert_agent" ON properties
  FOR INSERT
  WITH CHECK (is_agent_or_admin());

-- ✅ UPDATE : l'agent propriétaire de l'annonce OU admin
CREATE POLICY "properties_update_own_or_admin" ON properties
  FOR UPDATE
  USING (agent_id = auth.uid() OR is_admin());

-- ✅ DELETE : admin uniquement
CREATE POLICY "properties_delete_admin" ON properties
  FOR DELETE
  USING (is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 4. CONTACT_REQUESTS (= "leads" dans l'interface admin)
--    Tout le monde peut soumettre, seul l'utilisateur voit ses demandes,
--    l'admin voit tout.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_insert_any"           ON contact_requests;
DROP POLICY IF EXISTS "contact_select_admin"         ON contact_requests;
DROP POLICY IF EXISTS "contact_select_own_or_admin"  ON contact_requests;
DROP POLICY IF EXISTS "contact_update_admin"         ON contact_requests;
DROP POLICY IF EXISTS "contact_delete_admin"         ON contact_requests;

-- ✅ INSERT : formulaire de contact accessible à tous (anonyme inclus)
CREATE POLICY "contact_insert_any" ON contact_requests
  FOR INSERT
  WITH CHECK (TRUE);

-- ✅ SELECT : un utilisateur voit SES propres demandes,
--            l'agent/admin voit TOUT
CREATE POLICY "contact_select_own_or_admin" ON contact_requests
  FOR SELECT
  USING (user_id = auth.uid() OR is_agent_or_admin());

-- ✅ UPDATE : marquer "traité" → agent ou admin
CREATE POLICY "contact_update_admin" ON contact_requests
  FOR UPDATE
  USING (is_agent_or_admin());

-- ✅ DELETE : admin uniquement
CREATE POLICY "contact_delete_admin" ON contact_requests
  FOR DELETE
  USING (is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 5. PROFILES — Protection critique contre l'escalade de rôle
--    Un utilisateur NE PEUT PAS se donner lui-même le rôle 'admin'.
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public"               ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"                  ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin"         ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_no_role_escalation" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin"                ON profiles;

-- ✅ SELECT : tout le monde peut lire les profils (nécessaire pour afficher les agents)
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT
  USING (TRUE);

-- ✅ INSERT : uniquement via le trigger handle_new_user (ou soi-même à la création)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ✅ UPDATE : soi-même OU admin
--    MAIS un utilisateur ne peut pas modifier son propre champ `role`
--    → seul un admin peut changer le rôle de quelqu'un
CREATE POLICY "profiles_update_own_no_role_escalation" ON profiles
  FOR UPDATE
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (
    -- Un admin peut tout modifier
    is_admin()
    OR
    -- Un utilisateur normal peut modifier son profil, mais PAS son rôle
    (
      id = auth.uid()
      AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    )
  );

-- ✅ DELETE : admin uniquement
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE
  USING (is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 6. FAVORITES — Chaque utilisateur ne voit et ne gère QUE les siens
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorites_select_own"  ON favorites;
DROP POLICY IF EXISTS "favorites_insert_own"  ON favorites;
DROP POLICY IF EXISTS "favorites_delete_own"  ON favorites;

-- ✅ SELECT : ses propres favoris + admin peut tout voir (stats)
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- ✅ INSERT : pour soi-même uniquement
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ✅ DELETE : ses propres favoris uniquement
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE
  USING (user_id = auth.uid() OR is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 7. VÉRIFICATION FINALE
-- ─────────────────────────────────────────────────────────────────────────

-- Exécutez cette requête pour vérifier que tout est en place :
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('properties', 'contact_requests', 'profiles', 'favorites', 'ai_rate_limits')
ORDER BY tablename, policyname;
