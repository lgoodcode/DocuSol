// import { PDFDocument } from "pdf-lib";
// import { createHash } from "crypto";
// import { Connection } from "@solana/web3.js";

// class DocumentIntegrityVerifier {
//   /**
//    * Creates initial document fingerprint
//    */
//   static async createDocumentFingerprint(
//     fileBuffer: Buffer,
//   ): Promise<DocumentFingerprint> {
//     // 1. Calculate raw file hash
//     const rawHash = createHash("sha256").update(fileBuffer).digest("hex");

//     // 2. For PDFs, extract and hash content separately
//     const contentHash = await this.extractAndHashContent(fileBuffer);

//     // 3. Create metadata hash if present
//     const metadataHash = await this.extractAndHashMetadata(fileBuffer);

//     return {
//       rawHash,
//       contentHash,
//       metadataHash,
//       timestamp: Date.now(),
//       size: fileBuffer.length,
//     };
//   }

//   /**
//    * Verifies document against stored fingerprint
//    */
//   static async verifyDocumentIntegrity(
//     fileBuffer: Buffer,
//     storedFingerprint: DocumentFingerprint,
//     options: VerificationOptions = {},
//   ): Promise<IntegrityVerificationResult> {
//     const currentFingerprint = await this.createDocumentFingerprint(fileBuffer);

//     const checks = {
//       // Check raw file hash
//       rawIntegrity: currentFingerprint.rawHash === storedFingerprint.rawHash,

//       // Check content hash (allows for metadata changes)
//       contentIntegrity:
//         currentFingerprint.contentHash === storedFingerprint.contentHash,

//       // Size verification
//       sizeValid: currentFingerprint.size === storedFingerprint.size,

//       // Optional blockchain verification
//       blockchainVerified: false,
//     };

//     // If blockchain verification requested
//     if (options.verifyOnChain && options.transactionSignature) {
//       checks.blockchainVerified = await this.verifyOnChain(
//         currentFingerprint,
//         options.transactionSignature,
//         options.network || "mainnet-beta",
//       );
//     }

//     // Get detailed differences if content changed
//     const differences = checks.contentIntegrity
//       ? null
//       : await this.analyzeDifferences(fileBuffer, storedFingerprint);

//     return {
//       isValid: checks.contentIntegrity && checks.sizeValid,
//       checks,
//       currentFingerprint,
//       differences,
//     };
//   }

//   /**
//    * Extracts and hashes document content (PDF specific)
//    */
//   private static async extractAndHashContent(
//     fileBuffer: Buffer,
//   ): Promise<string> {
//     try {
//       const pdfDoc = await PDFDocument.load(fileBuffer);
//       const pageCount = pdfDoc.getPageCount();

//       // Extract text content from each page
//       const contentArray = [];
//       for (let i = 0; i < pageCount; i++) {
//         const page = pdfDoc.getPage(i);
//         const text = await this.extractPageText(page);
//         contentArray.push(text);
//       }

//       // Create deterministic hash of content
//       return createHash("sha256").update(contentArray.join("")).digest("hex");
//     } catch (e) {
//       // If not a PDF, return raw hash
//       return createHash("sha256").update(fileBuffer).digest("hex");
//     }
//   }

//   /**
//    * Verifies document integrity on blockchain
//    */
//   private static async verifyOnChain(
//     fingerprint: DocumentFingerprint,
//     transactionSignature: string,
//     network: "mainnet-beta" | "devnet" | "testnet",
//   ): Promise<boolean> {
//     try {
//       const connection = new Connection(
//         network === "mainnet-beta"
//           ? "https://api.mainnet-beta.solana.com"
//           : `https://api.${network}.solana.com`,
//       );

//       const tx = await connection.getTransaction(transactionSignature);
//       if (!tx) return false;

//       // Extract memo data
//       const memoIx = tx.transaction.message.instructions.find(
//         (ix) =>
//           ix.programId.toString() ===
//           "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
//       );

//       if (!memoIx) return false;

//       // Parse stored fingerprint
//       const storedData = JSON.parse(
//         Buffer.from(memoIx.data, "base64").toString(),
//       );

//       // Verify stored hashes match
//       return storedData.contentHash === fingerprint.contentHash;
//     } catch (e) {
//       console.error("Blockchain verification failed:", e);
//       return false;
//     }
//   }

//   /**
//    * Analyzes differences between document versions
//    */
//   private static async analyzeDifferences(
//     currentBuffer: Buffer,
//     storedFingerprint: DocumentFingerprint,
//   ): Promise<DocumentDifferences | null> {
//     try {
//       const currentDoc = await PDFDocument.load(currentBuffer);

//       return {
//         changedPages: [], // Identify which pages changed
//         addedPages: 0, // Number of pages added
//         removedPages: 0, // Number of pages removed
//         metadataChanged: false,
//         timestamp: Date.now(),
//       };
//     } catch (e) {
//       return null;
//     }
//   }

//   /**
//    * Creates integrity proof for blockchain
//    */
//   static createIntegrityProof(fingerprint: DocumentFingerprint): string {
//     // Create compact proof for blockchain storage
//     return JSON.stringify({
//       v: 1, // version
//       ch: fingerprint.contentHash,
//       ts: fingerprint.timestamp,
//       sz: fingerprint.size,
//     });
//   }
// }

// interface DocumentFingerprint {
//   rawHash: string;
//   contentHash: string;
//   metadataHash?: string;
//   timestamp: number;
//   size: number;
// }

// interface VerificationOptions {
//   verifyOnChain?: boolean;
//   transactionSignature?: string;
//   network?: "mainnet-beta" | "devnet" | "testnet";
//   comparePrevious?: boolean;
// }

// interface IntegrityVerificationResult {
//   isValid: boolean;
//   checks: {
//     rawIntegrity: boolean;
//     contentIntegrity: boolean;
//     sizeValid: boolean;
//     blockchainVerified: boolean;
//   };
//   currentFingerprint: DocumentFingerprint;
//   differences?: DocumentDifferences | null;
// }

// interface DocumentDifferences {
//   changedPages: number[];
//   addedPages: number;
//   removedPages: number;
//   metadataChanged: boolean;
//   timestamp: number;
// }
