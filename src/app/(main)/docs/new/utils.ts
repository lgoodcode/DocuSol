import * as pdfjs from "pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

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
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
  position?: { x: number; y: number }
) {
  const isPDF = file.type === "application/pdf";
  return isPDF
    ? overlayPDFSignature(file, signatureCanvas, typedSignature, position)
    : overlayImageSignature(file, signatureCanvas, typedSignature, position);
}

async function overlayPDFSignature(
  file: File,
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
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

  if (signatureCanvas) {
    const { width, height, x, y } = calculateSignatureDimensions(
      signatureCanvas.width,
      signatureCanvas.height,
      viewport.width,
      viewport.height,
      position
    );

    // Create temporary canvas for signature manipulation
    const sigCanvas = document.createElement("canvas");
    const sigCtx = sigCanvas.getContext("2d")!;
    sigCanvas.width = signatureCanvas.width;
    sigCanvas.height = signatureCanvas.height;

    // Draw original signature
    sigCtx.drawImage(signatureCanvas, 0, 0);

    // Convert to black
    sigCtx.globalCompositeOperation = "source-in";
    sigCtx.fillStyle = "#000";
    sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);

    // Draw on main canvas
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "white";
    ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
    ctx.globalAlpha = 1;
    ctx.drawImage(sigCanvas, x, y, width, height);
    ctx.restore();
  }

  return new Promise((resolve) => canvas.toBlob(resolve, "application/pdf"));
}

async function overlayImageSignature(
  file: File,
  signatureCanvas: HTMLCanvasElement | null,
  typedSignature?: string,
  position?: { x: number; y: number }
) {
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  if (signatureCanvas) {
    const { width, height, x, y } = calculateSignatureDimensions(
      signatureCanvas.width,
      signatureCanvas.height,
      image.width,
      image.height,
      position
    );

    // Create temporary canvas for signature manipulation
    const sigCanvas = document.createElement("canvas");
    const sigCtx = sigCanvas.getContext("2d")!;
    sigCanvas.width = signatureCanvas.width;
    sigCanvas.height = signatureCanvas.height;

    // Draw original signature
    sigCtx.drawImage(signatureCanvas, 0, 0);

    // Convert to black
    sigCtx.globalCompositeOperation = "source-in";
    sigCtx.fillStyle = "#000";
    sigCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);

    // Draw on main canvas
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "white";
    ctx.fillRect(x - 10, y - 10, width + 20, height + 20);
    ctx.globalAlpha = 1;
    ctx.drawImage(sigCanvas, x, y, width, height);
    ctx.restore();
  }

  return new Promise((resolve) => canvas.toBlob(resolve, file.type));
}

function calculateSignatureDimensions(
  sigWidth: number,
  sigHeight: number,
  docWidth: number,
  docHeight: number,
  position?: { x: number; y: number }
) {
  const sigAspectRatio = sigWidth / sigHeight;
  const maxWidth = docWidth * 0.3;
  const maxHeight = docHeight * 0.2;

  let width = maxWidth;
  let height = width / sigAspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * sigAspectRatio;
  }

  const x = position?.x ?? (docWidth - width) / 2;
  const y = position?.y ?? (docHeight - height) / 2;

  return { width, height, x, y };
}
