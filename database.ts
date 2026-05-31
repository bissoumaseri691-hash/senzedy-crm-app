/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  SENZEDY AGENCY — src/types/database.ts
 *  Types TypeScript générés depuis le schéma SQL.
 *  Ces types permettent à supabase.ts d'être
 *  100% typé (zéro any).
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ─── Enums ────────────────────────────────────────────────────────────
export type UserRole         = "client" | "agent" | "admin";
export type TransactionType  = "vente"  | "location";
export type PropertyCategory = "appartement" | "villa" | "maison" | "terrain" | "bureau" | "local" | "entrepot" | "hotel";
export type PropertyStatus   = "disponible"  | "reserve" | "vendu" | "loue";
export type MessageStatus    = "non_lu"      | "lu";
export type ProjectStatus    = "planifie"    | "en_cours" | "termine";
export type Currency         = "USD"         | "CDF";

// ─── Helpers génériques ───────────────────────────────────────────────
export type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Insert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Update<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Aliases pratiques
export type Profile          = Row<"profiles">;
export type ProfileInsert    = Insert<"profiles">;
export type ProfileUpdate    = Update<"profiles">;

export type Property         = Row<"properties">;
export type PropertyInsert   = Insert<"properties">;
export type PropertyUpdate   = Update<"properties">;

export type Favorite         = Row<"favorites">;
export type Message          = Row<"messages">;
export type Notification     = Row<"notifications">;
export type Commune          = Row<"communes">;
export type News             = Row<"news">;
export type Project          = Row<"projects">;
export type ContactRequest   = Row<"contact_requests">;
export type PropertyView     = Row<"property_views">;

// Vue enrichie (properties_with_agent)
export interface PropertyWithAgent extends Property {
  agent_name?:   string | null;
  agent_avatar?: string | null;
  agent_phone?:  string | null;
}

