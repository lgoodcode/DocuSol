// import {
//   CreateStampParams,
//   DocumentContentHash,
//   DocumentStamp,
//   DocumentSigner,
//   SignatureState,
//   STAMP_VERSION,
// } from "@/lib/types/stamp";

// export class DocumentStampError extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = "DocumentStampError";
//   }
// }

// export interface IHashProvider {
//   generateContentHash(content: Buffer): Promise<DocumentContentHash>;
// }

// export class HashService {
//   generateContentHash(content: Buffer): Promise<DocumentContentHash> {
//     return Promise.resolve({
//       fullHash: "0x123",
//       hash: "0x123",
//       timestamp: Date.now(),
//     });
//   }
// }

// export interface IStorageProvider {
//   saveStamp(stamp: DocumentStamp): Promise<void>;
//   getStamp(documentId: string): Promise<DocumentStamp | null>;
// }

// export class DocumentStampService {
//   constructor(
//     private readonly hashProvider: IHashProvider,
//     private readonly storageProvider: IStorageProvider,
//   ) {}

//   /**
//    * Creates a new document stamp with initial configuration
//    */
//   async createStamp(
//     content: Buffer,
//     params: Omit<CreateStampParams, "content" | "hasHistory">,
//   ): Promise<DocumentStamp> {
//     // Validate basic parameters
//     this.validateCreateParams(params);

//     // Generate content hashes
//     const contentHash = await this.hashProvider.generateContentHash(content);

//     // Initialize hash history
//     const hashHistory: DocumentHash = {
//       initialHash: contentHash.fullHash,
//       currentHash: contentHash.fullHash,
//       updates: [
//         {
//           timestamp: Date.now(),
//           type: "other",
//           hash: contentHash,
//         },
//       ],
//     };

//     // Create initial stamp
//     const stamp: DocumentStamp = {
//       stampVersion: STAMP_VERSION,
//       contentHash: contentHash,
//       hashHistory: hashHistory,
//       signers: params.signers,
//       signatures: [],
//       status: {
//         state: SignatureState.PENDING,
//         revoked: false,
//         expired: false,
//         currentSignerIndex: this.getInitialSignerIndex(
//           params.signers,
//           params.rules.requireOrder,
//         ),
//       },
//       rules: params.rules,
//       metadata: {
//         ...params.metadata,
//         createdAt: Date.now(),
//       },
//     };

//     // Persist the stamp
//     await this.storageProvider.saveStamp(stamp);

//     return stamp;
//   }

//   /**
//    * Validates creation parameters and throws if invalid
//    */
//   private validateCreateParams(
//     params: Omit<CreateStampParams, "content" | "hasHistory">,
//   ): void {
//     // Validate signers
//     if (!params.signers?.length) {
//       throw new DocumentStampError("At least one signer is required");
//     }

//     // Validate unique signer IDs
//     const signerIds = new Set(params.signers.map((s) => s.id));
//     if (signerIds.size !== params.signers.length) {
//       throw new DocumentStampError("Duplicate signer IDs are not allowed");
//     }

//     // Validate signing order if required
//     if (params.rules.requireOrder) {
//       this.validateSigningOrder(params.signers);
//     }

//     // Validate signature thresholds
//     if (params.rules.minSignatures > params.signers.length) {
//       throw new DocumentStampError(
//         "Minimum signature requirement cannot exceed number of signers",
//       );
//     }

//     if (
//       params.rules.requireAll &&
//       params.rules.minSignatures < params.signers.length
//     ) {
//       throw new DocumentStampError(
//         "Minimum signatures must equal total signers when requireAll is true",
//       );
//     }

//     // Validate deadline if set
//     if (params.rules.deadline && params.rules.deadline <= Date.now()) {
//       throw new DocumentStampError("Deadline must be in the future");
//     }

//     // Validate metadata
//     if (!params.metadata?.creator) {
//       throw new DocumentStampError("Creator is required in metadata");
//     }
//   }

//   /**
//    * Validates signer order configuration
//    */
//   private validateSigningOrder(signers: DocumentSigner[]): void {
//     const orders = signers
//       .map((s) => s.order)
//       .filter((order) => order !== undefined) as number[];

//     if (orders.length !== signers.length) {
//       throw new DocumentStampError(
//         "All signers must have an order when requireOrder is true",
//       );
//     }

