/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/hooks/useAdmin.ts
 *  Retourne true uniquement si le profil connecté
 *  possède le rôle "admin" dans Supabase.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { useAuth } from "../context/AuthContext";

// ─── Interface ─────────────────────────────────────────────────────────

interface AdminState {
  isAdmin: boolean;
  loading: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────

export function useAdmin(): AdminState {
  const { isAdmin, loading } = useAuth();
  return { isAdmin, loading };
}

export default useAdmin;
