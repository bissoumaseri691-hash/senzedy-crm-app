/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/types/database.ts
 *  Types liés à la structure Supabase
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ── Types de base ─────────────────────────────────────────────────────

export type TransactionType = "vente" | "location";

export type PropertyCategory =
  | "appartement"
  | "villa"
  | "maison"
  | "terrain"
  | "bureau"
  | "local"
  | "entrepot"
  | "hotel";

export type PropertyStatus = "disponible" | "reserve" | "vendu" | "loue";

export type Currency = "USD" | "CDF";

// ── Interface base de données (vue properties_with_agent) ─────────────

export interface PropertyWithAgent {
  id:           string;
  slug:         string | null;
  title:        string;
  description:  string | null;
  price:        number;
  currency:     Currency;
  transaction:  TransactionType;
  category:     PropertyCategory;
  status:       PropertyStatus;
  commune:      string | null;
  quartier:     string | null;
  address:      string | null;
  surface_m2:   number | null;
  bedrooms:     number | null;
  bathrooms:    number | null;
  floors:       number | null;
  images:       string[];
  video_url:    string | null;
  is_featured:  boolean;
  is_published: boolean;
  views_count:  number;
  agent_id:     string | null;
  agent_name:   string | null;
  agent_avatar: string | null;
  agent_phone:  string | null;
  created_at:   string;
  updated_at:   string;
}

// ── Type Profile (table profiles) ────────────────────────────────────

export interface Profile {
  id:                   string;
  email:                string;
  full_name:            string | null;
  phone:                string | null;
  avatar_url:           string | null;
  role:                 "client" | "agent" | "admin";
  push_token:           string | null;
  notif_new_properties: boolean | null;
  notif_ai_messages:    boolean | null;
  created_at:           string;
}

// ── Tables Supabase ───────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: PropertyWithAgent;
      };
      profiles: {
        Row: {
          id:         string;
          email:      string;
          full_name:  string | null;
          phone:      string | null;
          avatar_url: string | null;
          role:       "client" | "agent" | "admin";
          created_at: string;
        };
      };
      favorites: {
        Row: {
          id:          string;
          user_id:     string;
          property_id: string;
          created_at:  string;
        };
      };
    };
  };
}
