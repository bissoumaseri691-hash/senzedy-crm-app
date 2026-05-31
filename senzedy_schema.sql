-- ═══════════════════════════════════════════════════════════════════════════
--  SENZEDY AGENCY — Script SQL Complet
--  À copier intégralement dans : Supabase → SQL Editor → New Query → Run
--
--  Ordre d'exécution (respecté dans ce fichier) :
--    1. Extensions
--    2. Types ENUM
--    3. Tables de référence (communes)
--    4. Tables principales (profiles, properties, favorites, messages...)
--    5. Tables secondaires (news, projects, contact_requests, views)
--    6. Vues utiles
--    7. Index de performance
--    8. Fonctions & Triggers
--    9. Politiques RLS (Row Level Security)
--   10. Buckets Storage
--   11. Données de démarrage (seed)
-- ═══════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- génération d'UUID
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- recherche sans accents
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- recherche floue (trigram)


-- ─────────────────────────────────────────────────────────────────────────
-- 2. TYPES ENUM
-- ─────────────────────────────────────────────────────────────────────────

-- Rôle utilisateur
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('client', 'agent', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Type de transaction
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('vente', 'location');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Catégorie de bien
DO $$ BEGIN
  CREATE TYPE property_category AS ENUM (
    'appartement', 'villa', 'maison', 'terrain',
    'bureau', 'local', 'entrepot', 'hotel'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Statut du bien
DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('disponible', 'reserve', 'vendu', 'loue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Statut d'un message
DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('non_lu', 'lu');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Statut d'un projet
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planifie', 'en_cours', 'termine');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- 3. TABLE DE RÉFÉRENCE — communes
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS communes (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  city       TEXT        NOT NULL DEFAULT 'Kinshasa',
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE communes IS 'Liste des communes/quartiers disponibles dans les filtres';


-- ─────────────────────────────────────────────────────────────────────────
-- 4. TABLES PRINCIPALES
-- ─────────────────────────────────────────────────────────────────────────

-- ── 4.1 profiles ────────────────────────────────────────────────────────
--   Étend auth.users avec les données métier.
--   Une ligne est créée automatiquement via trigger à chaque inscription.

CREATE TABLE IF NOT EXISTS profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  role          user_role   NOT NULL DEFAULT 'client',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  profiles               IS 'Profils utilisateurs liés à auth.users';
COMMENT ON COLUMN profiles.role          IS 'client = acheteur/locataire, agent = commercial, admin = admin';
COMMENT ON COLUMN profiles.avatar_url    IS 'URL publique depuis Storage bucket avatars';

-- ── 4.2 properties ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properties (
  id            UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT              UNIQUE,
  title         TEXT              NOT NULL,
  description   TEXT,
  price         NUMERIC(15, 2)    NOT NULL CHECK (price >= 0),
  currency      TEXT              NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'CDF')),
  transaction   transaction_type  NOT NULL,
  category      property_category NOT NULL,
  status        property_status   NOT NULL DEFAULT 'disponible',
  commune       TEXT,
  quartier      TEXT,
  address       TEXT,
  surface_m2    NUMERIC(10, 2),
  bedrooms      INTEGER           CHECK (bedrooms >= 0),
  bathrooms     INTEGER           CHECK (bathrooms >= 0),
  floors        INTEGER           CHECK (floors >= 0),
  images        TEXT[]            NOT NULL DEFAULT '{}',
  video_url     TEXT,
  is_featured   BOOLEAN           NOT NULL DEFAULT FALSE,
  is_published  BOOLEAN           NOT NULL DEFAULT TRUE,
  agent_id      UUID              REFERENCES profiles(id) ON DELETE SET NULL,
  views_count   INTEGER           NOT NULL DEFAULT 0,
  fts           TSVECTOR,         -- colonne pour la recherche full-text
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  properties             IS 'Annonces immobilières';
COMMENT ON COLUMN properties.slug        IS 'URL-friendly identifiant unique ex: villa-ngaliema-001';
COMMENT ON COLUMN properties.fts         IS 'Colonne full-text search (auto-générée par trigger)';
COMMENT ON COLUMN properties.is_featured IS 'Mis en avant sur la home page';
COMMENT ON COLUMN properties.agent_id    IS 'Agent responsable de l'annonce';

-- ── 4.3 favorites ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS favorites (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id)    ON DELETE CASCADE,
  property_id UUID        NOT NULL REFERENCES properties(id)  ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, property_id)
);

COMMENT ON TABLE favorites IS 'Biens mis en favoris par les utilisateurs';

-- ── 4.4 messages ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID           NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  receiver_id UUID           NOT NULL REFERENCES profiles(id)   ON DELETE CASCADE,
  property_id UUID           REFERENCES properties(id)          ON DELETE SET NULL,
  content     TEXT           NOT NULL,
  status      message_status NOT NULL DEFAULT 'non_lu',
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CHECK (sender_id <> receiver_id)
);

