/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/services/authService.ts
 *  Service d'authentification et gestion des rôles
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { supabase } from "../lib/supabase";
import type { Profile } from "../types/database";

// ─── Récupérer un profil avec le champ role ─────────────────────────

export async function fetchProfileWithRole(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("[authService] fetchProfileWithRole:", error.message);
      return null;
    }
    return data as Profile;
  } catch {
    return null;
  }
}

// ─── Vérifier si un utilisateur est admin ───────────────────────────

export async function isRoleAdmin(userId: string): Promise<boolean> {
  const profile = await fetchProfileWithRole(userId);
  return profile?.role === "admin";
}

// ─── Compter les membres inscrits ───────────────────────────────────

export async function getMembersCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) {
      console.warn("[authService] getMembersCount:", error.message);
      return 0;
    }
    return count ?? 0;
  } catch {
    return 0;
  }
}

// ─── Récupérer les membres récents ──────────────────────────────────

export async function getRecentMembers(limit = 10): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.warn("[authService] getRecentMembers:", error.message);
      return [];
    }
    return (data as Profile[]) ?? [];
  } catch {
    return [];
  }
}
