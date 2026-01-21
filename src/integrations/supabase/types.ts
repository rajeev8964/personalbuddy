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
      booking_rate_limits: {
        Row: {
          client_email: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          client_email: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          client_email?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      friend_bookings: {
        Row: {
          activity: string
          booking_date: string
          booking_time: string
          client_email: string
          client_name: string
          client_phone: string
          created_at: string
          duration: number
          friend_id: string
          id: string
          message: string | null
          status: string
        }
        Insert: {
          activity: string
          booking_date: string
          booking_time: string
          client_email: string
          client_name: string
          client_phone: string
          created_at?: string
          duration?: number
          friend_id: string
          id?: string
          message?: string | null
          status?: string
        }
        Update: {
          activity?: string
          booking_date?: string
          booking_time?: string
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          duration?: number
          friend_id?: string
          id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_bookings_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friend_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_bookings_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "friend_profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_profiles: {
        Row: {
          age: number
          bio_data: string
          created_at: string
          education: string
          email: string
          full_name: string
          height: string
          hobbies: string
          id: string
          is_approved: boolean
          profile_picture_url: string | null
          status: Database["public"]["Enums"]["profile_status"]
          updated_at: string
          user_id: string | null
          weight: string
        }
        Insert: {
          age: number
          bio_data: string
          created_at?: string
          education: string
          email: string
          full_name: string
          height: string
          hobbies: string
          id?: string
          is_approved?: boolean
          profile_picture_url?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_id?: string | null
          weight: string
        }
        Update: {
          age?: number
          bio_data?: string
          created_at?: string
          education?: string
          email?: string
          full_name?: string
          height?: string
          hobbies?: string
          id?: string
          is_approved?: boolean
          profile_picture_url?: string | null
          status?: Database["public"]["Enums"]["profile_status"]
          updated_at?: string
          user_id?: string | null
          weight?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      friend_profiles_public: {
        Row: {
          age: number | null
          bio_data: string | null
          created_at: string | null
          education: string | null
          full_name: string | null
          height: string | null
          hobbies: string | null
          id: string | null
          profile_picture_url: string | null
          status: Database["public"]["Enums"]["profile_status"] | null
          updated_at: string | null
          weight: string | null
        }
        Insert: {
          age?: number | null
          bio_data?: string | null
          created_at?: string | null
          education?: string | null
          full_name?: string | null
          height?: string | null
          hobbies?: string | null
          id?: string | null
          profile_picture_url?: string | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          updated_at?: string | null
          weight?: string | null
        }
        Update: {
          age?: number | null
          bio_data?: string | null
          created_at?: string | null
          education?: string | null
          full_name?: string | null
          height?: string | null
          hobbies?: string | null
          id?: string | null
          profile_picture_url?: string | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          updated_at?: string | null
          weight?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      profile_status: "available" | "booked"
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      profile_status: ["available", "booked"],
    },
  },
} as const
