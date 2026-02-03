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
      detection_results: {
        Row: {
          bounding_boxes: Json | null
          confidence: number | null
          created_at: string
          facings_count: number
          id: string
          is_available: boolean
          job_id: string
          share_of_shelf: number | null
          sku_id: string | null
        }
        Insert: {
          bounding_boxes?: Json | null
          confidence?: number | null
          created_at?: string
          facings_count?: number
          id?: string
          is_available?: boolean
          job_id: string
          share_of_shelf?: number | null
          sku_id?: string | null
        }
        Update: {
          bounding_boxes?: Json | null
          confidence?: number | null
          created_at?: string
          facings_count?: number
          id?: string
          is_available?: boolean
          job_id?: string
          share_of_shelf?: number | null
          sku_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detection_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "processing_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detection_results_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      detections: {
        Row: {
          annotated_image_url: string | null
          detected_skus: number | null
          detection_result: Json | null
          id: string
          missing_skus: number | null
          original_image_url: string
          processed_at: string
          share_of_shelf_percentage: number | null
          store_id: string | null
          tenant_id: string
          total_facings: number | null
        }
        Insert: {
          annotated_image_url?: string | null
          detected_skus?: number | null
          detection_result?: Json | null
          id?: string
          missing_skus?: number | null
          original_image_url: string
          processed_at?: string
          share_of_shelf_percentage?: number | null
          store_id?: string | null
          tenant_id: string
          total_facings?: number | null
        }
        Update: {
          annotated_image_url?: string | null
          detected_skus?: number | null
          detection_result?: Json | null
          id?: string
          missing_skus?: number | null
          original_image_url?: string
          processed_at?: string
          share_of_shelf_percentage?: number | null
          store_id?: string | null
          tenant_id?: string
          total_facings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          model_path: string | null
          status: string
          tenant_id: string
          trained_date: string | null
          updated_at: string
          version: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          model_path?: string | null
          status?: string
          tenant_id: string
          trained_date?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          model_path?: string | null
          status?: string
          tenant_id?: string
          trained_date?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          tenant_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          tenant_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          annotated_image_url: string | null
          created_at: string
          end_time: string | null
          error_message: string | null
          id: string
          model_id: string | null
          original_image_url: string
          start_time: string | null
          status: string
          store_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          annotated_image_url?: string | null
          created_at?: string
          end_time?: string | null
          error_message?: string | null
          id?: string
          model_id?: string | null
          original_image_url: string
          start_time?: string | null
          status?: string
          store_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          annotated_image_url?: string | null
          created_at?: string
          end_time?: string | null
          error_message?: string | null
          id?: string
          model_id?: string | null
          original_image_url?: string
          start_time?: string | null
          status?: string
          store_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_jobs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          last_login: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shelf_images: {
        Row: {
          created_at: string
          detection_result: Json | null
          id: string
          image_url: string
          processed_at: string | null
          shelf_id: string
        }
        Insert: {
          created_at?: string
          detection_result?: Json | null
          id?: string
          image_url: string
          processed_at?: string | null
          shelf_id: string
        }
        Update: {
          created_at?: string
          detection_result?: Json | null
          id?: string
          image_url?: string
          processed_at?: string | null
          shelf_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelf_images_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
        ]
      }
      shelf_products: {
        Row: {
          created_at: string
          expected_facings: number | null
          id: string
          position_order: number | null
          shelf_id: string
          sku_id: string
        }
        Insert: {
          created_at?: string
          expected_facings?: number | null
          id?: string
          position_order?: number | null
          shelf_id: string
          sku_id: string
        }
        Update: {
          created_at?: string
          expected_facings?: number | null
          id?: string
          position_order?: number | null
          shelf_id?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelf_products_shelf_id_fkey"
            columns: ["shelf_id"]
            isOneToOne: false
            referencedRelation: "shelves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelf_products_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      shelves: {
        Row: {
          created_at: string
          description: string | null
          id: string
          location_in_store: string | null
          name: string
          store_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          location_in_store?: string | null
          name: string
          store_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          location_in_store?: string | null
          name?: string
          store_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelves_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shelves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          sku_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          sku_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          sku_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sku_images_sku_id_fkey"
            columns: ["sku_id"]
            isOneToOne: false
            referencedRelation: "skus"
            referencedColumns: ["id"]
          },
        ]
      }
      skus: {
        Row: {
          barcode: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          training_status: Database["public"]["Enums"]["training_status"]
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          training_status?: Database["public"]["Enums"]["training_status"]
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          training_status?: Database["public"]["Enums"]["training_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skus_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skus_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          max_images_per_month: number
          max_images_per_week: number
          max_images_per_year: number
          max_skus: number
          name: string
          processed_images_this_month: number
          processed_images_this_week: number
          processed_images_this_year: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_images_per_month?: number
          max_images_per_week?: number
          max_images_per_year?: number
          max_skus?: number
          name: string
          processed_images_this_month?: number
          processed_images_this_week?: number
          processed_images_this_year?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_images_per_month?: number
          max_images_per_week?: number
          max_images_per_year?: number
          max_skus?: number
          name?: string
          processed_images_this_month?: number
          processed_images_this_week?: number
          processed_images_this_year?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          created_at: string
          id: string
          images_processed: number
          period_start: string
          period_type: string
          tenant_id: string
          training_jobs: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          images_processed?: number
          period_start: string
          period_type: string
          tenant_id: string
          training_jobs?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          images_processed?: number
          period_start?: string
          period_type?: string
          tenant_id?: string
          training_jobs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tenant_quota: { Args: { _tenant_id: string }; Returns: Json }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage_metric: {
        Args: {
          _images_count?: number
          _period_type: string
          _tenant_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "tenant_admin" | "tenant_user"
      training_status: "pending" | "training" | "completed" | "failed"
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
      app_role: ["admin", "tenant_admin", "tenant_user"],
      training_status: ["pending", "training", "completed", "failed"],
    },
  },
} as const
