/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/lib/supabase.ts
 *  Client Supabase avec stockage sécurisé (SecureStore)
 *
 *  Note : la clé anon est publique par design (RLS protège).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";

const SUPABASE_URL      = "https://fxoqoyvqjgvvhywsmrln.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4b3FveXZxamd2dmh5d3NtcmxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzQ0NTcsImV4cCI6MjA5NTgxMDQ1N30.LnJxBGBZRDgmPMnoMheZu5ZYjufLqBVIXPJbGt-6vKs";

/**
 * Adaptateur de stockage sécurisé pour les tokens auth.
 * Utilise expo-secure-store sur mobile (chiffré),
 * et localStorage sur web (fallback).
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === "web") {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === "web") {
      try { localStorage.setItem(key, value); } catch { /* storage full */ }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      console.warn("[supabase] SecureStore write failed for key:", key);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === "web") {
      try { localStorage.removeItem(key); } catch { /* noop */ }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      console.warn("[supabase] SecureStore delete failed for key:", key);
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:            SecureStoreAdapter,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});