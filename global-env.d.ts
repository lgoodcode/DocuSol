export declare global {
  declare namespace NodeJS {
    export interface ProcessEnv {
      SENTRY_PROJECT: string;
      SENTRY_ORG: string;
      SENTRY_AUTH_TOKEN: string;
      NEXT_PUBLIC_SENTRY_DSN: string;
      HELIUS_API_URL: string;
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      PRIVATE_KEY: string;
      NEXT_PUBLIC_PRIVY_APP_ID: string;
    }
  }

  interface NewDocument {
    name: string;
    password: string;
    original_filename: string;
    mime_type: string;
    original_document: File;
    unsigned_document: Blob;
  }

  interface ViewDocument {
    id: string;
    name: string;
    password: string | null;
    status: "signed" | "pending";
    mimeType: string;
    unsignedTxSignature: string;
    signedTxSignature: string | null;
    is_signed: boolean;
    unsignedDocument: Uint8Array;
    signedDocument: Uint8Array | null;
    createdAt: string;
    updatedAt: string;
  }

  /**
   * Store the documents as hex strings
   */
  interface InsertNewDocument
    extends Omit<NewDocument, "unsigned_document" | "signed_document"> {
    original_document: string;
    unsigned_document: string;
    unsigned_transaction_signature: string;
    unsigned_hash: string;
  }

  interface NewDocumentResponse {
    error?: string;
    id?: string;
    txSignature?: string;
    unsignedHash?: string;
  }

  interface StoredDocument {
    id: string;
    txSignature?: string;
    unsignedHash?: string;
  }
}
