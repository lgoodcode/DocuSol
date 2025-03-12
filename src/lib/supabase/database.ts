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
      document_signers: {
        Row: {
          created_at: string
          document_id: string
          id: string
          order_index: number
          rejection_reason: string | null
          signature_data: string | null
          signature_type: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["document_signer_status"]
          updated_at: string
          user_id: string
          version_id: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          order_index?: number
          rejection_reason?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_signer_status"]
          updated_at?: string
          user_id: string
          version_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          order_index?: number
          rejection_reason?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          status?: Database["public"]["Enums"]["document_signer_status"]
          updated_at?: string
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_signers_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signers_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          created_by: string
          document_id: string | null
          document_url: string
          hash: string
          id: string
          transaction_signature: string | null
          version_number: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          document_id?: string | null
          document_url: string
          hash: string
          id?: string
          transaction_signature?: string | null
          version_number?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          document_id?: string | null
          document_url?: string
          hash?: string
          id?: string
          transaction_signature?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_document_versions_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          completed_at: string | null
          created_at: string
          current_version_id: string | null
          expired_at: string | null
          filename: string
          id: string
          name: string
          password: string | null
          rejected_at: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_version_id?: string | null
          expired_at?: string | null
          filename: string
          id?: string
          name: string
          password?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_version_id?: string | null
          expired_at?: string | null
          filename?: string
          id?: string
          name?: string
          password?: string | null
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_documents_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_document_signers: {
        Args: {
          p_document_id: string
          p_signers: Json
        }
        Returns: {
          created_at: string
          document_id: string
          id: string
          order_index: number
          rejection_reason: string | null
          signature_data: string | null
          signature_type: string | null
          signed_at: string | null
          status: Database["public"]["Enums"]["document_signer_status"]
          updated_at: string
          user_id: string
          version_id: string | null
        }[]
      }
      create_document_with_version: {
        Args: {
          p_user_id: string
          p_name: string
          p_filename: string
          p_mime_type: string
          p_document_url: string
          p_hash: string
          p_password?: string
        }
        Returns: {
          document_id: string
          version_id: string
          version_number: number
        }[]
      }
      get_next_document_version_number: {
        Args: {
          doc_id: string
        }
        Returns: number
      }
      reject_document: {
        Args: {
          p_signer_id: string
          p_rejection_reason?: string
        }
        Returns: {
          document_id: string
          document_status: Database["public"]["Enums"]["document_status"]
        }[]
      }
      sign_document: {
        Args: {
          p_document_id: string
          p_signer_id: string
          p_user_id: string
          p_document_url: string
          p_hash: string
          p_signature_type?: string
          p_signature_data?: string
        }
        Returns: {
          version_id: string
          version_number: number
          document_status: Database["public"]["Enums"]["document_status"]
        }[]
      }
    }
    Enums: {
      document_signer_status: "pending" | "signed" | "rejected"
      document_status:
        | "draft"
        | "awaiting_signatures"
        | "partially_signed"
        | "completed"
        | "rejected"
        | "expired"
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

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

