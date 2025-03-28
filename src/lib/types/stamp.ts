/** Current version of the stamp protocol */
export const STAMP_VERSION = "0.1";

/** Supported signing modes */
export type SigningMode = "transparent" | "anonymous";

/** Possible signature states */
export const SignatureState = {
  /** Document is upload but no fields or information is filled out */
  DRAFT: "draft",
  /** Document is waiting for a signature from participant(s) */
  AWAITING_SIGNATURES: "awaiting_signatures",
  /** Document is partially signed by participant(s) */
  PARTIALLY_SIGNED: "partially_signed",
  /** Document is signed by all participants */
  COMPLETED: "completed",
  /** Document is rejected by the owner or a participant */
  REJECTED: "rejected",
  /** Document has expired */
  EXPIRED: "expired",
} as const;

export type SignerRole =
  | "owner"
  | "reviewer"
  | "witness"
  | "notary"
  | "participant";

export type SignatureStatus =
  (typeof SignatureState)[keyof typeof SignatureState];

/** Base type to inherit basic dict structure */
type BaseDocumentType = Record<string, boolean | string | number | undefined>;

/**
 * Signer of the document
 *
 * @property id - ID of the signer field
 * @property userId - User ID of the signer - this will be set if the user is identified
 *   in our database
 * @property name - Name of the signer
 * @property email - Email of the signer
 * @property role - Role of the signer
 * @property mode - Signing mode for this participant
 * @property isOwner - Whether the signer is the owner of the document
 * @property color - Color of the signer
 */
export interface DocumentSigner extends BaseDocumentType {
  /** ID of the signer in the document properties */
  id: string;
  /** User ID of the signer */
  userId?: string;
  /** Name of the signer */
  name: string;
  /** Email of the signer */
  email: string;
  /** Role of the signer */
  role: SignerRole;
  /** Signing mode for this participant */
  mode: SigningMode;
  /** Whether the signer is the owner of the document */
  isOwner: boolean;
  /** Color of the signer - used for the document fields */
  color: string;
}

/**
 * Signature of the document
 *
 * @property signerIndex - Index of the signer in the signers array
 * @property proof - Signature data or ZK proof (if anonymous)
 * @property timestamp - Unix timestamp in milliseconds
 */
