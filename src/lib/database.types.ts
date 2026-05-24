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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          article_id: string | null
          completed_at: string | null
          cost_breakdown: Json
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          progress_log: string[]
          run_date: string
          status: string
          topic: string | null
          trigger_type: string
        }
        Insert: {
          article_id?: string | null
          completed_at?: string | null
          cost_breakdown?: Json
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          progress_log?: string[]
          run_date?: string
          status?: string
          topic?: string | null
          trigger_type?: string
        }
        Update: {
          article_id?: string | null
          completed_at?: string | null
          cost_breakdown?: Json
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          progress_log?: string[]
          run_date?: string
          status?: string
          topic?: string | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_generations: {
        Row: {
          article_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          generation_time_ms: number | null
          id: string
          keyword: string
          model_used: string | null
          status: string
          tokens_used: number | null
        }
        Insert: {
          article_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          keyword: string
          model_used?: string | null
          status?: string
          tokens_used?: number | null
        }
        Update: {
          article_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          generation_time_ms?: number | null
          id?: string
          keyword?: string
          model_used?: string | null
          status?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "article_generations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_id: string
          content: string
          created_at: string
          excerpt: string
          id: string
          meta_description: string
          meta_title: string
          og_image: string
          published: boolean
          published_at: string | null
          slug: string
          tags: string[]
          title: string
          updated_at: string
          video_duration: number | null
          video_thumbnail_url: string | null
          video_url: string | null
          view_count: number
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          meta_description?: string
          meta_title?: string
          og_image?: string
          published?: boolean
          published_at?: string | null
          slug: string
          tags?: string[]
          title: string
          updated_at?: string
          video_duration?: number | null
          video_thumbnail_url?: string | null
          video_url?: string | null
          view_count?: number
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          meta_description?: string
          meta_title?: string
          og_image?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          video_duration?: number | null
          video_thumbnail_url?: string | null
          video_url?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          read: boolean
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string
          read?: boolean
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          read?: boolean
          source?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          published: boolean
          sort_order: number
          thumbnail_url: string
          title: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          published?: boolean
          sort_order?: number
          thumbnail_url?: string
          title: string
          video_url?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          published?: boolean
          sort_order?: number
          thumbnail_url?: string
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          bio: string
          created_at: string
          full_name: string
          id: string
          role: string
          updated_at: string
          website: string
        }
        Insert: {
          avatar_url?: string
          bio?: string
          created_at?: string
          full_name?: string
          id: string
          role?: string
          updated_at?: string
          website?: string
        }
        Update: {
          avatar_url?: string
          bio?: string
          created_at?: string
          full_name?: string
          id?: string
          role?: string
          updated_at?: string
          website?: string
        }
        Relationships: []
      }
      stock_clips: {
        Row: {
          active: boolean
          created_at: string
          duration_seconds: number
          filename: string
          height: number
          id: string
          r2_url: string
          tags: string[]
          width: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_seconds?: number
          filename: string
          height?: number
          id?: string
          r2_url: string
          tags?: string[]
          width?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_seconds?: number
          filename?: string
          height?: number
          id?: string
          r2_url?: string
          tags?: string[]
          width?: number
        }
        Relationships: []
      }
      veo_usage: {
        Row: {
          cost_usd: number
          created_at: string
          id: string
          prompt: string
          run_id: string | null
          video_url: string | null
        }
        Insert: {
          cost_usd: number
          created_at?: string
          id?: string
          prompt: string
          run_id?: string | null
          video_url?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: string
          prompt?: string
          run_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veo_usage_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
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
    Enums: {},
  },
} as const
