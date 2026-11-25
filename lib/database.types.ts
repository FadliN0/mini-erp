/**
 * Database types untuk Supabase — mini-erp (cv-hjp-dms)
 *
 * CATATAN: file ini DIREKONSTRUKSI dari hasil audit skema production
 * 24 Nov 2026 (query katalog Blok 2 + Blok 3), BUKAN hasil resmi
 * `supabase gen types`. Struktur dan isinya mengikuti format generator
 * resmi. Untuk regenerasi resmi di masa depan:
 *   supabase gen types typescript --project-id gyjoeqwbiwcksqywvqoi > lib/database.types.ts
 * lalu bandingkan diff-nya dengan file ini.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      company_targets: {
        Row: {
          id: string
          month: number
          year: number
          target_amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          month: number
          year: number
          target_amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          month?: number
          year?: number
          target_amount?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          address_type: string
          complete_address: string
          pic_name: string
          pic_phone: string | null
          is_default: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          address_type: string
          complete_address: string
          pic_name: string
          pic_phone?: string | null
          is_default?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          address_type?: string
          complete_address?: string
          pic_name?: string
          pic_phone?: string | null
          is_default?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_targets: {
        Row: {
          id: string
          customer_id: string
          month: number
          year: number
          target_amount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          month: number
          year: number
          target_amount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          month?: number
          year?: number
          target_amount?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_targets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          id: string
          company_name: string
          tax_id: string | null
          created_at: string | null
          email: string | null
          phone: string | null
          requires_invoice_on_do: boolean
        }
        Insert: {
          id?: string
          company_name: string
          tax_id?: string | null
          created_at?: string | null
          email?: string | null
          phone?: string | null
          requires_invoice_on_do?: boolean
        }
        Update: {
          id?: string
          company_name?: string
          tax_id?: string | null
          created_at?: string | null
          email?: string | null
          phone?: string | null
          requires_invoice_on_do?: boolean
        }
        Relationships: []
      }
      delivery_order_items: {
        Row: {
          id: string
          do_id: string
          so_item_id: string
          qty_delivered: number
        }
        Insert: {
          id?: string
          do_id: string
          so_item_id: string
          qty_delivered: number
        }
        Update: {
          id?: string
          do_id?: string
          so_item_id?: string
          qty_delivered?: number
        }
        Relationships: [
          {
            foreignKeyName: "delivery_order_items_do_id_fkey"
            columns: ["do_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_order_items_so_item_id_fkey"
            columns: ["so_item_id"]
            isOneToOne: false
            referencedRelation: "sales_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          id: string
          do_number: string
          so_id: string
          address_id: string
          delivery_date: string
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          do_number: string
          so_id: string
          address_id: string
          delivery_date: string
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          do_number?: string
          so_id?: string
          address_id?: string
          delivery_date?: string
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          id: string
          invoice_id: string
          so_item_id: string
          qty_billed: number
          unit_price: number
          discount: number | null
          total_price: number
          item_note: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          so_item_id: string
          qty_billed: number
          unit_price: number
          discount?: number | null
          total_price: number
          item_note?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          so_item_id?: string
          qty_billed?: number
          unit_price?: number
          discount?: number | null
          total_price?: number
          item_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_so_item_id_fkey"
            columns: ["so_item_id"]
            isOneToOne: false
            referencedRelation: "sales_order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          so_id: string
          address_id: string
          grand_total: number | null
          due_date: string
          status: string | null
          created_at: string | null
          due_date_note: string | null
          customer_id: string
          amount_paid: number | null
          discount_amount: number | null
          cancel_reason: string | null
          canceled_at: string | null
        }
        Insert: {
          id?: string
          invoice_number: string
          so_id: string
          address_id: string
          grand_total?: number | null
          due_date: string
          status?: string | null
          created_at?: string | null
          due_date_note?: string | null
          customer_id: string
          amount_paid?: number | null
          discount_amount?: number | null
          cancel_reason?: string | null
          canceled_at?: string | null
        }
        Update: {
          id?: string
          invoice_number?: string
          so_id?: string
          address_id?: string
          grand_total?: number | null
          due_date?: string
          status?: string | null
          created_at?: string | null
          due_date_note?: string | null
          customer_id?: string
          amount_paid?: number | null
          discount_amount?: number | null
          cancel_reason?: string | null
          canceled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          payment_date: string
          amount_paid: number
          payment_method: string | null
          payment_proof_url: string | null
          created_at: string | null
          reference_number: string | null
        }
        Insert: {
          id?: string
          invoice_id: string
          payment_date: string
          amount_paid: number
          payment_method?: string | null
          payment_proof_url?: string | null
          created_at?: string | null
          reference_number?: string | null
        }
        Update: {
          id?: string
          invoice_id?: string
          payment_date?: string
          amount_paid?: number
          payment_method?: string | null
          payment_proof_url?: string | null
          created_at?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          part_code: string
          part_name: string
          unit: string
          price: number
          remark: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          part_code: string
          part_name: string
          unit: string
          price?: number
          remark?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          part_code?: string
          part_name?: string
          unit?: string
          price?: number
          remark?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_items: {
        Row: {
          id: string
          quotation_id: string
          product_id: string
          qty: number
          unit_price: number
          discount: number | null
          total_price: number
        }
        Insert: {
          id?: string
          quotation_id: string
          product_id: string
          qty?: number
          unit_price?: number
          discount?: number | null
          total_price?: number
        }
        Update: {
          id?: string
          quotation_id?: string
          product_id?: string
          qty?: number
          unit_price?: number
          discount?: number | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          id: string
          quotation_number: string
          customer_id: string
          address_id: string
          valid_until: string | null
          grand_total: number | null
          status: string | null
          created_at: string | null
          notes: string | null
          mr_number: string | null
        }
        Insert: {
          id?: string
          quotation_number: string
          customer_id: string
          address_id: string
          valid_until?: string | null
          grand_total?: number | null
          status?: string | null
          created_at?: string | null
          notes?: string | null
          mr_number?: string | null
        }
        Update: {
          id?: string
          quotation_number?: string
          customer_id?: string
          address_id?: string
          valid_until?: string | null
          grand_total?: number | null
          status?: string | null
          created_at?: string | null
          notes?: string | null
          mr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          id: string
          so_id: string
          product_id: string
          qty: number
          unit_price: number
          discount: number | null
          total_price: number
        }
        Insert: {
          id?: string
          so_id: string
          product_id: string
          qty: number
          unit_price: number
          discount?: number | null
          total_price: number
        }
        Update: {
          id?: string
          so_id?: string
          product_id?: string
          qty?: number
          unit_price?: number
          discount?: number | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_items_so_id_fkey"
            columns: ["so_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          id: string
          so_number: string
          quotation_id: string
          po_number: string
          customer_id: string
          address_id: string
          grand_total: number | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          so_number: string
          quotation_id: string
          po_number: string
          customer_id: string
          address_id: string
          grand_total?: number | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          so_number?: string
          quotation_id?: string
          po_number?: string
          customer_id?: string
          address_id?: string
          grand_total?: number | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_orders_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_transaction_lifecycle: {
        Row: {
          so_id: string | null
          so_number: string | null
          po_number: string | null
          so_date: string | null
          so_status: string | null
          total_order_value: number | null
          customer_id: string | null
          company_name: string | null
          delivery_status: string | null
          last_delivery_date: string | null
          total_do_count: number | null
          invoice_id: string | null
          invoice_number: string | null
          invoice_date: string | null
          due_date: string | null
          invoice_total: number | null
          total_paid_amount: number | null
          payment_status: string | null
          invoice_status: string | null
        }
        Relationships: []
      }
      view_document_tracking: {
        Row: {
          so_id: string | null
          so_number: string | null
          so_date: string | null
          so_status: string | null
          total_order_value: number | null
          company_name: string | null
          quotation_number: string | null
          quotation_status: string | null
          do_number: string | null
          do_status: string | null
          invoice_number: string | null
          invoice_status: string | null
        }
        Relationships: []
      }
      view_finance_reports: {
        Row: {
          so_id: string | null
          so_date: string | null
          so_number: string | null
          po_number: string | null
          total_order_value: number | null
          customer_id: string | null
          company_name: string | null
          delivery_status: string | null
          do_numbers: string | null
          invoice_number: string | null
          invoice_created_at: string | null
          payment_status: string | null
          total_paid_amount: number | null
        }
        Relationships: []
      }
      view_kpi_targets: {
        Row: {
          target_id: string | null
          customer_id: string | null
          company_name: string | null
          month: number | null
          year: number | null
          target_amount: number | null
          achieved_amount: number | null
          achievement_percentage: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_invoice: {
        Args: { p_invoice_id: string; p_reason: string }
        Returns: Json
      }
      create_do_transaction: {
        Args: { p_so_id: string; p_address_id: string; p_delivery_date: string; p_items: Json }
        Returns: Json
      }
      create_quotation_transaction: {
        // Parameter fungsi Postgres pada dasarnya nullable; tiga parameter
        // ini memang dikirim null oleh aplikasi (valid_until/mr_number/notes opsional).
        Args: { p_quotation_number: string; p_customer_id: string; p_address_id: string; p_valid_until: string | null; p_mr_number: string | null; p_grand_total: number; p_notes: string | null; p_items: Json }
        Returns: Json
      }
      extend_invoice_due_date: {
        Args: { p_invoice_id: string; p_new_due_date: string; p_note: string }
        Returns: undefined
      }
      generate_full_invoice_from_so: {
        Args: { p_so_id: string; p_due_date: string }
        Returns: Json
      }
      generate_sales_order: {
        Args: { p_quotation_id: string; p_po_number: string; p_customer_id: string; p_address_id: string; p_grand_total: number; p_items: Json }
        Returns: Json
      }
      get_remaining_backorder: {
        Args: { p_so_id: string }
        Returns: { so_item_id: string; product_id: string; ordered_qty: number; delivered_qty: number; remaining_qty: number }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      recompute_so_status: {
        Args: { p_so_id: string }
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

