import type {
  Document,
  DocumentVersion,
  DocumentSigner,
  DocumentStatus,
  DocumentSignerStatus,
} from "@/lib/supabase/types";
import type { JWTPayload } from "jose";

export declare global {
  declare namespace NodeJS {
    export interface ProcessEnv {
      SENTRY_PROJECT: string;
      SENTRY_ORG: string;
      SENTRY_AUTH_TOKEN: string;
      NEXT_PUBLIC_SENTRY_DSN: string;

      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      NEXT_PUBLIC_HELIUS_API_URL: string;

      UPSTASH_REDIS_REST_URL: string;
      UPSTASH_REDIS_REST_TOKEN: string;

      RESEND_API_KEY: string;

      STAMP_OBFUSCATION_KEY: string;

      PRIVATE_KEY: string;
    }
  }

  interface AccessTokenPayload extends JWTPayload {
    id: string;
    publicKey: string;
  }

  type Tokens = {
    accessToken: string;
    refreshToken: string;
  };

  type DocumentDetails = Partial<
    Omit<Document, "password"> & {
      password: boolean;
    }
  >;

  interface NewDocument {
    name: string;
    password: string;
    original_filename: string;
    mime_type: string;
    original_document: File;
    unsigned_document: Blob;
  }

  interface NewDocumentResponse {
    error?: string;
    id?: string;
    txSignature?: string;
    unsignedHash?: string;
  }

  interface NewDocumentResult {
    id: string;
    txSignature: string;
    unsignedHash: string;
  }

  interface DocumentToSign {
    id: string;
    mime_type: string;
    unsigned_document: string;
  }

  interface SignedDocument {
    id: string;
    password: string | null;
    signed_document: Blob;
  }

  interface SignedDocumentResponse {
    error?: string;
    txSignature?: string;
    signedHash?: string;
  }

  interface SignedDocumentResult {
    id: string;
    txSignature: string;
    signedHash: string;
  }

  interface ViewDocument {
    id: string;
    name: string;
    password: string | null;
    status: "signed" | "pending";
    mimeType: string;
    unsignedTxSignature: string;
    signedTxSignature: string | null;
    unsignedHash: string;
    signedHash: string | null;
    is_signed: boolean;
    unsignedDocumentHex: string;
    signedDocumentHex: string | null;
    createdAt: string;
    updatedAt: string;
  }

  interface VerifyDocumentData {
    id: string;
    name: string;
    hasPassword: boolean;
    createdAt: string;
    completedAt: string;
    txSignature: string;
    hash: string;
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

  interface StoredDocument {
    id: string;
    txSignature?: string;
    unsignedHash?: string;
    signedHash?: string;
  }
}
