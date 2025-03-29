import type { Database } from "./database";

// Tables
export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentVersion =
  Database["public"]["Tables"]["document_versions"]["Row"];
export type DocumentSigner =
  Database["public"]["Tables"]["document_signers"]["Row"];

// Enums
export type DocumentStatus = Database["public"]["Enums"]["document_status"];
export type DocumentSignerStatus =
  Database["public"]["Enums"]["document_signer_status"];