export interface DocumentSignature extends BaseDocumentType {
  /** Reference to signer array */
  signerIndex: number;
  /** Signature data or ZK proof */
  proof: string;
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Full hash of the document
 *
 * @property contentHash - Hash of PDF excluding metadata
 * @property fullHash - Hash of complete PDF including metadata
 * @property metadataHash `[optional]` - Hash of just the metadata
 */
export interface DocumentContentHash extends BaseDocumentType {
  /** Hash of PDF excluding metadata */
  contentHash: string;
  /** Hash of complete PDF including metadata */
  fileHash: string;
  /** Hash of just the metadata */
  metadataHash?: string;
}

/** Base type to inherit basic dict structure */
type BaseDocumentHashHistory = Record<
  string,
  string | number | undefined | DocumentHashUpdate[]
>;

/**
 * History of all hash updates and signatures
 *
 * @property initialHash - Hash of the original document before any changes
 * @property currentHash - Current hash state including all updates
 * @property updates - History of all hash updates
 */
export interface DocumentHashHistory extends BaseDocumentHashHistory {
  /** Hash of the original document before any changes */
  initialHash: string;
  /** Current hash state including all updates */
  currentHash: string;
  /** History of all hash updates */
  updates: DocumentHashUpdate[];
}

type BaseDocumentHashUpdate = Record<
  string,
  string | number | DocumentContentHash
>;

/**
 * Single hash update
 *
 * @property hash - Hash of the update
 * @property type - Type of update
 * @property timestamp - Unix timestamp in milliseconds
 */
export interface DocumentHashUpdate extends BaseDocumentHashUpdate {
  /** Hash of the update */
  hash: DocumentContentHash;
  /** Type of update */
  type: "metadata" | "signature" | "other";
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/** Base type to inherit basic dict structure */
type BaseDocumentStatus = Record<
  string,
  boolean | number | undefined | SignatureStatus | SigningMode
>;

/**
 * Status of the document
 *
 * @property state - Current state of the document
 * @property lastSignedAt `[optional]` - Timestamp of the last signature
 * @property revoked - Flag indicating if the document has been revoked
 * @property revokedAt `[optional]` - Timestamp of the revocation
 * @property expired - Flag indicating if the document has expired
 * @property expiresAt `[optional]` - Timestamp of the expiration
 * @property currentSignerIndex `[optional]` - Index of the current signer
 * @property currentSignerMode `[optional]` - Mode of the current signer
 */
export interface DocumentStatus extends BaseDocumentStatus {
  /** Signature collection state */
  state: SignatureStatus;
  /** Last signature timestamp */
  lastSignedAt?: number;
  /** Revocation flag */
  revoked: boolean;
  /** Revocation timestamp if revoked */
  revokedAt?: number;
  /** Expired flag */
  expired: boolean;
  /** Expiration timestamp */
  expiresAt?: number;
  /** Current signer index */
  currentSignerIndex?: number;
  /** Current signer mode */
  currentSignerMode?: SigningMode;
}

type BaseDocumentRules = Record<string, boolean | number | undefined>;

/**
 * Rules for the document
 *
 * @property requireOrder - Enforce signing order
 * @property minSignatures - Minimum signature threshold
 * @property requireAll - Require all signatures
 * @property allowRevocation - Allow documents to be revoked
 * @property deadline `[optional]` - Optional deadline timestamp
 */
export interface DocumentRules extends BaseDocumentRules {
  /** Enforce signing order */
  requireOrder: boolean;
  /** Minimum signature threshold */
  minSignatures: number;
  /** Require all signatures */
  requireAll: boolean;
  /** Allow documents to be revoked */
  allowRevocation: boolean;
}

/**
 * Metadata for the document. This will be embedded in the PDF metadata.
 * After processing a Stamp, we will embed the transaction signature in the
 * metadata so that it's included in the file and allow us to extract it later
 * for verification purposes.
 *
 * @property transaction - Blockchain transaction info
 * @property createdAt - Creation timestamp in milliseconds
 * @property creator - Creating wallet address
 * @property documentId `[optional]` - Optional reference ID
 */
export interface DocumentMetadata extends BaseDocumentType {
  /** Blockchain transaction signature */
  transaction: string;
  /** Creation timestamp in milliseconds */
  createdAt: number;
  /** Creating wallet address */
  creator: string;
  /** Optional reference ID */
  documentId?: string;
}

/**
 * Core document stamp structure
 *
 * @property version - Protocol version for backwards compatibility
 * @property contentHash `DocumentContentHash` - Hash of the document content
 * @property hashHistory `DocumentHashHistory` - History of the document - hash updates and signatures
 * @property signers `DocumentSigner[]` - List of authorized signers
 * @property signatures `DocumentSignature[]` - Collected signatures and proofs
 * @property status `DocumentStatus` - Current document stamp status
 */
export interface DocumentStamp {
  /** Protocol version for backwards compatibility */
  version: string;
  /** Content of the document */
  contentHash: DocumentContentHash;
  /** History of the document - hash updates and signatures */
  hashHistory: DocumentHashHistory;
  /** List of authorized signers */
  signers: DocumentSigner[];
  /** Collected signatures and proofs */
  signatures: DocumentSignature[];
  /** Current document stamp status */
  status: DocumentStatus;
  /** Verification requirements */
  rules: DocumentRules;
  /** Stamp metadata */
  metadata: DocumentMetadata;
}

/** Helper type for creating new stamps */
export type CreateStampParams = Omit<
  DocumentStamp,
  "signatures" | "status" | "stampVersion" | "storage"
>;

/** Verification response */
export interface VerificationResult {
  /** Overall validity */
  isValid: boolean;
  /** Detailed verification results */
  checks: {
    /** Document hash verification */
    fileHashValid: boolean;
    /** Cryptographic signature verification */
    signaturesValid: boolean;
    /** Sequence verification if required */
    orderValid: boolean;
    /** Threshold verification */
    signatureCountValid: boolean;
    /** Expiration check */
    notExpired: boolean;
    /** Revocation check */
    notRevoked: boolean;
  };
  /** Current signing status */
  signatureStatus: Array<{
    signerIndex: number;
    mode: SigningMode;
    signed: boolean;
    timestamp?: number;
  }>;
}
