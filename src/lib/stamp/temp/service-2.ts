// import type {
//   DocumentStamp,
//   DocumentContentHasH,
//   SignatureVerification,
//   DocumentChecks,
//   SignatureRequirements,
//   DocumentStatus,
//   VerificationResult,
// } from "./types";

// export class DocumentVerifier {
//   /**
//    * Verifies all aspects of a document stamp
//    */
//   verifyStamp(
//     stamp: DocumentStamp,
//     currentContent: DocumentContentHasH,
//   ): VerificationResult {
//     const documentChecks = this.verifyDocumentIntegrity(stamp, currentContent);
//     const requirementChecks = this.verifySignatureRequirements(stamp);
//     const statusChecks = this.verifyDocumentStatus(stamp);
//     const signatures = this.verifyAllSignatures(stamp);

//     // Calculate overall validity
//     const isValid =
//       Object.values(documentChecks).every((check) => check) &&
//       Object.values(requirementChecks).every((check) =>
//         typeof check === "boolean" ? check : true,
//       ) &&
//       !statusChecks.expired &&
//       !statusChecks.revoked &&
//       signatures.every(
//         (sig) =>
//           !sig.signed || Object.values(sig.checks).every((check) => check),
//       );

//     return {
//       isValid,
//       verifiedAt: Date.now(),
//       documentChecks,
//       requirementChecks,
//       statusChecks,
//       signatures,
//     };
//   }

//   /**
//    * Verifies document integrity and hash chain
//    */
//   private verifyDocumentIntegrity(
//     stamp: DocumentStamp,
//     currentContent: DocumentContentHasH,
//   ): DocumentChecks {
//     // Verify content hash hasn't changed
//     const contentHashValid =
//       currentContent.contentHash === stamp.content.contentHash;

//     // Verify full document hash
//     const fullHashValid = currentContent.fullHash === stamp.content.fullHash;

//     // Verify metadata hash if present
//     const metadataHashValid =
//       !currentContent.metadataHash ||
//       currentContent.metadataHash === stamp.content.metadataHash;

//     // Verify hash history chain
//     const hashChainValid = this.verifyHashChain(stamp);

//     return {
//       contentHashValid,
//       fullHashValid,
//       metadataHashValid,
//       hashChainValid,
//     };
//   }

//   /**
//    * Verifies the hash update chain
//    */
//   private verifyHashChain(stamp: DocumentStamp): boolean {
//     if (stamp.hasHistory.updates.length === 0) return false;

//     let previousUpdate = stamp.hasHistory.updates[0];

//     // Verify initial state
//     if (previousUpdate.hash.contentHash !== stamp.hasHistory.initialHash) {
//       return false;
//     }

//     // Verify update chain
//     for (let i = 1; i < stamp.hasHistory.updates.length; i++) {
//       const currentUpdate = stamp.hasHistory.updates[i];

//       // Verify timestamps are sequential
//       if (currentUpdate.timestamp <= previousUpdate.timestamp) {
//         return false;
//       }

//       // Verify content hash remains unchanged
//       if (currentUpdate.hash.contentHash !== previousUpdate.hash.contentHash) {
//         return false;
//       }

//       previousUpdate = currentUpdate;
//     }

//     // Verify final state matches current
//     const finalUpdate =
//       stamp.hasHistory.updates[stamp.hasHistory.updates.length - 1];
//     return finalUpdate.hash.fullHash === stamp.content.fullHash;
//   }

//   /**
//    * Verifies signature requirements are met
//    */
//   private verifySignatureRequirements(
//     stamp: DocumentStamp,
//   ): SignatureRequirements {
//     const validSignatures = stamp.signatures.filter(
//       (sig) => this.verifySignature(stamp, sig.signerIndex).checks.proofValid,
//     );

//     const validCount = validSignatures.length;
//     const requiredCount = stamp.rules.requireAll
//       ? stamp.signers.length
//       : stamp.rules.minSignatures;

