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
      admin_settings: {
        Row: {
          created_at: string
          creativity_categories: Json
          id: string
          leaderboard_from_date: string | null
          leaderboard_notice: string | null
          leaderboard_visible: boolean
          leaderboard_visible_from: string | null
          leaderboard_visible_until: string | null
          library_open_date: string | null
          library_open_day: number
          manager_password: string
          novel_notice: string
          password: string
          review_points_default: number | null
          scoring_table: Json | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          creativity_categories?: Json
          id?: string
          leaderboard_from_date?: string | null
          leaderboard_notice?: string | null
          leaderboard_visible?: boolean
          leaderboard_visible_from?: string | null
          leaderboard_visible_until?: string | null
          library_open_date?: string | null
          library_open_day?: number
          manager_password?: string
          novel_notice?: string
          password?: string
          review_points_default?: number | null
          scoring_table?: Json | null
          updated_at?: string
          username?: string
        }
        Update: {
          created_at?: string
          creativity_categories?: Json
          id?: string
          leaderboard_from_date?: string | null
          leaderboard_notice?: string | null
          leaderboard_visible?: boolean
          leaderboard_visible_from?: string | null
          leaderboard_visible_until?: string | null
          library_open_date?: string | null
          library_open_day?: number
          manager_password?: string
          novel_notice?: string
          password?: string
          review_points_default?: number | null
          scoring_table?: Json | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      book_requests: {
        Row: {
          book_id: string
          book_number_code: string
          book_title: string
          book_volume: string | null
          created_at: string
          id: string
          request_date: string
          requester_class: string
          requester_name: string
          return_date: string | null
          status: string
        }
        Insert: {
          book_id: string
          book_number_code: string
          book_title: string
          book_volume?: string | null
          created_at?: string
          id?: string
          request_date?: string
          requester_class: string
          requester_name: string
          return_date?: string | null
          status?: string
        }
        Update: {
          book_id?: string
          book_number_code?: string
          book_title?: string
          book_volume?: string | null
          created_at?: string
          id?: string
          request_date?: string
          requester_class?: string
          requester_name?: string
          return_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_requests_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string
          average_rating: number
          borrowed_by: string | null
          borrowed_date: string | null
          category: string
          cover_image: string | null
          created_at: string
          description: string | null
          id: string
          is_borrowed: boolean
          number_code: string
          pages: string | null
          publication: string | null
          return_date: string | null
          si_number: string
          title: string
          total_reviews: number
          updated_at: string
          volume: string | null
        }
        Insert: {
          author: string
          average_rating?: number
          borrowed_by?: string | null
          borrowed_date?: string | null
          category: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_borrowed?: boolean
          number_code: string
          pages?: string | null
          publication?: string | null
          return_date?: string | null
          si_number: string
          title: string
          total_reviews?: number
          updated_at?: string
          volume?: string | null
        }
        Update: {
          author?: string
          average_rating?: number
          borrowed_by?: string | null
          borrowed_date?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_borrowed?: boolean
          number_code?: string
          pages?: string | null
          publication?: string | null
          return_date?: string | null
          si_number?: string
          title?: string
          total_reviews?: number
          updated_at?: string
          volume?: string | null
        }
        Relationships: []
      }
      borrow_records: {
        Row: {
          book_id: string
          book_title: string
          book_volume: string | null
          borrowed_date: string
          borrower_class: string | null
          borrower_name: string
          created_at: string
          id: string
          is_returned: boolean
          read_status: string
          return_date: string
          review_conducted: boolean
        }
        Insert: {
          book_id: string
          book_title: string
          book_volume?: string | null
          borrowed_date: string
          borrower_class?: string | null
          borrower_name: string
          created_at?: string
          id?: string
          is_returned?: boolean
          read_status?: string
          return_date: string
          review_conducted?: boolean
        }
        Update: {
          book_id?: string
          book_title?: string
          book_volume?: string | null
          borrowed_date?: string
          borrower_class?: string | null
          borrower_name?: string
          created_at?: string
          id?: string
          is_returned?: boolean
          read_status?: string
          return_date?: string
          review_conducted?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "borrow_records_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_works: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string
          file_type: string
          file_url: string
          id: string
          media: string | null
          title: string
          updated_at: string
          work_date: string
          writer: string | null
        }
        Insert: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          media?: string | null
          title: string
          updated_at?: string
          work_date?: string
          writer?: string | null
        }
        Update: {
          category?: string | null
          cover_url?: string | null
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          media?: string | null
          title?: string
          updated_at?: string
          work_date?: string
          writer?: string | null
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          created_at: string
          entries: Json
          from_date: string | null
          id: string
          name: string
          notice: string | null
          until_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entries?: Json
          from_date?: string | null
          id?: string
          name: string
          notice?: string | null
          until_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entries?: Json
          from_date?: string | null
          id?: string
          name?: string
          notice?: string | null
          until_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotional_posters: {
        Row: {
          book_id: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotional_posters_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      publication_logos: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          publication_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          publication_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          publication_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          book_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_name: string
        }
        Insert: {
          book_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_name: string
        }
        Update: {
          book_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          average_rating: number
          cover_image: string | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          title: string
          total_reviews: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          cover_image?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          title: string
          total_reviews?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          cover_image?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          title?: string
          total_reviews?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          item_id: string
          rating: number
          user_name: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          item_id: string
          rating?: number
          user_name: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          item_id?: string
          rating?: number
          user_name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class: string
          code: string
          created_at: string
          date_of_birth: string | null
          father_name: string | null
          house_name: string | null
          id: string
          migrated_from: string | null
          name: string
          student_type: string
          updated_at: string
        }
        Insert: {
          class: string
          code?: string
          created_at?: string
          date_of_birth?: string | null
          father_name?: string | null
          house_name?: string | null
          id?: string
          migrated_from?: string | null
          name: string
          student_type?: string
          updated_at?: string
        }
        Update: {
          class?: string
          code?: string
          created_at?: string
          date_of_birth?: string | null
          father_name?: string | null
          house_name?: string | null
          id?: string
          migrated_from?: string | null
          name?: string
          student_type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      migrate_student: {
        Args: { new_id: string; old_id: string }
        Returns: undefined
      }
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
