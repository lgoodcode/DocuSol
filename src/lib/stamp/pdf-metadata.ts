import { PDFDict, PDFDocument, PDFName, PDFString } from "pdf-lib";
import type { DocumentMetadata } from "@/lib/types/stamp";

const METADATA_KEY = "DocuSol_Metadata";

/**
 * Service for reading and writing PDF metadata
 */
export class PDFMetadata {
  /**
   * Converts raw metadata from PDF to DocumentMetadata
   *
   * @param raw - Raw metadata from PDF
   */
  static convertToDocumentMetadata(
    raw: Record<string, string>,
  ): DocumentMetadata {
    return {
      transaction: raw.transaction,
      createdAt: parseInt(raw.createdAt),
      creator: raw.creator,
      documentId: raw.documentId,
    } satisfies DocumentMetadata;
  }

  /**
   * Converts DocumentMetadata to PDF metadata
   *
   * @param metadata - DocumentMetadata to convert
   */
  static convertToPDFMetadata(
    metadata: DocumentMetadata,
  ): Record<string, PDFString> {
    return {
      transaction: PDFString.of(String(metadata.transaction)),
      createdAt: PDFString.of(String(metadata.createdAt)),
      creator: PDFString.of(String(metadata.creator)),
      documentId: PDFString.of(String(metadata.documentId)),
    };
  }

  /**
   * Reads existing metadata from a PDF
   *
   * @param pdfBuffer - Buffer containing PDF data
   * @returns Metadata if found, null otherwise
   */
  static async readMetadata(
    pdfBuffer: Buffer,
  ): Promise<DocumentMetadata | null> {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      updateMetadata: false,
    });
    // Access document catalog dictionary
    const catalog = pdfDoc.context.lookup(
      pdfDoc.context.trailerInfo.Root,
      PDFDict,
    );
    if (!catalog) {
      console.warn("No catalog found in PDF");
      return null;
    }

    // Get custom metadata dictionary
    const metadataRef = catalog.get(PDFName.of(METADATA_KEY));
    if (!metadataRef) {
      console.warn("No metadata found in PDF");
      return null;
    }

    const metadataDict = pdfDoc.context.lookup(metadataRef, PDFDict);
    if (!metadataDict) {
      console.warn("No metadata dictionary found in PDF");
      return null;
    }

    const metadata: Record<string, string> = {};
    for (const [key, value] of metadataDict.entries()) {
      const keyStr = key.asString().replace("/", "");
      if (value instanceof PDFString) {
        metadata[keyStr] = value.asString();
      } else {
        console.warn(
          `Unexpected metadata value type for key ${keyStr}: ${value.constructor.name}`,
        );
      }
    }

    return this.convertToDocumentMetadata(metadata);
  }

  /**
   * Embeds stamp information into PDF metadata
   *
   * @param pdfBuffer - Buffer containing PDF data
   * @param metadata - DocumentMetadata to embed
   * @returns Buffer containing updated PDF data
   */
  static async embedMetadata(
    pdfBuffer: Buffer,
    metadata: DocumentMetadata,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const catalog = pdfDoc.context.lookup(
      pdfDoc.context.trailerInfo.Root,
      PDFDict,
    );
    if (!catalog) {
      throw new Error("No catalog found in PDF");
    }

    const metadataDict = pdfDoc.context.obj(
      this.convertToPDFMetadata(metadata),
    );
    catalog.set(
      PDFName.of(METADATA_KEY),
      pdfDoc.context.register(metadataDict),
    );

    return Buffer.from(await pdfDoc.save());
  }
}