//     return {
//       thresholdMet: validCount >= stamp.rules.minSignatures,
//       allRequired:
//         !stamp.rules.requireAll || validCount === stamp.signers.length,
//       orderValid: this.verifySigningOrder(stamp),
//       validCount,
//       requiredCount,
//     };
//   }

//   /**
//    * Verifies current document status
//    */
//   private verifyDocumentStatus(stamp: DocumentStamp): DocumentStatus {
//     const now = Date.now();
//     const expired = stamp.rules.deadline ? now > stamp.rules.deadline : false;

//     return {
//       expired,
//       revoked: stamp.status.revoked,
//       state: stamp.status.state,
//       lastSignedAt: stamp.status.lastSignedAt,
//     };
//   }

//   /**
//    * Verifies all signatures in the document
//    */
//   private verifyAllSignatures(stamp: DocumentStamp): SignatureVerification[] {
//     return stamp.signers.map((signer, index) => {
//       const signature = stamp.signatures.find(
//         (sig) => sig.signerIndex === index,
//       );

//       if (!signature) {
//         return {
//           signerIndex: index,
//           mode: signer.mode,
//           signed: false,
//           checks: {
//             proofValid: false,
//             orderValid: true,
//             timeValid: true,
//             transactionValid: false,
//           },
//         };
//       }

//       const orderValid = this.verifySignatureOrder(stamp, index);
//       const timeValid =
//         !stamp.rules.deadline || signature.timestamp <= stamp.rules.deadline;
//       const proofValid = this.verifySignatureProof(stamp, index);
//       const transactionValid = this.verifyTransaction(signature);

//       return {
//         signerIndex: index,
//         mode: signer.mode,
//         signed: true,
//         timestamp: signature.timestamp,
//         checks: {
//           proofValid,
//           orderValid,
//           timeValid,
//           transactionValid,
//         },
//         transaction: signature.transaction
//           ? {
//               signature: signature.transaction.signature,
//               confirmations: 0, // TODO: Implement blockchain confirmation checking
//             }
//           : undefined,
//       };
//     });
//   }

//   /**
//    * Verifies a specific signature order
//    */
//   private verifySignatureOrder(
//     stamp: DocumentStamp,
//     signerIndex: number,
//   ): boolean {
//     if (!stamp.rules.requireOrder) return true;

//     const signature = stamp.signatures.find(
//       (sig) => sig.signerIndex === signerIndex,
//     );
//     if (!signature) return true;

//     const signer = stamp.signers[signerIndex];
//     if (!signer.order) return true;

//     const previousSigners = stamp.signers.filter(
//       (s) => s.order && s.order < signer.order,
//     );

//     return previousSigners.every((prevSigner) => {
//       const prevSignature = stamp.signatures.find(
//         (sig) => sig.signerIndex === stamp.signers.indexOf(prevSigner),
//       );
//       return prevSignature && prevSignature.timestamp < signature.timestamp;
//     });
//   }

//   /**
//    * Verifies an individual signature proof
//    */
//   private verifySignatureProof(
//     stamp: DocumentStamp,
//     signerIndex: number,
//   ): boolean {
//     const signature = stamp.signatures.find(
//       (sig) => sig.signerIndex === signerIndex,
//     );
//     if (!signature) return false;

//     const signer = stamp.signers[signerIndex];

//     // TODO: Implement actual signature verification based on mode
//     if (signer.mode === "transparent") {
//       // Verify wallet signature
//       return true;
//     } else {
//       // Verify ZK proof
//       return true;
//     }
//   }

//   /**
//    * Verifies a blockchain transaction
//    */
//   private verifyTransaction(signature: {
//     transaction?: { signature: string };
//   }): boolean {
//     if (!signature.transaction) return true;

//     // TODO: Implement actual transaction verification
//     return true;
//   }
// }