//     // Check for duplicate orders
//     const uniqueOrders = new Set(orders);
//     if (uniqueOrders.size !== orders.length) {
//       throw new DocumentStampError("Duplicate signer orders are not allowed");
//     }

//     // Verify order sequence is complete
//     const maxOrder = Math.max(...orders);
//     const minOrder = Math.min(...orders);
//     if (maxOrder - minOrder + 1 !== orders.length) {
//       throw new DocumentStampError("Signer order must be sequential");
//     }
//   }

//   /**
//    * Determines the initial signer index based on ordering rules
//    */
//   private getInitialSignerIndex(
//     signers: DocumentSigner[],
//     requireOrder: boolean,
//   ): number | undefined {
//     if (!requireOrder) {
//       return undefined;
//     }

//     // Find signer with lowest order
//     const firstSigner = signers.reduce((min, signer) => {
//       if (
//         !min ||
//         (signer.order !== undefined && signer.order < (min.order ?? Infinity))
//       ) {
//         return signer;
//       }
//       return min;
//     });

//     return signers.findIndex((s) => s.id === firstSigner.id);
//   }
// }

// // import { sha256 } from "crypto-js";

// // // Import types from your interface definitions
// // import type {
// //   DocumentStamp,
// //   CreateStampParams,
// //   VerificationResult,
// //   SignatureStatus,
// //   SigningMode,
// //   Signature,
// // } from "./types";

// // export class DocumentStampService {
// //   /**
// //    * Creates a new document stamp with initial parameters
// //    */
// //   createStamp(params: CreateStampParams): DocumentStamp {
// //     // Validate required fields
// //     if (!params.fileHash || !params.signers || !params.metadata) {
// //       throw new Error("Missing required fields for stamp creation");
// //     }

// //     // Ensure signers array is valid
// //     if (params.signers.length === 0) {
// //       throw new Error("At least one signer is required");
// //     }

// //     // Create initial stamp structure
// //     const stamp: DocumentStamp = {
// //       ...params,
// //       stampVersion: "0.1",
// //       signatures: [],
// //       status: {
// //         state: "pending",
// //         revoked: false,
// //       },
// //     };

// //     // Validate signing rules
// //     this.validateStampRules(stamp);

// //     return stamp;
// //   }

// //   /**
// //    * Validates the internal consistency of stamp rules
// //    */
// //   private validateStampRules(stamp: DocumentStamp): void {
// //     const { rules, signers } = stamp;

// //     // Check minimum signatures threshold
// //     if (rules.minSignatures > signers.length) {
// //       throw new Error(
// //         "Minimum signature threshold cannot exceed number of signers",
// //       );
// //     }

// //     // Validate signing order if required
// //     if (rules.requireOrder) {
// //       const hasOrderGaps = signers.some(
// //         (signer, index) =>
// //           signer.order !== undefined && signer.order !== index + 1,
// //       );
// //       if (hasOrderGaps) {
// //         throw new Error("Invalid signing order sequence");
// //       }
// //     }

// //     // Validate deadline if set
// //     if (rules.deadline && rules.deadline <= stamp.metadata.createdAt) {
// //       throw new Error("Deadline must be in the future");
// //     }
// //   }

// //   /**
// //    * Adds a signature to the document stamp
// //    */
// //   addSignature(
// //     stamp: DocumentStamp,
// //     signerIndex: number,
// //     proof: string,
// //     transaction?: { signature: string },
// //   ): DocumentStamp {
// //     // Validate signer index
// //     if (signerIndex < 0 || signerIndex >= stamp.signers.length) {
// //       throw new Error("Invalid signer index");
// //     }

// //     // Check if already signed
// //     if (stamp.signatures.some((sig) => sig.signerIndex === signerIndex)) {
// //       throw new Error("Signer has already signed");
// //     }

// //     // Validate signing order if required
// //     if (stamp.rules.requireOrder) {
// //       const currentOrder = stamp.signers[signerIndex].order;
// //       if (currentOrder !== undefined) {
// //         const previousSigned = stamp.signatures.length;
// //         if (currentOrder !== previousSigned + 1) {
// //           throw new Error("Invalid signing order");
// //         }
// //       }
// //     }

