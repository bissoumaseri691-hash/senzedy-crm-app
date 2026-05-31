# SENZEDY AGENCY — Guide Sécurité Étape 17

## Vue d'ensemble

```
Avant  📱 → [clé Anthropic exposée dans le code] → 🤖 Anthropic API
Après  📱 → 🔒 Supabase Edge Function → [clé cachée côté serveur] → 🤖 Anthropic API
```

Le téléphone ne voit **jamais** vos clés API.

---

## PARTIE 1 — SQL : Row Level Security

### 1.1 — Exécuter le script RLS

1. Allez sur **Supabase Dashboard** → votre projet → **SQL Editor**
2. Cliquez **New Query**
3. Copiez-collez le contenu de `supabase/rls_securite.sql`
4. Cliquez **Run**

Vous devriez voir un tableau listant toutes les politiques créées.

### 1.2 — Ce que le script fait

| Table              | Règle                                                        |
|--------------------|--------------------------------------------------------------|
| `properties`       | Tout le monde lit les annonces publiées. Seul admin/agent peut créer, modifier, supprimer. |
| `contact_requests` | Tout le monde peut soumettre. L'utilisateur voit ses propres demandes. L'admin voit tout. |
| `profiles`         | Tout le monde peut lire. Un utilisateur **ne peut pas** se donner le rôle `admin`. |
| `favorites`        | Chaque utilisateur gère uniquement ses propres favoris.      |
| `ai_rate_limits`   | Inaccessible depuis le client. Seule l'Edge Function (service_role) peut y accéder. |

### 1.3 — Définir un admin manuellement

Un utilisateur ne peut **jamais** se définir lui-même comme admin via l'app.
Pour promouvoir un utilisateur admin, exécutez dans Supabase SQL Editor :

```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'REMPLACEZ-PAR-L-UUID-DE-L-UTILISATEUR';
```

Pour trouver l'UUID d'un utilisateur :
```sql
SELECT id, full_name, email_from_auth, role FROM profiles ORDER BY created_at DESC;
```

---

## PARTIE 2 — Edge Function : Proxy IA

### 2.1 — Installer Supabase CLI

```bash
npm install -g supabase
```

### 2.2 — Lier votre projet

```bash
supabase login
supabase link --project-ref VOTRE_PROJECT_REF
```

> Trouvez `VOTRE_PROJECT_REF` dans Supabase Dashboard → Settings → General → Reference ID

### 2.3 — Déployer l'Edge Function

```bash
cd c:\Users\admin\Desktop\senzedy-agency
supabase functions deploy ai-chat
```

Vérifiez le déploiement dans Supabase Dashboard → **Edge Functions** → vous devriez voir `ai-chat`.

### 2.4 — Injecter vos clés API (Supabase Secrets)

Ces commandes stockent vos clés **côté serveur uniquement**. Elles ne sont jamais dans le code.

```bash
# Obligatoire — votre clé Anthropic Claude
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Optionnel — pour activer Google Search dans l'IA
supabase secrets set GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxx
supabase secrets set GOOGLE_CSE_ID=xxxxxxxxxxxxxxxxx

# Optionnel — changer le modèle Claude (défaut : claude-haiku-4-5-20251001)
supabase secrets set CLAUDE_MODEL=claude-sonnet-4-6
```

Pour vérifier les secrets enregistrés :
```bash
supabase secrets list
```

### 2.5 — Tester l'Edge Function

Depuis Supabase Dashboard → **Edge Functions** → `ai-chat` → **Test** :

```json
{
  "userMessage": "Bonjour, quels sont les prix à Gombe ?",
  "messages": []
}
```

Vous devriez recevoir une réponse JSON `{ "content": "...", "usedSearch": false }`.

---

## PARTIE 3 — Variables d'environnement (fichier .env)

### 3.1 — Vérification .gitignore

Votre `.gitignore` contient déjà les lignes suivantes ✅ :
```
.env
.env.local
.env.production
```

**Vos clés ne peuvent pas être poussées sur GitHub.**

### 3.2 — Clés Supabase (safe à committer)

Les clés Supabase suivantes sont **publiques par design** (protégées par RLS) :
- `SUPABASE_URL` → safe
- `SUPABASE_ANON_KEY` → safe (accès limité par les politiques RLS)

Ces clés peuvent rester dans `src/lib/supabase.ts`.

### 3.3 — EAS Secrets (pour le build Expo en production)

Si vous avez des variables d'environnement nécessaires **au moment du build** (ex: analytics, Sentry), utilisez EAS Secrets :

```bash
npm install -g eas-cli
eas login
eas secret:create --scope project --name MA_VARIABLE --value ma_valeur
```

Accès dans `app.config.js` :
```javascript
export default {
  expo: {
    extra: {
      maVariable: process.env.MA_VARIABLE,
    }
  }
}
```

> ⚠️ Les secrets EAS sont inclus dans le bundle de l'app (décompilable).
> Pour des clés VRAIMENT secrètes (Anthropic, Google), utilisez toujours Supabase Edge Functions.

---

## PARTIE 4 — Rate Limiting : Comment ça marche

La table `ai_rate_limits` compte les messages par utilisateur/IP :

```
Identifiant  = user_id (si connecté) ou adresse IP
Fenêtre      = 1 minute (arrondie)
Limite       = 10 messages par minute
```

Si un utilisateur dépasse 10 messages/minute, il reçoit :
```json
{ "error": "Limite atteinte (10 messages/minute). Veuillez patienter." }
```

L'application affiche ce message à l'utilisateur. Les entrées de plus d'1 heure sont nettoyées automatiquement.

### Modifier la limite

Dans `supabase/functions/ai-chat/index.ts`, modifiez :
```typescript
const RATE_LIMIT = 10;      // Messages max
const WINDOW_MS  = 60_000;  // Fenêtre en ms (60 000 = 1 minute)
```

Puis redéployez :
```bash
supabase functions deploy ai-chat
```

---

## Résumé des fichiers modifiés

| Fichier                                        | Action                                    |
|------------------------------------------------|-------------------------------------------|
| `supabase/rls_securite.sql`                    | ✨ Créé — SQL à exécuter dans Supabase     |
| `supabase/functions/ai-chat/index.ts`          | ✨ Créé — Edge Function proxy IA           |
| `src/services/aiService.ts`                    | ♻️ Mis à jour — appelle l'Edge Function    |
| `src/services/googleSearchService.ts`          | ♻️ Simplifié — recherche côté serveur      |
| `src/config/aiConfig.ts`                       | ♻️ Nettoyé — clés API supprimées           |
| `.gitignore`                                   | ✅ Déjà correct                            |
