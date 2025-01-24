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
    }
  }

  interface NewDocument {
    name: string;
    password: string;
    original_filename: string;
    mime_type: string;
    unsigned_document: File;
    signed_document: Blob;
  }

  interface InsertNewDocument
    extends Omit<NewDocument, "unsigned_document" | "signed_document"> {
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