// //     // Add new signature
// //     const signature: Signature = {
// //       signerIndex,
// //       proof,
// //       timestamp: Date.now(),
// //       transaction,
// //     };

// //     // Create updated stamp
// //     const updatedStamp = {
// //       ...stamp,
// //       signatures: [...stamp.signatures, signature],
// //     };

// //     // Update status
// //     updatedStamp.status = this.calculateStampStatus(updatedStamp);

// //     return updatedStamp;
// //   }

// //   /**
// //    * Calculates current stamp status based on signatures and rules
// //    */
// //   private calculateStampStatus(stamp: DocumentStamp): {
// //     state: SignatureStatus;
// //     lastSignedAt?: number;
// //     revoked: boolean;
// //     revokedAt?: number;
// //   } {
// //     const { signatures, rules, signers } = stamp;

// //     // Handle revoked state
// //     if (stamp.status.revoked) {
// //       return {
// //         state: "rejected",
// //         revoked: true,
// //         revokedAt: stamp.status.revokedAt,
// //         lastSignedAt:
// //           signatures.length > 0
// //             ? Math.max(...signatures.map((s) => s.timestamp))
// //             : undefined,
// //       };
// //     }

// //     // Check expiration
// //     if (rules.deadline && Date.now() > rules.deadline) {
// //       return {
// //         state: "expired",
// //         revoked: false,
// //         lastSignedAt:
// //           signatures.length > 0
// //             ? Math.max(...signatures.map((s) => s.timestamp))
// //             : undefined,
// //       };
// //     }

// //     // Calculate completion status
// //     const isComplete = rules.requireAll
// //       ? signatures.length === signers.length
// //       : signatures.length >= rules.minSignatures;

// //     return {
// //       state: isComplete ? "signed" : "pending",
// //       revoked: false,
// //       lastSignedAt:
// //         signatures.length > 0
// //           ? Math.max(...signatures.map((s) => s.timestamp))
// //           : undefined,
// //     };
// //   }

// //   /**
// //    * Verifies the validity of a document stamp
// //    */
// //   verifyStamp(
// //     stamp: DocumentStamp,
// //     currentFileHash: string,
// //   ): VerificationResult {
// //     const checks = {
// //       fileHashValid: currentFileHash === stamp.fileHash,
// //       signaturesValid: this.verifySignatures(stamp),
// //       orderValid: this.verifySigningOrder(stamp),
// //       signatureCountValid: this.verifySignatureCount(stamp),
// //       notExpired: !stamp.rules.deadline || Date.now() <= stamp.rules.deadline,
// //       notRevoked: !stamp.status.revoked,
// //     };

// //     const isValid = Object.values(checks).every((check) => check);

// //     const signatureStatus = stamp.signers.map((signer, index) => ({
// //       signerIndex: index,
// //       mode: signer.mode,
// //       signed: stamp.signatures.some((sig) => sig.signerIndex === index),
// //       timestamp: stamp.signatures.find((sig) => sig.signerIndex === index)
// //         ?.timestamp,
// //     }));

// //     return {
// //       isValid,
// //       checks,
// //       signatureStatus,
// //     };
// //   }

// //   /**
// //    * Verifies cryptographic signatures
// //    */
// //   private verifySignatures(stamp: DocumentStamp): boolean {
// //     // TODO: Implement signature verification logic based on mode
// //     // This will need to handle both transparent and anonymous signatures
// //     return true;
// //   }

// //   /**
// //    * Verifies signing order if required
// //    */
// //   private verifySigningOrder(stamp: DocumentStamp): boolean {
// //     if (!stamp.rules.requireOrder) {
// //       return true;
// //     }

// //     const orderedSigners = stamp.signers
// //       .map((signer, index) => ({ ...signer, index }))
// //       .sort((a, b) => (a.order || 0) - (b.order || 0));

// //     return stamp.signatures.every(
// //       (sig, index) => sig.signerIndex === orderedSigners[index].index,
// //     );
// //   }

// //   /**
// //    * Verifies signature count meets requirements
// //    */
// //   private verifySignatureCount(stamp: DocumentStamp): boolean {
// //     if (stamp.rules.requireAll) {
// //       return stamp.signatures.length === stamp.signers.length;
// //     }
// //     return stamp.signatures.length >= stamp.rules.minSignatures;
// //   }
// // }
