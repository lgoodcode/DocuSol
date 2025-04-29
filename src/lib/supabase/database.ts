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
      document_fields: {
        Row: {
          created_at: string
          document_id: string
          id: string
          label: string | null
          options: Json | null
          participant_id: string | null
          position_page: number
          position_x: number
          position_y: number
          required: boolean
          signature_scale: number | null
          size_height: number
          size_width: number
          text_styles: Json | null
          type: Database["public"]["Enums"]["document_field_type"]
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          label?: string | null
          options?: Json | null
          participant_id?: string | null
          position_page: number
          position_x: number
          position_y: number
          required?: boolean
          signature_scale?: number | null
          size_height: number
          size_width: number
          text_styles?: Json | null
          type: Database["public"]["Enums"]["document_field_type"]
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          label?: string | null
          options?: Json | null
          participant_id?: string | null
          position_page?: number
          position_x?: number
          position_y?: number
          required?: boolean
          signature_scale?: number | null
          size_height?: number
          size_width?: number
          text_styles?: Json | null
          type?: Database["public"]["Enums"]["document_field_type"]
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_fields_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_fields_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "document_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_participants: {
        Row: {
          color: string | null
          created_at: string
          document_id: string
          email: string | null
          id: string
          is_owner: boolean
          mode: Database["public"]["Enums"]["participant_mode"]
          name: string | null
          role: Database["public"]["Enums"]["participant_role"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          document_id: string
          email?: string | null
          id: string
          is_owner?: boolean
          mode?: Database["public"]["Enums"]["participant_mode"]
          name?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          document_id?: string
          email?: string | null
          id?: string
          is_owner?: boolean
          mode?: Database["public"]["Enums"]["participant_mode"]
          name?: string | null
          role?: Database["public"]["Enums"]["participant_role"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_participants_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
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
          contenthash: string
          created_at: string
          created_by: string
          document_id: string | null
          filehash: string
          id: string
          metadatahash: string
          transaction_signature: string | null
          version_number: number
        }
        Insert: {
          contenthash: string
          created_at?: string
          created_by: string
          document_id?: string | null
          filehash: string
          id?: string
          metadatahash: string
          transaction_signature?: string | null
          version_number?: number
        }
        Update: {
          contenthash?: string
          created_at?: string
          created_by?: string
          document_id?: string | null
          filehash?: string
          id?: string
          metadatahash?: string
          transaction_signature?: string | null
          version_number?: number
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
          expires_at: string | null
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
          expires_at?: string | null
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
          expires_at?: string | null
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
      email_verification_tokens: {
        Row: {
          created_at: string
          document_id: string
          email: string
          expires_at: string
          id: string
          invalidated_at: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          email: string
          expires_at: string
          id?: string
          invalidated_at?: string | null
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          email?: string
          expires_at?: string
          id?: string
          invalidated_at?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_tokens_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
      add_document_version: {
        Args: {
          p_document_id: string
          p_content_hash: string
          p_file_hash: string
          p_metadata_hash: string
          p_user_id: string
          p_transaction_signature: string
        }
        Returns: {
          version_id: string
          version_number: number
        }[]
      }
      create_draft_document: {
        Args: {
          p_name: string
          p_content_hash: string
          p_file_hash: string
          p_metadata_hash: string
        }
        Returns: {
          document_id: string
          version_id: string
          out_version_number: number
        }[]
      }
      dry_run_finalize_document_upload: {
        Args: {
          p_document_id: string
          p_user_id: string
          p_content_hash: string
          p_file_hash: string
          p_metadata_hash: string
          p_transaction_signature: string
          p_fields: Json
          p_participants: Json
          p_expires_at?: string
          p_password?: string
        }
        Returns: boolean
      }
      finalize_document_upload: {
        Args: {
          p_document_id: string
          p_user_id: string
          p_content_hash: string
          p_file_hash: string
          p_metadata_hash: string
          p_transaction_signature: string
          p_fields: Json
          p_participants: Json
          p_expires_at?: string
          p_password?: string
        }
        Returns: boolean
      }
      get_document_details_for_signing: {
        Args: {
          p_document_id: string
        }
        Returns: {
          id: string
          name: string
          current_version_id: string
          current_version_number: number
          password: string
          status: Database["public"]["Enums"]["document_status"]
          completed_at: string
          expires_at: string
          rejected_at: string
        }[]
      }
      get_document_signing_data: {
        Args: {
          p_document_id: string
          p_signer_email: string
        }
        Returns: {
          signer: Json
          fields: Json
        }[]
      }
      get_document_with_version: {
        Args: {
          p_document_id: string
          p_version: number
        }
        Returns: {
          name: string
          password: string
          status: Database["public"]["Enums"]["document_status"]
          created_at: string
          completed_at: string
          contenthash: string
          filehash: string
          metadatahash: string
          tx_signature: string
          encryption_key: string
        }[]
      }
      get_documents_to_list: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          has_password: boolean
          status: Database["public"]["Enums"]["document_status"]
          tx_signature: string
          expires_at: string
          created_at: string
          updated_at: string
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
          p_content_hash: string
          p_file_hash: string
          p_metadata_hash: string
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
      document_field_type: "text" | "date" | "initials" | "signature"
      document_signer_status: "pending" | "signed" | "rejected"
      document_status:
        | "draft"
        | "awaiting_signatures"
        | "partially_signed"
        | "completed"
        | "rejected"
        | "expired"
      participant_mode: "transparent" | "anonymous"
      participant_role: "reviewer" | "witness" | "notary" | "participant"
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

