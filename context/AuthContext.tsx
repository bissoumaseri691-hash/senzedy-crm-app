/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/context/AuthContext.tsx
 *  Gestion centralisée de l'authentification.
 *
 *  Expose :
 *    user       → Session Supabase (User | null)
 *    profile    → Données profil depuis la table profiles
 *    loading    → Chargement initial
 *    signIn()   → Connexion email + password
 *    signUp()   → Inscription
 *    signOut()  → Déconnexion
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/database";

// ─── Types ────────────────────────────────────────────────────────────

interface AuthResult {
  error: AuthError | null;
}

interface AuthContextValue {
  /** Utilisateur Supabase Auth (null = non connecté) */
  user:    User | null;
  /** Profil enrichi depuis la table profiles */
  profile: Profile | null;
  /** Vrai pendant le chargement initial de la session */
  loading: boolean;
  /** Connexion par email + mot de passe */
  signIn:  (email: string, password: string) => Promise<AuthResult>;
  /** Inscription + création de profil (via trigger SQL) */
  signUp:  (email: string, password: string, fullName: string, phone?: string) => Promise<AuthResult>;
  /** Déconnexion */
  signOut: () => Promise<void>;
  /** Recharger manuellement le profil */
  refreshProfile: () => Promise<void>;
}

// ─── Création du contexte ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Charger le profil depuis Supabase ──────────────────────────────
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // Profil pas encore créé (délai du trigger) → on recrée
        if (error.code === "PGRST116") {
          await supabase.from("profiles").upsert({ id: userId, role: "client" });
          const { data: retry } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();
          setProfile(retry ?? null);
        } else {
          console.warn("loadProfile error:", error.message);
          setProfile(null);
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error("loadProfile exception:", e);
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  // ── Initialisation + listener auth ────────────────────────────────
  useEffect(() => {
    let mounted = true;

    // Récupérer la session existante (AsyncStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadProfile(currentUser.id).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await loadProfile(currentUser.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // ── Méthodes exposées ─────────────────────────────────────────────

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    // Mettre à jour le téléphone si fourni (le trigger crée le profil sans phone)
    if (!error && data.user && phone) {
      setTimeout(() => {
        supabase
          .from("profiles")
          .update({ phone, full_name: fullName })
          .eq("id", data.user!.id)
          .then(() => loadProfile(data.user!.id));
      }, 1500); // petite attente pour laisser le trigger s'exécuter
    }

    return { error };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook d'utilisation ───────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() doit être utilisé à l'intérieur d'un <AuthProvider>");
  }
  return ctx;
}

export default AuthContext;
