export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      sets: {
        Row: {
          id: string;
          set_id: string;
          set_name: string;
          release_date: string | null;
          card_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          set_id: string;
          set_name: string;
          release_date?: string | null;
          card_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          set_id?: string;
          set_name?: string;
          release_date?: string | null;
          card_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cards: {
        Row: {
          id: string;
          card_set_id: string;
          set_id: string;
          card_name: string;
          card_type: string;
          card_color: string;
          rarity: string;
          card_cost: string | null;
          card_power: string | null;
          life: string | null;
          counter_amount: number | null;
          attribute: string | null;
          sub_types: string | null;
          card_text: string | null;
          card_image: string;
          card_image_id: string;
          market_price: number | null;
          inventory_price: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          card_set_id: string;
          set_id: string;
          card_name: string;
          card_type: string;
          card_color: string;
          rarity: string;
          card_cost?: string | null;
          card_power?: string | null;
          life?: string | null;
          counter_amount?: number | null;
          attribute?: string | null;
          sub_types?: string | null;
          card_text?: string | null;
          card_image: string;
          card_image_id: string;
          market_price?: number | null;
          inventory_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          card_set_id?: string;
          set_id?: string;
          card_name?: string;
          card_type?: string;
          card_color?: string;
          rarity?: string;
          card_cost?: string | null;
          card_power?: string | null;
          life?: string | null;
          counter_amount?: number | null;
          attribute?: string | null;
          sub_types?: string | null;
          card_text?: string | null;
          card_image?: string;
          card_image_id?: string;
          market_price?: number | null;
          inventory_price?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      price_history: {
        Row: {
          id: string;
          card_id: string;
          market_price: number | null;
          inventory_price: number | null;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          card_id: string;
          market_price?: number | null;
          inventory_price?: number | null;
          recorded_at?: string;
        };
        Update: {
          id?: string;
          card_id?: string;
          market_price?: number | null;
          inventory_price?: number | null;
          recorded_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_entries: {
        Row: {
          id: string;
          user_id: string;
          card_id: string;
          quantity: number;
          condition: string;
          purchase_price: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          card_id: string;
          quantity?: number;
          condition?: string;
          purchase_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          card_id?: string;
          quantity?: number;
          condition?: string;
          purchase_price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          sync_type: string;
          status: string;
          cards_synced: number | null;
          sets_synced: number | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          sync_type: string;
          status?: string;
          cards_synced?: number | null;
          sets_synced?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          sync_type?: string;
          status?: string;
          cards_synced?: number | null;
          sets_synced?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific table types for convenience
export type Set = Tables<"sets">;
export type Card = Tables<"cards">;
export type PriceHistory = Tables<"price_history">;
export type User = Tables<"users">;
export type CollectionEntry = Tables<"collection_entries">;
export type SyncLog = Tables<"sync_logs">;
