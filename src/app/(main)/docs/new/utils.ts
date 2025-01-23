import pdfjs from "pdfjs-dist";

type NewDocument = {
  name: string;
  password: string;
  original_filename: string;
  mime_type: string;
  file: File;
  signed_document: string;
};

export async function uploadFile(newDocument: NewDocument) {
  const formData = new FormData();
  Object.entries(newDocument).forEach(([key, value]) => {
    formData.append(key, value || "");
  });

  const response = await fetch("/api/docs/new", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
}

export async function overlaySignature(
  file: File,
  signatureCanvas: HTMLCanvasElement,
  position?: { x: number; y: number }
) {
  const isPDF = file.type === "application/pdf";
  return isPDF
    ? overlayPDFSignature(file, signatureCanvas, position)
    : overlayImageSignature(file, signatureCanvas, position);
}

async function overlayPDFSignature(
  file: File,
  signatureCanvas: HTMLCanvasElement,
  position?: { x: number; y: number }
) {
  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(pdfData).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  const { width, height, x, y } = calculateSignatureDimensions(
    signatureCanvas,
    viewport.width,
    viewport.height,
    position
  );

  ctx.drawImage(signatureCanvas, x, y, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, "application/pdf"));
}

async function overlayImageSignature(
  file: File,
  signatureCanvas: HTMLCanvasElement,
  position?: { x: number; y: number }
) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const { width, height, x, y } = calculateSignatureDimensions(
    signatureCanvas,
    image.width,
    image.height,
    position
  );

  ctx.drawImage(signatureCanvas, x, y, width, height);
  return new Promise((resolve) => canvas.toBlob(resolve, file.type));
}

function calculateSignatureDimensions(
  signatureCanvas: HTMLCanvasElement,
  docWidth: number,
  docHeight: number,
  position?: { x: number; y: number }
) {
  const sigAspectRatio = signatureCanvas.width / signatureCanvas.height;
  const maxWidth = docWidth * 0.3; // 30% of document width
  const maxHeight = docHeight * 0.2; // 20% of document height

  let width = maxWidth;
  let height = width / sigAspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * sigAspectRatio;
  }

  // Center the signature if no position provided
  const x = position?.x ?? (docWidth - width) / 2;
  const y = position?.y ?? (docHeight - height) / 2;

  return { width, height, x, y };
}
