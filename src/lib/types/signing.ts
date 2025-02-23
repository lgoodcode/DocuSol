/** Supported signing modes */
export type SigningMode = "transparent" | "anonymous";

/** Role types for document signers */
export type SignerRole =
  | "owner"
  | "reviewer"
  | "witness"
  | "notary"
  | "participant";

/** Base interface for all signers */
interface BaseSigner {
  role: SignerRole;
  required: boolean;
  order?: number;
  deadline?: number; // Unix timestamp
}

/** Transparent signer with visible wallet address */
interface TransparentSigner extends BaseSigner {
  mode: "transparent";
  address: string;
}

/** Anonymous signer using ZKP */
interface AnonymousSigner extends BaseSigner {
  mode: "anonymous";
  verificationKey: string; // ZKP verification key
  commitment: string; // Public commitment
}

/** Signature types */
interface BaseSignature {
  timestamp: number;
  blockHeight: number;
}

/** Transparent signature with wallet address */
interface TransparentSignature extends BaseSignature {
  type: "transparent";
  address: string;
  signature: string;
}

/** Anonymous signature with ZKP */
interface AnonymousSignature extends BaseSignature {
  type: "anonymous";
  proof: string; // ZKP proof
}

/** Document metadata */
interface DocumentMetadata {
  title?: string;
  documentType?: string;
  contentType?: string;
  pageCount?: number;
  expiresAt?: number;
  createdAt: number;
  documentId: string;
  version: string;
}

/** Lifecycle controls */
interface DocumentLifecycle {
  isSequential: boolean;
  requireAllSignatures: boolean;
  minSignatures?: number;
  allowRevocation: boolean;
  expiresAt?: number;
}

/** Document stamp status */
type DocumentStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired"
  | "revoked";

/** Main DocumentStamp type */
export interface DocumentStamp {
  /** Core stamp data */
  stamp: {
    /** Version of the stamping algorithm used */
    version: string;

    /** SHA-256 hash of the original file */
    fileHash: string;

    /** Timestamp of stamp creation */
    timestamp: number;

    /** List of transparent signers */
    transparentSigners: TransparentSigner[];

    /** Verification keys for anonymous signers */
    anonymousSignerKeys: string[];

    /** Document metadata */
    metadata: DocumentMetadata;

    /** Lifecycle controls */
    lifecycle: DocumentLifecycle;

    /** Current status */
    status: DocumentStatus;
  };

  /** Signature records */
  signatures: {
    transparent: TransparentSignature[];
    anonymous: AnonymousSignature[];
  };

  /** Blockchain proof */
  proof: BlockchainProof;

  /** Audit trail */
  audit: {
    /** History of all actions on document */
    history: Array<{
      action: "created" | "signed" | "revoked" | "expired";
      timestamp: number;
      blockHeight: number;
      /** Address only included for transparent signatures */
      address?: string;
      metadata?: Record<string, unknown>;
    }>;

    /** Access log for verification attempts */
    verificationLog: Array<{
      timestamp: number;
      success: boolean;
      error?: string;
    }>;
  };
}

/** Input for creating a new document stamp */
export interface CreateStampInput {
  /** Original file buffer */
  fileBuffer: Buffer;

  /** Signer information */
  signers: Array<{
    address: string;
    mode: SigningMode;
    role: SignerRole;
    required?: boolean;
    order?: number;
    deadline?: number;
  }>;

  /** Additional options */
  options?: {
    title?: string;
    documentType?: string;
    contentType?: string;
    pageCount?: number;
    expiresAt?: number;
    sequential?: boolean;
    requireAllSignatures?: boolean;
    minSignatures?: number;
    allowRevocation?: boolean;
    metadata?: Record<string, unknown>;
  };
}

/** Result of signature verification */
export interface VerificationResult {
  isValid: boolean;
  checks: Array<{
    check: "fileIntegrity" | "signatures" | "signatureOrder" | "expiration";
    passed: boolean;
    details?: Record<string, unknown>;
  }>;
  details: {
    documentInfo: {
      id: string;
      title?: string;
      created: number;
      status: DocumentStatus;
    };
    signerInfo: Array<{
      type: SigningMode;
      role: SignerRole;
      signed: boolean;
      timestamp?: number;
    }>;
    blockchainInfo: BlockchainProof;
  };
}

/** Base error interface for all stamping errors */
interface BaseStampError {
  message: string;
  code: number;
  timestamp: number;
  details?: Record<string, unknown>;
}

/** Error codes for different stamp error types */
export const STAMP_ERROR_CODES = {
  INVALID_SIGNER: 4001,
  INVALID_SIGNATURE: 4002,
  INVALID_PROOF: 4003,
  EXPIRED: 4004,
  REVOKED: 4005,
  SEQUENCE_ERROR: 4006,
  BLOCKCHAIN_ERROR: 5001,
} as const;

/** Error types for document stamping */
export type StampError =
  | (BaseStampError & {
      type: "INVALID_SIGNER";
      context: {
        address?: string;
        role?: SignerRole;
        reason: "NOT_AUTHORIZED" | "INVALID_ADDRESS" | "WRONG_ROLE";
      };
    })
  | (BaseStampError & {
      type: "INVALID_SIGNATURE";
      context: {
        signatureId?: string;
        reason: "MALFORMED" | "VERIFICATION_FAILED" | "DUPLICATE";
      };
    })
  | (BaseStampError & {
      type: "INVALID_PROOF";
      context: {
        proofType: "MERKLE" | "ZKP";
        reason: "INVALID_FORMAT" | "VERIFICATION_FAILED";
      };
    })
  | (BaseStampError & {
      type: "EXPIRED";
      context: {
        expirationTime: number;
        currentTime: number;
      };
    })
  | (BaseStampError & {
      type: "REVOKED";
      context: {
        revokedAt: number;
        revokedBy?: string;
        reason?: string;
      };
    })
  | (BaseStampError & {
      type: "SEQUENCE_ERROR";
      context: {
        expectedOrder: number;
        actualOrder: number;
        previousSigner?: string;
      };
    })
  | (BaseStampError & {
      type: "BLOCKCHAIN_ERROR";
      context: {
        operation: "READ" | "WRITE" | "VERIFY";
        networkId?: string;
        txHash?: string;
      };
    });

/** Helper type to extract error context based on error type */
export type StampErrorContext<T extends StampError["type"]> = Extract<
  StampError,
  { type: T }
>["context"];

/** Helper to create typed stamp errors */
export function createStampError<T extends StampError["type"]>(
  type: T,
  message: string,
  context: StampErrorContext<T>,
): Extract<StampError, { type: T }> {
  return {
    type,
    message,
    code: STAMP_ERROR_CODES[type],
    timestamp: Date.now(),
    context,
  } as Extract<StampError, { type: T }>;
}
