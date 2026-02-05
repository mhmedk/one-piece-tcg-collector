export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          attribute: string | null
          card_color: string
          card_cost: string | null
          card_image: string
          card_image_id: string
          card_name: string
          card_power: string | null
          card_set_id: string
          card_text: string | null
          card_type: string
          counter_amount: number | null
          created_at: string
          id: string
          inventory_price: number | null
          life: string | null
          market_price: number | null
          rarity: string
          set_id: string
          sub_types: string | null
          updated_at: string
        }
        Insert: {
          attribute?: string | null
          card_color: string
          card_cost?: string | null
          card_image: string
          card_image_id: string
          card_name: string
          card_power?: string | null
          card_set_id: string
          card_text?: string | null
          card_type: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          inventory_price?: number | null
          life?: string | null
          market_price?: number | null
          rarity: string
          set_id: string
          sub_types?: string | null
          updated_at?: string
        }
        Update: {
          attribute?: string | null
          card_color?: string
          card_cost?: string | null
          card_image?: string
          card_image_id?: string
          card_name?: string
          card_power?: string | null
          card_set_id?: string
          card_text?: string | null
          card_type?: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          inventory_price?: number | null
          life?: string | null
          market_price?: number | null
          rarity?: string
          set_id?: string
          sub_types?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["set_id"]
          },
        ]
      }
      collection_entries: {
        Row: {
          card_id: string
          condition: string
          created_at: string
          id: string
          notes: string | null
          purchase_price: number | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          condition?: string
          created_at?: string
          id?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          condition?: string
          created_at?: string
          id?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_entries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          card_id: string
          id: string
          inventory_price: number | null
          market_price: number | null
          recorded_at: string
        }
        Insert: {
          card_id: string
          id?: string
          inventory_price?: number | null
          market_price?: number | null
          recorded_at?: string
        }
        Update: {
          card_id?: string
          id?: string
          inventory_price?: number | null
          market_price?: number | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          card_count: number | null
          created_at: string
          id: string
          release_date: string | null
          set_id: string
          set_name: string
          updated_at: string
        }
        Insert: {
          card_count?: number | null
          created_at?: string
          id?: string
          release_date?: string | null
          set_id: string
          set_name: string
          updated_at?: string
        }
        Update: {
          card_count?: number | null
          created_at?: string
          id?: string
          release_date?: string | null
          set_id?: string
          set_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          cards_synced: number | null
          completed_at: string | null
          error_message: string | null
          id: string
          sets_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          cards_synced?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          sets_synced?: number | null
          started_at?: string
          status?: string
          sync_type: string
        }
        Update: {
          cards_synced?: number | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          sets_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_premium: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_premium?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_premium?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Convenience type aliases
export type Card = Tables<"cards">
export type Set = Tables<"sets">
export type PriceHistory = Tables<"price_history">
export type User = Tables<"users">
export type CollectionEntry = Tables<"collection_entries">
export type SyncLog = Tables<"sync_logs">
