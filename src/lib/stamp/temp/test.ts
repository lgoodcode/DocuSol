// class DocumentSigning {
//   static VERSION = "1.0";

//   /**
//    * Creates a document stamp supporting both transparent and anonymous signers
//    * @param {Buffer} fileBuffer - Original file buffer
//    * @param {Array<{address: string, anonymous: boolean}>} signers - Signer preferences
//    */
//   static createStamp(fileBuffer, signers, options = {}) {
//     const fileHash = crypto
//       .createHash("sha256")
//       .update(fileBuffer)
//       .digest("hex");

//     // Separate transparent and anonymous signers
//     const transparentSigners = signers
//       .filter((s) => !s.anonymous)
//       .map((s) => ({
//         address: s.address,
//         required: s.required || true,
//         order: s.order,
//       }));

//     // For anonymous signers, create ZKP setup
//     const anonymousSigners = signers
//       .filter((s) => s.anonymous)
//       .map((s) => ({
//         // Generate proving key and verification key
//         zkpKeys: this.generateZkpKeys(s.address, fileHash),
//         required: s.required || true,
//         order: s.order,
//       }));

//     const stamp = {
//       version: this.VERSION,
//       fileHash,
//       timestamp: Date.now(),
//       // Public signers list
//       transparentSigners,
//       // Only store verification keys for anonymous signers
//       anonymousSignerKeys: anonymousSigners.map(
//         (s) => s.zkpKeys.verificationKey,
//       ),
//       metadata: {
//         title: options.title || null,
//         totalSigners: signers.length,
//         transparentCount: transparentSigners.length,
//         anonymousCount: anonymousSigners.length,
//       },
//     };

//     return {
//       stamp,
//       // Return proving keys privately to anonymous signers
//       anonymousSignerProofs: anonymousSigners.map((s) => ({
//         provingKey: s.zkpKeys.provingKey,
//         commitment: s.zkpKeys.commitment,
//       })),
//     };
//   }

//   /**
//    * Records a signature, supporting both transparent and anonymous modes
//    * @param {Object} stamp - The document stamp
//    * @param {Object} signature - Signature data
//    * @param {boolean} anonymous - Whether this is an anonymous signature
//    */
//   static recordSignature(stamp, signature, anonymous = false) {
//     if (anonymous) {
//       return this.recordAnonymousSignature(stamp, signature);
//     } else {
//       return this.recordTransparentSignature(stamp, signature);
//     }
//   }

//   /**
//    * Records a transparent signature with visible wallet address
//    */
//   static recordTransparentSignature(stamp, signature) {
//     // Verify signer is authorized
//     const isAuthorizedSigner = stamp.transparentSigners.some(
//       (s) => s.address === signature.address,
//     );

//     if (!isAuthorizedSigner) {
//       throw new Error("Unauthorized signer");
//     }

//     return {
//       type: "transparent",
//       address: signature.address,
//       signature: signature.signature,
//       timestamp: Date.now(),
//       blockHeight: signature.blockHeight,
//     };
//   }

//   /**
//    * Records an anonymous signature using ZKP
//    */
//   static recordAnonymousSignature(stamp, signature) {
//     // Verify the zero-knowledge proof
//     const proofValid = this.verifyZkProof(
//       signature.proof,
//       stamp.fileHash,
//       stamp.anonymousSignerKeys,
//     );

//     if (!proofValid) {
//       throw new Error("Invalid zero-knowledge proof");
//     }

//     return {
//       type: "anonymous",
//       proof: signature.proof,
//       timestamp: Date.now(),
//       blockHeight: signature.blockHeight,
//     };
//   }

//   /**
//    * Verifies all signatures on a document
//    */
//   static verifyDocument(fileBuffer, stamp, signatures) {
//     const fileHash = crypto
//       .createHash("sha256")
//       .update(fileBuffer)
//       .digest("hex");

//     if (fileHash !== stamp.fileHash) {
//       return false;
//     }

//     // Separate and verify transparent signatures
//     const transparentSigs = signatures.filter((s) => s.type === "transparent");
//     const transparentValid = transparentSigs.every((sig) =>
//       this.verifyTransparentSignature(stamp, sig),
//     );

//     // Verify anonymous signatures
//     const anonymousSigs = signatures.filter((s) => s.type === "anonymous");
//     const anonymousValid = anonymousSigs.every((sig) =>
//       this.verifyZkProof(sig.proof, stamp.fileHash, stamp.anonymousSignerKeys),
//     );

//     // Check we have all required signatures
//     const totalSignatures = transparentSigs.length + anonymousSigs.length;
//     const requiredSignatures =
//       stamp.transparentSigners.length + stamp.anonymousSignerKeys.length;

//     return (
//       transparentValid &&
//       anonymousValid &&
//       totalSignatures === requiredSignatures
//     );
//   }

//   // ZKP-related helper methods
//   static generateZkpKeys(address, documentHash) {
//     // This would use a ZKP library like snarkjs or starkware
//     // For example using snarkjs:
//     /*
//     const circuit = {
//       constraints: [
//         // Prove knowledge of private key without revealing it
//         // Prove ownership of address
//         // Bind proof to specific document
//       ]
//     };

//     const keys = snarkjs.setup(circuit);
//     const commitment = snarkjs.generateCommitment(address, documentHash);
//     */

//     return {
//       provingKey: "proving_key_data",
//       verificationKey: "verification_key_data",
//       commitment: "commitment_data",
//     };
//   }

//   static verifyZkProof(proof, documentHash, verificationKeys) {
//     // This would verify the ZKP using snarkjs or similar
//     // Return true if proof is valid for any of the verification keys
//     return true; // Placeholder
//   }

//   static generateZkProof(provingKey, address, documentHash) {
//     // This would generate a ZKP using snarkjs or similar
//     return "proof_data"; // Placeholder
//   }
// }
