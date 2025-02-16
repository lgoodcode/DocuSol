import { PDFDocument, rgb } from "pdf-lib";

import { useWallet } from "@/lib/auth/use-wallet";

export function useUploadNewDocument() {
  const { wallet } = useWallet();

  return async function uploadNewDocument(newDocument: NewDocument) {
    if (!wallet) {
      throw new Error("Wallet not connected");
    }

    const formData = new FormData();
    Object.entries(newDocument).forEach(([key, value]) => {
      formData.append(key, value || "");
    });

    const response = await fetch("/api/docs/new", {
      method: "POST",
      body: formData,
      headers: {
        "Cache-Control": "no-cache",
        "x-wallet-address": wallet.adapter.publicKey!.toBase58(),
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${await response.text()}`);
    }

    return response.json() as Promise<NewDocumentResponse>;
  };
}

export async function uploadSignedDocument(signedDocument: SignedDocument) {
  const formData = new FormData();
  Object.entries(signedDocument).forEach(([key, value]) => {
    formData.append(key, value || "");
  });

  const response = await fetch("/api/docs/sign", {
    method: "POST",
    body: formData,
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Sign failed: ${await response.text()}`);
  }

  return response.json() as Promise<SignedDocumentResponse>;
}

export async function sign(
  file: File | Blob,
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
  position?: { x: number; y: number },
): Promise<Blob | null> {
  try {
    if (file.type === "application/pdf") {
      return signPdf(file, signatureCanvas, typedSignature, position);
    }
    return overlayImageSignature(
      file,
      signatureCanvas,
      typedSignature,
      position,
    );
  } catch (error) {
    console.error("Error in sign:", error);
    throw error;
  }
}

/**
 * Returns a font string for canvas context with the specified size
 * Uses a cursive font for signature-like appearance, falling back to system fonts
 *
 * @param size - The font size in pixels
 * @returns The complete font string for use with canvas context
 */
function getFont(size: number): string {
  return `${size}px "Dancing Script", "Brush Script MT", cursive, sans-serif`;
}

/**
 * Calculate the dimensions for the signature to overlay on the document
 * This is used to ensure the signature is not too large and is centered on the document
 * The position is optional and can be used to offset the signature from the center
 * The position is in the format of { x: number, y: number }
 *
 * @param sigWidth - The width of the signature
 * @param sigHeight - The height of the signature
 * @param docWidth - The width of the document
 * @param docHeight - The height of the document
 * @param position - The position of the signature on the document
 * @returns The dimensions of the signature to overlay on the document
 */
function calculateSignatureDimensions(
  sigWidth: number,
  sigHeight: number,
  imageWidth: number,
  imageHeight: number,
  position: { x: number; y: number },
) {
  // Calculate maximum dimensions (25% of image width/height)
  const maxWidth = imageWidth * 0.25;
  const maxHeight = imageHeight * 0.25;

  // Scale signature proportionally
  let width = sigWidth;
  let height = sigHeight;
  const ratio = sigWidth / sigHeight;

  if (width > maxWidth) {
    width = maxWidth;
    height = width / ratio;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  // Add padding (20px or 2% of image dimension, whichever is smaller)
  const padding = Math.min(20, Math.min(imageWidth, imageHeight) * 0.02);

  // Adjust position to ensure signature stays within bounds
  const x = Math.min(position.x, imageWidth - width - padding);
  const y = Math.min(position.y, imageHeight - height - padding);

  return { width, height, x, y };
}

async function overlayImageSignature(
  file: File | Blob,
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
  position?: { x: number; y: number },
): Promise<Blob | null> {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  // Create temporary canvas for signature
  const sigCanvas = document.createElement("canvas");
  const sigCtx = sigCanvas.getContext("2d")!;

  // Default position to bottom right if not specified
  const defaultPosition = {
    x: position?.x ?? image.width * 0.6,
    y: position?.y ?? image.height * 0.75,
  };

  if (signatureCanvas) {
    // Handle drawn signature
    sigCanvas.width = signatureCanvas.width;
    sigCanvas.height = signatureCanvas.height;
    sigCtx.drawImage(signatureCanvas, 0, 0);
  } else if (typedSignature) {
    // Handle typed signature
    const fontSize = Math.min(image.width * 0.05, image.height * 0.08);
    sigCtx.font = getFont(fontSize);
    const textMetrics = sigCtx.measureText(typedSignature);
    sigCanvas.width = textMetrics.width + fontSize * 0.4;
    sigCanvas.height = fontSize * 1.2;

    sigCtx.lineWidth = fontSize * 0.05;
    sigCtx.strokeStyle = "#000";
    sigCtx.fillStyle = "#000";
    sigCtx.strokeText(typedSignature, 10, fontSize);
    sigCtx.fillText(typedSignature, 10, fontSize);
  } else {
    return null;
  }

  // Convert to black (for both drawn and typed signatures)
  sigCtx.globalCompositeOperation = "source-in";
  sigCtx.fillStyle = "#000";
  sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);

  // Calculate dimensions for overlay
  const {
    width: baseWidth,
    height: baseHeight,
    x,
    y,
  } = calculateSignatureDimensions(
    sigCanvas.width,
    sigCanvas.height,
    image.width,
    image.height,
    defaultPosition,
  );

  const width = signatureCanvas ? baseWidth * 1.5 : baseWidth;
  const height = signatureCanvas ? baseHeight * 1.5 : baseHeight;

  // Draw signature on main canvas
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "white";
  ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
  ctx.globalAlpha = 1;
  if (signatureCanvas) {
    ctx.lineWidth = 10;
  }
  ctx.drawImage(sigCanvas, x, y, width, height);
  ctx.restore();

  return new Promise((resolve) => canvas.toBlob(resolve, file.type));
}

async function getSignatureAsImage(
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
): Promise<Blob | null> {
  if (!signatureCanvas && !typedSignature) return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  if (signatureCanvas) {
    canvas.width = signatureCanvas.width;
    canvas.height = signatureCanvas.height;

    ctx.drawImage(signatureCanvas, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (typedSignature) {
    // Set canvas size based on text measurement
    ctx.font = getFont(48);
    const textMetrics = ctx.measureText(typedSignature);
    canvas.width = textMetrics.width + 20; // Add padding
    canvas.height = 60; // Fixed height for typed signatures

    // Draw typed signature
    ctx.font = getFont(48);
    ctx.fillStyle = "#000";
    ctx.fillText(typedSignature, 10, 40);
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

async function signPdf(
  file: File | Blob,
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
  position?: { x: number; y: number },
): Promise<Blob | null> {
  try {
    // Get signature image first
    const signatureBlob = await getSignatureAsImage(
      signatureCanvas,
      typedSignature,
    );
    if (!signatureBlob) return null;

    // Convert signature blob to base64
    const signatureBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(signatureBlob);
    });

    // Load PDF document
    const pdfData = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfData);

    // Embed signature image
    const signatureImage = await pdfDoc.embedPng(signatureBase64);

    // Process each page
    const pages = pdfDoc.getPages();
    for (const page of pages) {
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Calculate signature dimensions
      const { width: sigWidth, height: sigHeight } = signatureImage.size();
      const dimensions = calculateSignatureDimensions(
        sigWidth,
        sigHeight,
        pageWidth,
        pageHeight,
        position || { x: pageWidth * 0.6, y: pageHeight * 0.75 },
      );

      // Draw white background
      page.drawRectangle({
        x: dimensions.x - 10,
        y: pageHeight - (dimensions.y + dimensions.height + 20), // Convert to PDF coordinates
        width: dimensions.width + 20,
        height: dimensions.height + 20,
        color: rgb(1, 1, 1),
        opacity: 0.7,
      });

      // Draw signature
      page.drawImage(signatureImage, {
        x: dimensions.x,
        y: pageHeight - (dimensions.y + dimensions.height), // Convert to PDF coordinates
        width: dimensions.width,
        height: dimensions.height,
        opacity: 1,
      });
    }

    // Save and return as blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  } catch (error) {
    console.error("Error in signPdf:", error);
    throw error;
  }
}
