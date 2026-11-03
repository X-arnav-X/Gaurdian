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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          lat: number
          lng: number
          name: string
          slug: string
        }
        Insert: {
          lat: number
          lng: number
          name: string
          slug: string
        }
        Update: {
          lat?: number
          lng?: number
          name?: string
          slug?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string
          id: string
          senior_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          senior_id: string
        }
        Update: {
          created_at?: string
          id?: string
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          created_at: string
          id: string
          linked_senior_id: string | null
          name: string
          preferred_language: Database["public"]["Enums"]["pref_language"]
          role: Database["public"]["Enums"]["app_role"]
          safety_code: string | null
          username: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          id: string
          linked_senior_id?: string | null
          name: string
          preferred_language?: Database["public"]["Enums"]["pref_language"]
          role: Database["public"]["Enums"]["app_role"]
          safety_code?: string | null
          username: string
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          linked_senior_id?: string | null
          name?: string
          preferred_language?: Database["public"]["Enums"]["pref_language"]
          role?: Database["public"]["Enums"]["app_role"]
          safety_code?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_area_fkey"
            columns: ["area"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "profiles_linked_senior_id_fkey"
            columns: ["linked_senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scam_checks: {
        Row: {
          category: Database["public"]["Enums"]["scam_category"]
          confidence: string | null
          created_at: string
          id: string
          input_type: Database["public"]["Enums"]["check_input_type"]
          recommended_action: string
          red_flags: string[]
          senior_id: string
          summary: string
          verdict: Database["public"]["Enums"]["scam_verdict"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["scam_category"]
          confidence?: string | null
          created_at?: string
          id?: string
          input_type?: Database["public"]["Enums"]["check_input_type"]
          recommended_action?: string
          red_flags?: string[]
          senior_id: string
          summary: string
          verdict: Database["public"]["Enums"]["scam_verdict"]
        }
        Update: {
          category?: Database["public"]["Enums"]["scam_category"]
          confidence?: string | null
          created_at?: string
          id?: string
          input_type?: Database["public"]["Enums"]["check_input_type"]
          recommended_action?: string
          red_flags?: string[]
          senior_id?: string
          summary?: string
          verdict?: Database["public"]["Enums"]["scam_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "scam_checks_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scam_reports: {
        Row: {
          area_slug: string
          category: Database["public"]["Enums"]["scam_category"]
          created_at: string
          id: string
          source: string
        }
        Insert: {
          area_slug: string
          category: Database["public"]["Enums"]["scam_category"]
          created_at?: string
          id?: string
          source?: string
        }
        Update: {
          area_slug?: string
          category?: Database["public"]["Enums"]["scam_category"]
          created_at?: string
          id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "scam_reports_area_slug_fkey"
            columns: ["area_slug"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["slug"]
          },
        ]
      }
      voice_queries: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          senior_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          senior_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          senior_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_queries_senior_id_fkey"
            columns: ["senior_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      daily_activity: {
        Args: { window_days?: number }
        Returns: {
          checks: number
          day: string
          reports: number
        }[]
      }
      observed_senior_id: { Args: { _user_id: string }; Returns: string }
      platform_stats: { Args: never; Returns: Json }
      scam_watch: {
        Args: { window_days?: number }
        Returns: {
          area_name: string
          area_slug: string
          lat: number
          lng: number
          reports: number
          top_category: Database["public"]["Enums"]["scam_category"]
          top_category_reports: number
        }[]
      }
      scam_watch_categories: {
        Args: { window_days?: number }
        Returns: {
          category: Database["public"]["Enums"]["scam_category"]
          reports: number
        }[]
      }
      senior_by_safety_code: {
        Args: { _code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      username_exists: { Args: { _username: string }; Returns: boolean }
    }
    Enums: {
      app_role: "senior" | "family"
      check_input_type: "text" | "screenshot"
      pref_language: "en" | "hi" | "kn"
      scam_category:
        | "fake_kyc"
        | "otp_phishing"
        | "courier_customs"
        | "electricity_bill"
        | "digital_arrest"
        | "lottery_prize"
        | "impersonation"
        | "job_offer"
        | "upi_request"
        | "other"
      scam_verdict: "scam" | "safe" | "unsure"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["senior", "family"],
      check_input_type: ["text", "screenshot"],
      pref_language: ["en", "hi", "kn"],
      scam_category: [
        "fake_kyc",
        "otp_phishing",
        "courier_customs",
        "electricity_bill",
        "digital_arrest",
        "lottery_prize",
        "impersonation",
        "job_offer",
        "upi_request",
        "other",
      ],
      scam_verdict: ["scam", "safe", "unsure"],
    },
  },
} as const
