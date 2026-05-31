/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/context/AuthContext.tsx
 *  Auth complet : Magic Link OTP + rôles + reset
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import React, {
  createContext, useContext, useEffect, useMemo,
  useState, useCallback, type ReactNode,
} from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types/database";

// ─── Types ────────────────────────────────────────────────────────────

interface AuthResult { error: AuthError | null }

interface AuthContextValue {
  user:             User | null;
  profile:          Profile | null;
  loading:          boolean;
  isAdmin:          boolean;
  isAgent:          boolean;
  /** Connexion email + mot de passe (fallback) */
  signIn:           (email: string, password: string) => Promise<AuthResult>;
  /** Inscription classique */
  signUp:           (email: string, password: string, fullName: string, phone?: string) => Promise<AuthResult>;
  /** Envoie un code OTP à 6 chiffres par email (Magic Link) */
  sendOtp:          (email: string) => Promise<AuthResult>;
  /** Vérifie le code OTP — connecte l'utilisateur */
  verifyOtp:        (email: string, token: string) => Promise<AuthResult>;
  /** Réinitialisation mot de passe */
  resetPassword:    (email: string) => Promise<AuthResult>;
  /** Déconnexion */
  signOut:          () => Promise<void>;
  /** Recharger le profil manuellement */
  refreshProfile:   () => Promise<void>;
}

// ─── Contexte ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Helpers calculés ────────────────────────────────────────────────
  const isAdmin = profile?.role === "admin";
  const isAgent = profile?.role === "agent" || profile?.role === "admin";

  // ── Charger le profil ────────────────────────────────────────────────
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error?.code === "PGRST116") {
        // Profil pas encore créé → on le crée
        await supabase.from("profiles").upsert({ id: userId, role: "client" });
        const { data: retry } = await supabase
          .from("profiles").select("*").eq("id", userId).single();
        setProfile(retry ?? null);
      } else if (error) {
        console.warn("[Auth] loadProfile:", error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (e) {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  // ── Init + listener ─────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id).finally(() => { if (mounted) setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        const u = session?.user ?? null;
        setUser(u);
        if (u) await loadProfile(u.id);
        else    setProfile(null);
        setLoading(false);
      }
    );

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [loadProfile]);

  // ── Méthodes ─────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (
    email: string, password: string, fullName: string, phone?: string
  ): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (!error && data.user && phone) {
      // Update profile immediately (no setTimeout race condition)
      (async () => {
        try {
          await supabase.from("profiles")
            .update({ phone, full_name: fullName })
            .eq("id", data.user!.id);
          await loadProfile(data.user!.id);
        } catch (e) {
          console.warn("[Auth] signUp profile update:", e);
        }
      })();
    }
    return { error };
  }, [loadProfile]);

  // ── Magic Link : envoi OTP ───────────────────────────────────────────
  const sendOtp = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error };
  }, []);

  // ── Magic Link : vérification OTP ────────────────────────────────────
  const verifyOtp = useCallback(async (email: string, token: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    return { error };
  }, []);

  // ── Reset mot de passe ───────────────────────────────────────────────
  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user, profile, loading, isAdmin, isAgent,
    signIn, signUp, sendOtp, verifyOtp,
    resetPassword, signOut, refreshProfile,
  }), [user, profile, loading, isAdmin, isAgent,
    signIn, signUp, sendOtp, verifyOtp,
    resetPassword, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() doit être dans un <AuthProvider>");
  return ctx;
}

export default AuthContext;