// ─── Type principal de la base de données ─────────────────────────────
export interface Database {
  public: {
    Tables: {

      // ── profiles ──────────────────────────────────────────────────
      profiles: {
        Row: {
          id:         string;
          full_name:  string | null;
          avatar_url: string | null;
          phone:      string | null;
          role:       UserRole;
          is_active:  boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id:          string;
          full_name?:  string | null;
          avatar_url?: string | null;
          phone?:      string | null;
          role?:       UserRole;
          is_active?:  boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?:  string | null;
          avatar_url?: string | null;
          phone?:      string | null;
          role?:       UserRole;
          is_active?:  boolean;
          updated_at?: string;
        };
      };

      // ── properties ────────────────────────────────────────────────
      properties: {
        Row: {
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
          agent_id:     string | null;
          views_count:  number;
          fts:          unknown | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:           string;
          slug?:         string | null;
          title:         string;
          description?:  string | null;
          price:         number;
          currency?:     Currency;
          transaction:   TransactionType;
          category:      PropertyCategory;
          status?:       PropertyStatus;
          commune?:      string | null;
          quartier?:     string | null;
          address?:      string | null;
          surface_m2?:   number | null;
          bedrooms?:     number | null;
          bathrooms?:    number | null;
          floors?:       number | null;
          images?:       string[];
          video_url?:    string | null;
          is_featured?:  boolean;
          is_published?: boolean;
          agent_id?:     string | null;
          views_count?:  number;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: {
          slug?:         string | null;
          title?:        string;
          description?:  string | null;
          price?:        number;
          currency?:     Currency;
          transaction?:  TransactionType;
          category?:     PropertyCategory;
          status?:       PropertyStatus;
          commune?:      string | null;
          quartier?:     string | null;
          address?:      string | null;
          surface_m2?:   number | null;
          bedrooms?:     number | null;
          bathrooms?:    number | null;
          floors?:       number | null;
          images?:       string[];
          video_url?:    string | null;
          is_featured?:  boolean;
          is_published?: boolean;
          agent_id?:     string | null;
          updated_at?:   string;
        };
      };

      // ── favorites ─────────────────────────────────────────────────
      favorites: {
        Row: {
          id:          string;
          user_id:     string;
          property_id: string;
          created_at:  string;
        };
        Insert: {
          id?:         string;
          user_id:     string;
          property_id: string;
          created_at?: string;
        };
        Update: never;
      };

      // ── messages ──────────────────────────────────────────────────
      messages: {
        Row: {
          id:          string;
          sender_id:   string;
          receiver_id: string;
          property_id: string | null;
          content:     string;
          status:      MessageStatus;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          sender_id:    string;
          receiver_id:  string;
          property_id?: string | null;
          content:      string;
          status?:      MessageStatus;
          created_at?:  string;
        };
        Update: {
          status?: MessageStatus;
        };
      };

      // ── property_views ────────────────────────────────────────────
      property_views: {
        Row: {
          id:          string;
          property_id: string;
          user_id:     string | null;
          viewed_at:   string;
        };
        Insert: {
          id?:          string;
          property_id:  string;
          user_id?:     string | null;
          viewed_at?:   string;
        };
        Update: never;
      };

      // ── news ──────────────────────────────────────────────────────
      news: {
        Row: {
          id:           string;
          title:        string;
          slug:         string | null;
          excerpt:      string | null;
          content:      string | null;
          cover_url:    string | null;
          author_id:    string | null;
          is_published: boolean;
          published_at: string | null;
          created_at:   string;
          updated_at:   string;
        };
        Insert: {
          id?:           string;
          title:         string;
          slug?:         string | null;
          excerpt?:      string | null;
          content?:      string | null;
          cover_url?:    string | null;
          author_id?:    string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?:   string;
          updated_at?:   string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["news"]["Insert"], "id">>;
      };

      // ── projects ──────────────────────────────────────────────────
      projects: {
        Row: {
          id:              string;
          title:           string;
          description:     string | null;
          location:        string | null;
          images:          string[];
          status:          ProjectStatus;
          delivery_date:   string | null;
          total_units:     number | null;
          available_units: number | null;
          is_published:    boolean;
          created_at:      string;
          updated_at:      string;
        };
        Insert: {
          id?:              string;
          title:            string;
          description?:     string | null;
          location?:        string | null;
          images?:          string[];
          status?:          ProjectStatus;
          delivery_date?:   string | null;
          total_units?:     number | null;
          available_units?: number | null;
          is_published?:    boolean;
          created_at?:      string;
          updated_at?:      string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["projects"]["Insert"], "id">>;
      };

      // ── contact_requests ──────────────────────────────────────────
      contact_requests: {
        Row: {
          id:          string;
          property_id: string | null;
          user_id:     string | null;
          full_name:   string;
          phone:       string | null;
          email:       string | null;
          message:     string | null;
          is_treated:  boolean;
          created_at:  string;
        };
        Insert: {
          id?:          string;
          property_id?: string | null;
          user_id?:     string | null;
          full_name:    string;
          phone?:       string | null;
          email?:       string | null;
          message?:     string | null;
          is_treated?:  boolean;
          created_at?:  string;
        };
        Update: { is_treated?: boolean };
      };

      // ── notifications ─────────────────────────────────────────────
      notifications: {
        Row: {
          id:         string;
          user_id:    string;
          type:       string;
          title:      string;
          body:       string | null;
          data:       Record<string, unknown> | null;
          is_read:    boolean;
          created_at: string;
        };
        Insert: {
          id?:        string;
          user_id:    string;
          type:       string;
          title:      string;
          body?:      string | null;
          data?:      Record<string, unknown> | null;
          is_read?:   boolean;
          created_at?: string;
        };
        Update: { is_read?: boolean };
      };

      // ── communes ──────────────────────────────────────────────────
      communes: {
        Row: {
          id:         string;
          name:       string;
          city:       string;
          is_active:  boolean;
          created_at: string;
        };
        Insert: {
          id?:        string;
          name:       string;
          city?:      string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          name?:      string;
          city?:      string;
          is_active?: boolean;
        };
      };
    };

    Views: {
      properties_with_agent: {
        Row: PropertyWithAgent;
      };
      stats_by_commune: {
        Row: {
          commune:     string | null;
          transaction: TransactionType;
          total:       number;
          avg_price:   number;
          min_price:   number;
          max_price:   number;
        };
      };
    };

    Functions: {
      is_admin:         { Args: Record<never, never>; Returns: boolean };
      is_agent_or_admin:{ Args: Record<never, never>; Returns: boolean };
    };

    Enums: {
      user_role:         UserRole;
      transaction_type:  TransactionType;
      property_category: PropertyCategory;
      property_status:   PropertyStatus;
      message_status:    MessageStatus;
      project_status:    ProjectStatus;
    };
  };
}
