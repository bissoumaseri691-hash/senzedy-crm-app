-- ═══════════════════════════════════════════════════════════════════════════
--  SENZEDY AGENCY — CORRECTIF STORAGE BUCKETS
--  Coller dans SQL Editor → Run  (remplace la section 10 du script principal)
--
--  POURQUOI : storage.create_bucket() n'existe pas en SQL natif Supabase.
--  La bonne méthode est d'insérer directement dans storage.buckets.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Création des buckets (méthode correcte) ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-images', 'property-images', TRUE, 10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars',         'avatars',         TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('project-images',  'project-images',  TRUE, 10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('news-images',     'news-images',     TRUE, 10485760,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ── Politiques Storage ────────────────────────────────────────────────────

-- Lecture publique sur property-images
DROP POLICY IF EXISTS "storage_property_images_public_read" ON storage.objects;
CREATE POLICY "storage_property_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Upload property-images : utilisateurs connectés (agents/admins)
DROP POLICY IF EXISTS "storage_property_images_agent_write" ON storage.objects;
CREATE POLICY "storage_property_images_agent_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
  );

-- Suppression property-images : utilisateurs connectés
DROP POLICY IF EXISTS "storage_property_images_delete" ON storage.objects;
CREATE POLICY "storage_property_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images'
    AND auth.role() = 'authenticated'
  );

-- Lecture publique avatars
DROP POLICY IF EXISTS "storage_avatars_public_read" ON storage.objects;
CREATE POLICY "storage_avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Chaque user gère son propre avatar (dossier = son user_id)
DROP POLICY IF EXISTS "storage_avatars_own_write" ON storage.objects;
CREATE POLICY "storage_avatars_own_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "storage_avatars_own_delete" ON storage.objects;
CREATE POLICY "storage_avatars_own_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- Lecture publique project-images et news-images
DROP POLICY IF EXISTS "storage_projects_public_read" ON storage.objects;
CREATE POLICY "storage_projects_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('project-images', 'news-images'));

DROP POLICY IF EXISTS "storage_projects_admin_write" ON storage.objects;
CREATE POLICY "storage_projects_admin_write"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('project-images', 'news-images')
    AND auth.role() = 'authenticated'
  );

-- ═══════════════════════════════════════════════════════════════════════════
--  FIN DU CORRECTIF — Vérifier "Results" dans SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
