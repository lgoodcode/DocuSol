import crypto from "crypto";
import { Buffer } from "buffer";
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFStream } from "pdf-lib";

import type { DocumentMetadata, DocumentContentHash } from "@/lib/types/stamp";
import { PDFMetadata } from "@/lib/stamp/pdf-metadata";

/**
 * Service for generating and verifying hashes for Document Stamps
 */
export class PDFHash {
  /**
   * Generates content hashes for a PDF file
   *
   * @param file - PDF file as Buffer or Blob
   * @returns DocumentContentHash
   */
  static async generateContentHash(
    file: Buffer | Blob,
  ): Promise<DocumentContentHash> {
    if (file instanceof Blob && !file.type.startsWith("application/pdf")) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    const buffer =
      file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

    const pdfDoc = await PDFDocument.load(buffer);

    const contentHash = await this.getContentHash(pdfDoc);
    const fileHash = await this.getFileHash(buffer);
    const metadataHash = await this.getMetadataHash(buffer);

    return {
      contentHash,
      fileHash,
      metadataHash,
    } satisfies DocumentContentHash;
  }

  static async getContentHash(pdfDoc: PDFDocument): Promise<string> {
    // Get the page dictionary from the catalog
    const catalog = pdfDoc.context.lookup(
      pdfDoc.context.trailerInfo.Root,
      PDFDict,
    );

    // Get the Pages dictionary
    const pages = pdfDoc.context.lookup(
      catalog.get(PDFName.of("Pages")),
      PDFDict,
    );

    // Get the Kids array (contains page references)
    const kids = pdfDoc.context.lookup(pages.get(PDFName.of("Kids")), PDFArray);

    // Accumulate content from all pages
    let contentBuffer = Buffer.from([]);

    // Process each page
    for (let i = 0; i < kids.size(); i++) {
      const pageRef = kids.get(i);
      const page = pdfDoc.context.lookup(pageRef, PDFDict);

      // Get content streams (can be single stream or array)
      const contents = page.get(PDFName.of("Contents"));

      if (contents instanceof PDFStream) {
        // Single content stream
        const content = contents.getContents();
        contentBuffer = Buffer.concat([contentBuffer, content]);
      } else if (contents instanceof PDFArray) {
        // Multiple content streams
        for (let j = 0; j < contents.size(); j++) {
          const stream = pdfDoc.context.lookup(contents.get(j), PDFStream);
          const content = stream.getContents();
          contentBuffer = Buffer.concat([contentBuffer, content]);
        }
      }
    }

    return crypto.createHash("sha256").update(contentBuffer).digest("base64");
  }

  static async getFileHash(buffer: Buffer): Promise<string> {
    return crypto.createHash("sha256").update(buffer).digest("base64");
  }

  static async getMetadataHash(buffer: Buffer): Promise<string> {
    const metadata = await PDFMetadata.readMetadata(buffer);
    return crypto
      .createHash("sha256")
      .update(JSON.stringify(metadata))
      .digest("base64");
  }

  /**
   * Verifies if a PDF's content matches a given hash
   *
   * @param file PDF file to verify
   * @param hash `DocumentContentHash` to verify against
   * @returns boolean if the content hash matches the given hash
   */
  static async verifyContentHash(
    file: Blob | Buffer,
    hash: DocumentContentHash,
  ): Promise<boolean> {
    const currentHash = await this.generateContentHash(file);
    return currentHash.contentHash === hash.contentHash;
  }

  /**
   * Verifies if metadata matches a given hash
   *
   * @param metadata `DocumentMetadata` to verify
   * @param hash hash string to verify against
   * @returns boolean if the metadata hash matches the given hash
   */
  static verifyMetadataHash(metadata: DocumentMetadata, hash: string): boolean {
    const currentMetadataHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(metadata))
      .digest("base64");
    return currentMetadataHash === hash;
  }
}
