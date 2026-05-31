/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/lib/supabase.ts
 *  Client Supabase typé + helpers Auth, Storage & Queries
 *
 *  SETUP :
 *  1. Créer un projet sur https://supabase.com
 *  2. Project Settings → API → copier URL + anon key
 *  3. Créer un fichier .env à la racine du projet :
 *       EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *       EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
 *  4. Lancer : npx expo start --clear
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import "react-native-url-polyfill/auto";
import { createClient }  from "@supabase/supabase-js";
import AsyncStorage      from "@react-native-async-storage/async-storage";
import type { Database } from "../types/database";

// ─── Variables d'environnement ────────────────────────────────────────
const supabaseUrl     = process.env.EXPO_PUBLIC_SUPABASE_URL     as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌  Variables Supabase manquantes !\n" +
    "    Créez un fichier .env à la racine :\n" +
    "    EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\n" +
    "    EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...\n"
  );
}

// ─── Client Supabase typé ─────────────────────────────────────────────
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage:            AsyncStorage,
    autoRefreshToken:   true,
    persistSession:     true,
    detectSessionInUrl: false,
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Inscription — profil créé automatiquement via trigger SQL */
export const signUp = (email: string, password: string, fullName: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

/** Connexion email + mot de passe */
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

/** Déconnexion */
export const signOut = () => supabase.auth.signOut();

/** Session courante */
export const getSession = () => supabase.auth.getSession();

/** Utilisateur courant */
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

/** Écouter les changements d'état auth */
export const onAuthStateChange = (
  cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) => supabase.auth.onAuthStateChange(cb);

/** Envoi d'email de réinitialisation */
export const resetPassword = (email: string) =>
  supabase.auth.resetPasswordForEmail(email);

/** Mise à jour du mot de passe (utilisateur connecté) */
export const updatePassword = (password: string) =>
  supabase.auth.updateUser({ password });


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STORAGE HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const BUCKETS = {
  PROPERTIES: "property-images",
  AVATARS:    "avatars",
  PROJECTS:   "project-images",
  NEWS:       "news-images",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/** Upload d'une image depuis un URI local (expo-image-picker) */
export const uploadImage = async (
  bucket: BucketName,
  path: string,
  uri: string
): Promise<string | null> => {
  try {
    const response = await fetch(uri);
    const blob     = await response.blob();
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    return getPublicUrl(bucket, path);
  } catch (e) {
    console.error("uploadImage error:", e);
    return null;
  }
};

/** URL publique d'un fichier Storage */
export const getPublicUrl = (bucket: BucketName, path: string): string =>
  supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

/** Suppression d'un fichier Storage */
export const deleteImage = (bucket: BucketName, path: string) =>
  supabase.storage.from(bucket).remove([path]);


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY HELPERS — Properties
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type {
  TransactionType,
  PropertyCategory,
  PropertyInsert,
  PropertyUpdate,
} from "../types/database";

export interface PropertyFilters {
  transaction?:  TransactionType;
  category?:     PropertyCategory;
  commune?:      string;
  minPrice?:     number;
  maxPrice?:     number;
  minSurface?:   number;
  bedrooms?:     number;
  isFeatured?:   boolean;
  searchQuery?:  string;
}

/** Récupérer les annonces avec filtres + pagination */
export const fetchProperties = async (
  filters: PropertyFilters = {},
  page = 0,
  pageSize = 20
) => {
  let query = supabase
    .from("properties_with_agent")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at",  { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (filters.transaction) query = query.eq("transaction", filters.transaction);
  if (filters.category)    query = query.eq("category",    filters.category);
  if (filters.commune)     query = query.eq("commune",     filters.commune);
  if (filters.minPrice)    query = query.gte("price",      filters.minPrice);
  if (filters.maxPrice)    query = query.lte("price",      filters.maxPrice);
  if (filters.minSurface)  query = query.gte("surface_m2", filters.minSurface);
  if (filters.bedrooms)    query = query.gte("bedrooms",   filters.bedrooms);
  if (filters.isFeatured)  query = query.eq("is_featured", true);
  if (filters.searchQuery) {
    query = query.textSearch("fts", filters.searchQuery, { config: "french" });
  }

  return query;
};

/** Annonce par ID */
export const fetchPropertyById = (id: string) =>
  supabase.from("properties_with_agent").select("*").eq("id", id).single();

/** Annonce par slug */
export const fetchPropertyBySlug = (slug: string) =>
  supabase.from("properties_with_agent").select("*").eq("slug", slug).single();

/** Créer une annonce */
export const createProperty = (data: PropertyInsert) =>
  supabase.from("properties").insert(data).select().single();

/** Mettre à jour une annonce */
export const updateProperty = (id: string, data: PropertyUpdate) =>
  supabase.from("properties").update(data).eq("id", id).select().single();

/** Supprimer une annonce */
export const deleteProperty = (id: string) =>
  supabase.from("properties").delete().eq("id", id);

/** Enregistrer une vue (compteur + tracking) */
export const trackPropertyView = (propertyId: string, userId?: string) =>
  supabase.from("property_views").upsert(
    { property_id: propertyId, user_id: userId ?? null },
    { onConflict: "property_id,user_id", ignoreDuplicates: true }
  );


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY HELPERS — Favorites
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Favoris d'un utilisateur (avec détail du bien) */
export const fetchFavorites = (userId: string) =>
  supabase
    .from("favorites")
    .select("*, properties_with_agent(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

/** Ajouter un favori */
export const addFavorite = (userId: string, propertyId: string) =>
  supabase.from("favorites").insert({ user_id: userId, property_id: propertyId });

/** Retirer un favori */
export const removeFavorite = (userId: string, propertyId: string) =>
  supabase.from("favorites")
    .delete()
    .eq("user_id",     userId)
    .eq("property_id", propertyId);

/** Vérifier si un bien est en favori */
export const isFavorite = async (userId: string, propertyId: string): Promise<boolean> => {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id",     userId)
    .eq("property_id", propertyId)
    .maybeSingle();
  return !!data;
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY HELPERS — Profiles
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { ProfileUpdate } from "../types/database";

export const fetchProfile = (userId: string) =>
  supabase.from("profiles").select("*").eq("id", userId).single();

export const updateProfile = (userId: string, data: ProfileUpdate) =>
  supabase.from("profiles").update(data).eq("id", userId).select().single();


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY HELPERS — Messages
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const fetchConversation = (userId: string, otherUserId: string) =>
  supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),` +
      `and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

export const sendMessage = (
  senderId: string,
  receiverId: string,
  content: string,
  propertyId?: string
) =>
  supabase.from("messages").insert({
    sender_id:   senderId,
    receiver_id: receiverId,
    content,
    property_id: propertyId ?? null,
  });

export const markMessagesAsRead = (senderId: string, receiverId: string) =>
  supabase
    .from("messages")
    .update({ status: "lu" })
    .eq("sender_id",   senderId)
    .eq("receiver_id", receiverId)
    .eq("status",      "non_lu");

export const fetchUnreadCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("status",      "non_lu");
  return count ?? 0;
};


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERY HELPERS — Divers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const fetchCommunes = () =>
  supabase.from("communes").select("*").eq("is_active", true).order("name");

export const fetchNews = (limit = 10) =>
  supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit);

export const fetchProjects = () =>
  supabase
    .from("projects")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

export const submitContactRequest = (data: {
  property_id?: string;
  full_name:    string;
  phone?:       string;
  email?:       string;
  message?:     string;
}) => supabase.from("contact_requests").insert(data);

export const fetchNotifications = (userId: string) =>
  supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

export const markNotificationsRead = (userId: string) =>
  supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

export default supabase;
