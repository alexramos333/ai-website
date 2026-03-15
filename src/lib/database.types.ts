// Manual TypeScript types matching the Supabase schema.
// Replace this file by running: npm run db:types
// after the schema has been applied to the Supabase project.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string;
          website: string;
          bio: string;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          bio?: string;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string;
          website?: string;
          bio?: string;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          excerpt: string;
          meta_title: string;
          meta_description: string;
          og_image: string;
          published: boolean;
          published_at: string | null;
          author_id: string;
          tags: string[];
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string;
          excerpt?: string;
          meta_title?: string;
          meta_description?: string;
          og_image?: string;
          published?: boolean;
          published_at?: string | null;
          author_id: string;
          tags?: string[];
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          excerpt?: string;
          meta_title?: string;
          meta_description?: string;
          og_image?: string;
          published?: boolean;
          published_at?: string | null;
          author_id?: string;
          tags?: string[];
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contact_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          message: string;
          source: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string;
          message: string;
          source?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          message?: string;
          source?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      portfolio_items: {
        Row: {
          id: string;
          title: string;
          description: string;
          video_url: string;
          thumbnail_url: string;
          category: string;
          sort_order: number;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          video_url?: string;
          thumbnail_url?: string;
          category?: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          video_url?: string;
          thumbnail_url?: string;
          category?: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
