import { useEditorStore } from "@/lib/pdf-editor/stores/useEditorStore";

/**
 * Loads a PDF document from a file
 *
 * @param file - The PDF file to load
 */
export async function loadPdfDocument(file: File): Promise<void> {
  try {
    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    const pdfFile = new Blob([arrayBuffer], { type: "application/pdf" });

    // Get the editor store
    const { setPdfFile } = useEditorStore.getState();

    // Update the store with the pdf document and the pdf file
    setPdfFile(pdfFile);
  } catch (error) {
    console.error("Error loading PDF document:", error);
    throw error;
  }
}

/**
 * Gets PDF coordinates from viewport coordinates
 *
 * @param x - The x coordinate in viewport space
 * @param y - The y coordinate in viewport space
 * @param pageIndex - The page index
 * @param scale - The current scale factor
 * @returns The coordinates in PDF space
 */
export function viewportToPdfCoordinates(
  x: number,
  y: number,
  pageIndex: number,
  scale: number,
): { x: number; y: number; pageIndex: number } {
  return {
    x: x / scale,
    y: y / scale,
    pageIndex,
  };
}

/**
 * Gets viewport coordinates from PDF coordinates
 *
 * @param x - The x coordinate in PDF space
 * @param y - The y coordinate in PDF space
 * @param pageIndex - The page index
 * @param scale - The current scale factor
 * @returns The coordinates in viewport space
 */
export function pdfToViewportCoordinates(
  x: number,
  y: number,
  pageIndex: number,
  scale: number,
): { x: number; y: number; pageIndex: number } {
  return {
    x: x * scale,
    y: y * scale,
    pageIndex,
  };
}
