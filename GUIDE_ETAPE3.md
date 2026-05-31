# Étape 3 — Backend Supabase : Guide d'intégration

## Commandes d'installation

```bash
# Dans votre dossier projet
npx expo install @supabase/supabase-js
npx expo install react-native-url-polyfill
npx expo install @react-native-async-storage/async-storage
```

---

## Fichiers à placer dans votre projet

| Fichier ZIP | Destination dans le projet |
|-------------|---------------------------|
| `senzedy_schema.sql` | → Supabase SQL Editor (copier/coller + Run) |
| `database.ts`        | → `src/types/database.ts` (remplace l'existant) |
| `supabase.ts`        | → `src/lib/supabase.ts` (remplace l'existant) |
| `.env.example`       | → Racine du projet, renommer en `.env` |

---

## Étapes dans Supabase Dashboard

### 1. Créer le projet
→ https://supabase.com → New Project → remplir nom + mot de passe BDD

### 2. Exécuter le SQL
→ SQL Editor → New Query → coller tout le contenu de `senzedy_schema.sql` → **Run**

### 3. Copier les clés API
→ Project Settings → API
- **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
- **anon public** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### 4. Créer le fichier .env
```bash
# À la racine du projet (à côté de App.tsx)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Vérifier les Storage buckets
→ Storage → vérifier que 4 buckets ont été créés :
- `property-images` (public)
- `avatars` (public)
- `project-images` (public)
- `news-images` (public)

Si les buckets n'ont pas été créés automatiquement → les créer manuellement et cocher "Public".

### 6. Activer la confirmation email (optionnel)
→ Auth → Settings → Email → désactiver "Confirm email" pendant le développement

### 7. Relancer Expo
```bash
npx expo start --clear
```

---

## Architecture de la base de données

```
auth.users (géré par Supabase)
    │
    ↓ trigger on_auth_user_created
    │
profiles          ← rôle: client / agent / admin
    │
    ├─── properties ──── favorites
    │         │
    │         ├─── property_views (compteur)
    │         └─── contact_requests
    │
    ├─── messages (entre users)
    └─── notifications

communes          ← référentiel des quartiers
news              ← actualités de l'agence
projects          ← projets immobiliers
```

## Résumé des politiques RLS

| Table | Lecture | Écriture |
|-------|---------|---------|
| profiles | Tout le monde | Soi-même ou admin |
| properties | Publiées : tout le monde | Agents + admins |
| favorites | Soi-même uniquement | Soi-même uniquement |
| messages | Expéditeur + destinataire | Expéditeur seulement |
| news | Publiées : tout le monde | Agents + admins |
| projects | Publiés : tout le monde | Agents + admins |
| contact_requests | Agents + admins | Tout le monde |
| communes | Tout le monde | Admins seulement |
