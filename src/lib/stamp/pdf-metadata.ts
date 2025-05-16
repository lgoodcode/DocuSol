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
   * @returns DocumentMetadata
   */
  static convertToDocumentMetadata(
    raw: Record<string, string>,
  ): DocumentMetadata {
    return {
      transaction: raw.transaction,
      documentId: raw.documentId,
      version: parseInt(raw.version),
      password: raw.password,
      createdAt: parseInt(raw.createdAt),
      creator: raw.creator,
    } satisfies DocumentMetadata;
  }

  /**
   * Converts DocumentMetadata to PDF metadata
   *
   * @param metadata - DocumentMetadata to convert
   * @returns PDF metadata
   */
  static convertToPDFMetadata(
    metadata: DocumentMetadata,
  ): Record<string, PDFString> {
    return {
      transaction: PDFString.of(String(metadata.transaction)),
      documentId: PDFString.of(String(metadata.documentId)),
      version: PDFString.of(String(metadata.version)),
      password: PDFString.of(String(metadata.password)),
    };
  }

  /**
   * Reads existing metadata from a PDF
   *
   * @param file - PDF file as Buffer or Blob
   * @returns Metadata if found, null otherwise
   */
  static async readMetadata(
    file: Buffer | Blob,
  ): Promise<DocumentMetadata | null> {
    if (file instanceof Blob && !file.type.startsWith("application/pdf")) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    const buffer =
      file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

    const pdfDoc = await PDFDocument.load(buffer, {
      updateMetadata: false,
    });
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
   * @param file - PDF file as Buffer or Blob
   * @param metadata - `DocumentMetadata` to embed
   * @returns Buffer containing updated PDF data
   */
  static async embedMetadata(
    file: Buffer | Blob,
    metadata: DocumentMetadata,
  ): Promise<Buffer> {
    if (file instanceof Blob && !file.type.startsWith("application/pdf")) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    const buffer =
      file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

    const pdfDoc = await PDFDocument.load(buffer);
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