COMMENT ON TABLE messages IS 'Messagerie entre utilisateurs (client ↔ agent)';


-- ─────────────────────────────────────────────────────────────────────────
-- 5. TABLES SECONDAIRES
-- ─────────────────────────────────────────────────────────────────────────

-- ── 5.1 property_views ─ tracking des consultations ────────────────────

CREATE TABLE IF NOT EXISTS property_views (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID        NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (property_id, user_id)  -- une seule vue unique par utilisateur
);

COMMENT ON TABLE property_views IS 'Historique des consultations d''annonces';

-- ── 5.2 news ─ actualités ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS news (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT        NOT NULL,
  slug         TEXT        UNIQUE,
  excerpt      TEXT,
  content      TEXT,
  cover_url    TEXT,
  author_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN     NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE news IS 'Actualités immobilières publiées par l''agence';

-- ── 5.3 projects ─ projets immobiliers ──────────────────────────────────

CREATE TABLE IF NOT EXISTS projects (
  id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT           NOT NULL,
  description     TEXT,
  location        TEXT,
  images          TEXT[]         NOT NULL DEFAULT '{}',
  status          project_status NOT NULL DEFAULT 'planifie',
  delivery_date   DATE,
  total_units     INTEGER,
  available_units INTEGER,
  is_published    BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE projects IS 'Projets immobiliers neufs commercialisés par l''agence';

-- ── 5.4 contact_requests ─ demandes de contact ──────────────────────────

CREATE TABLE IF NOT EXISTS contact_requests (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID        REFERENCES properties(id) ON DELETE SET NULL,
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  full_name   TEXT        NOT NULL,
  phone       TEXT,
  email       TEXT,
  message     TEXT,
  is_treated  BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE contact_requests IS 'Formulaires de contact / demandes de visite';

-- ── 5.5 notifications ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT        NOT NULL, -- 'message', 'favorite_sold', 'new_property', etc.
  title       TEXT        NOT NULL,
  body        TEXT,
  data        JSONB,
  is_read     BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Notifications in-app pour les utilisateurs';


-- ─────────────────────────────────────────────────────────────────────────
-- 6. VUES UTILES
-- ─────────────────────────────────────────────────────────────────────────

-- Vue enrichie des annonces avec infos agent
CREATE OR REPLACE VIEW properties_with_agent AS
SELECT
  p.*,
  pr.full_name   AS agent_name,
  pr.avatar_url  AS agent_avatar,
  pr.phone       AS agent_phone
FROM properties p
LEFT JOIN profiles pr ON pr.id = p.agent_id
WHERE p.is_published = TRUE;

COMMENT ON VIEW properties_with_agent IS 'Annonces publiées enrichies avec les données de l''agent';

-- Vue : statistiques par commune
CREATE OR REPLACE VIEW stats_by_commune AS
SELECT
  commune,
  transaction,
  COUNT(*)                           AS total,
  AVG(price)                         AS avg_price,
  MIN(price)                         AS min_price,
  MAX(price)                         AS max_price
FROM properties
WHERE status = 'disponible' AND is_published = TRUE
GROUP BY commune, transaction;

-- Vue : résumé des conversations (boîte de réception)
CREATE OR REPLACE VIEW conversation_summary AS
SELECT DISTINCT ON (
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id)
)
  id,
  sender_id,
  receiver_id,
  property_id,
  content AS last_message,
  status,
  created_at
FROM messages
ORDER BY
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────
-- 7. INDEX DE PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────

-- properties : filtres courants
CREATE INDEX IF NOT EXISTS idx_properties_transaction  ON properties (transaction);
CREATE INDEX IF NOT EXISTS idx_properties_category     ON properties (category);
CREATE INDEX IF NOT EXISTS idx_properties_status       ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_commune      ON properties (commune);
CREATE INDEX IF NOT EXISTS idx_properties_is_featured  ON properties (is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_is_published ON properties (is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_properties_price        ON properties (price);
CREATE INDEX IF NOT EXISTS idx_properties_agent        ON properties (agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at   ON properties (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_fts          ON properties USING GIN (fts);

-- favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user          ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property      ON favorites (property_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_sender         ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver       ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_property       ON messages (property_id);
CREATE INDEX IF NOT EXISTS idx_messages_status         ON messages (status);

-- property_views
CREATE INDEX IF NOT EXISTS idx_views_property          ON property_views (property_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user      ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread    ON notifications (user_id, is_read) WHERE is_read = FALSE;

-- Recherche floue sur les noms de bien (pg_trgm)
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm   ON properties USING GIN (title gin_trgm_ops);


-- ─────────────────────────────────────────────────────────────────────────
-- 8. FONCTIONS & TRIGGERS
-- ─────────────────────────────────────────────────────────────────────────

-- ── 8.1 updated_at automatique ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer sur toutes les tables qui ont updated_at
DO $$ DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','properties','news','projects'] LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON %I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ── 8.2 Création automatique du profil à l'inscription ──────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'client'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 8.3 Génération automatique du slug pour les annonces ────────────────

CREATE OR REPLACE FUNCTION generate_property_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter   INTEGER := 0;
BEGIN
  -- Créer slug depuis titre : minuscules, sans accents, espaces → tirets
  base_slug := LOWER(
    REGEXP_REPLACE(
      unaccent(NEW.title),
      '[^a-z0-9]+', '-', 'g'
    )
  );
  base_slug := TRIM(BOTH '-' FROM base_slug);
  final_slug := base_slug;

  -- S'assurer de l'unicité
  WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug AND id <> NEW.id) LOOP
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_property_slug ON properties;
CREATE TRIGGER set_property_slug
  BEFORE INSERT OR UPDATE OF title ON properties
  FOR EACH ROW EXECUTE FUNCTION generate_property_slug();

-- ── 8.4 Full-Text Search automatique (français) ─────────────────────────

CREATE OR REPLACE FUNCTION update_property_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := to_tsvector('french',
    COALESCE(unaccent(NEW.title),       '') || ' ' ||
    COALESCE(unaccent(NEW.description), '') || ' ' ||
    COALESCE(unaccent(NEW.commune),     '') || ' ' ||
    COALESCE(unaccent(NEW.quartier),    '') || ' ' ||
    COALESCE(unaccent(NEW.address),     '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_property_fts ON properties;
CREATE TRIGGER set_property_fts
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_property_fts();

-- ── 8.5 Incrément du compteur de vues ───────────────────────────────────

CREATE OR REPLACE FUNCTION increment_property_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties
  SET views_count = views_count + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_property_view ON property_views;
CREATE TRIGGER on_property_view
  AFTER INSERT ON property_views
  FOR EACH ROW EXECUTE FUNCTION increment_property_views();

-- ── 8.6 Notification automatique quand un message est reçu ──────────────

CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (
    NEW.receiver_id,
    'message',
    'Nouveau message',
    LEFT(NEW.content, 100),
    jsonb_build_object(
      'message_id',   NEW.id,
      'sender_id',    NEW.sender_id,
      'property_id',  NEW.property_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();


-- ─────────────────────────────────────────────────────────────────────────
-- 9. POLITIQUES RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────────────────

-- Activer RLS sur toutes les tables
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties        ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views    ENABLE ROW LEVEL SECURITY;
ALTER TABLE news              ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects          ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes          ENABLE ROW LEVEL SECURITY;

-- ── Helper : est-ce un admin ? ───────────────────────────────────────────

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

-- ══ PROFILES ══════════════════════════════════════════════════════════════

-- Lecture : tout le monde peut lire les profils d'agents (pour les annonces)
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (TRUE);

-- Insertion : uniquement via le trigger handle_new_user (SECURITY DEFINER)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Mise à jour : soi-même OU admin
CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

-- Suppression : admin uniquement
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- ══ PROPERTIES ════════════════════════════════════════════════════════════

-- Lecture : tout le monde voit les annonces publiées
CREATE POLICY "properties_select_published" ON properties
  FOR SELECT USING (is_published = TRUE OR is_agent_or_admin());

-- Insertion : agents et admins uniquement
CREATE POLICY "properties_insert_agent" ON properties
  FOR INSERT WITH CHECK (is_agent_or_admin());

-- Modification : l'agent propriétaire de l'annonce OU admin
CREATE POLICY "properties_update_own_or_admin" ON properties
  FOR UPDATE USING (agent_id = auth.uid() OR is_admin());

-- Suppression : admin uniquement
CREATE POLICY "properties_delete_admin" ON properties
  FOR DELETE USING (is_admin());

-- ══ FAVORITES ═════════════════════════════════════════════════════════════

-- Lecture : ses propres favoris uniquement
CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (user_id = auth.uid());

-- Insertion : utilisateur connecté, pour soi-même
CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Suppression : ses propres favoris
CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (user_id = auth.uid());

-- ══ MESSAGES ══════════════════════════════════════════════════════════════

-- Lecture : ses propres messages (envoyés ou reçus)
CREATE POLICY "messages_select_own" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Envoi : utilisateur connecté
CREATE POLICY "messages_insert_own" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Mise à jour : le destinataire peut marquer comme lu
CREATE POLICY "messages_update_receiver" ON messages
  FOR UPDATE USING (receiver_id = auth.uid() OR is_admin());

-- ══ PROPERTY_VIEWS ════════════════════════════════════════════════════════

-- Insertion : tout le monde (anonyme inclus)
CREATE POLICY "views_insert_any" ON property_views
  FOR INSERT WITH CHECK (TRUE);

-- Lecture : admins et agents
CREATE POLICY "views_select_admin" ON property_views
  FOR SELECT USING (is_agent_or_admin());

-- ══ NEWS ══════════════════════════════════════════════════════════════════

-- Lecture : tout le monde voit les articles publiés
CREATE POLICY "news_select_published" ON news
  FOR SELECT USING (is_published = TRUE OR is_agent_or_admin());

-- Écriture : admins et agents uniquement
CREATE POLICY "news_write_admin" ON news
  FOR ALL USING (is_agent_or_admin());

-- ══ PROJECTS ══════════════════════════════════════════════════════════════

CREATE POLICY "projects_select_published" ON projects
  FOR SELECT USING (is_published = TRUE OR is_agent_or_admin());

CREATE POLICY "projects_write_admin" ON projects
  FOR ALL USING (is_agent_or_admin());

-- ══ CONTACT_REQUESTS ══════════════════════════════════════════════════════

-- Soumission : tout le monde (anonyme inclus)
CREATE POLICY "contact_insert_any" ON contact_requests
  FOR INSERT WITH CHECK (TRUE);

-- Lecture : l'agent/admin uniquement
CREATE POLICY "contact_select_admin" ON contact_requests
  FOR SELECT USING (is_agent_or_admin());

-- Modification (marquer traité) : admin
CREATE POLICY "contact_update_admin" ON contact_requests
  FOR UPDATE USING (is_agent_or_admin());

-- ══ NOTIFICATIONS ═════════════════════════════════════════════════════════

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (TRUE); -- inséré par les triggers (SECURITY DEFINER)

-- ══ COMMUNES ══════════════════════════════════════════════════════════════

-- Lecture publique
CREATE POLICY "communes_select_public" ON communes
  FOR SELECT USING (TRUE);

-- Écriture : admin uniquement
CREATE POLICY "communes_write_admin" ON communes
  FOR ALL USING (is_admin());


-- ─────────────────────────────────────────────────────────────────────────
-- 10. STORAGE — Création des buckets
-- ─────────────────────────────────────────────────────────────────────────
-- ⚠️  Les buckets Storage se créent normalement via le Dashboard Supabase.
--    Ce bloc SQL utilise la fonction interne storage.create_bucket
--    disponible depuis Supabase ≥ 2024.

SELECT storage.create_bucket('property-images', '{"public": true}')
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'property-images');

SELECT storage.create_bucket('avatars', '{"public": true}')
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

SELECT storage.create_bucket('project-images', '{"public": true}')
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'project-images');

SELECT storage.create_bucket('news-images', '{"public": true}')
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'news-images');

-- Politique Storage : lecture publique sur property-images
CREATE POLICY "storage_property_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "storage_property_images_agent_write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "storage_avatars_own"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );


-- ─────────────────────────────────────────────────────────────────────────
-- 11. DONNÉES DE DÉMARRAGE (seed)
-- ─────────────────────────────────────────────────────────────────────────

-- Communes de Kinshasa
INSERT INTO communes (name, city) VALUES
  ('Ngaliema',       'Kinshasa'),
  ('Gombe',          'Kinshasa'),
  ('Limete',         'Kinshasa'),
  ('Kintambo',       'Kinshasa'),
  ('Lemba',          'Kinshasa'),
  ('Kalamu',         'Kinshasa'),
  ('Bandalungwa',    'Kinshasa'),
  ('Ngiri-Ngiri',    'Kinshasa'),
  ('Masina',         'Kinshasa'),
  ('N''sele',        'Kinshasa'),
  ('Mont-Ngafula',   'Kinshasa'),
  ('Ndjili',         'Kinshasa'),
  ('Kasa-Vubu',      'Kinshasa'),
  ('Matete',         'Kinshasa'),
  ('Bumbu',          'Kinshasa'),
  ('Selembao',       'Kinshasa'),
  ('Makala',         'Kinshasa'),
  ('Kisenso',        'Kinshasa'),
  ('Maluku',         'Kinshasa'),
  ('Tshangu',        'Kinshasa')
ON CONFLICT (name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
--  FIN DU SCRIPT — Senzedy Agency
--  Vérifie l'absence d'erreurs dans l'onglet "Results" de Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════
