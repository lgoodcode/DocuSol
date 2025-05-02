"use client";

import { toast } from "sonner";
import { captureException } from "@sentry/nextjs";

import { getStorageServiceForCurrentUser } from "@/lib/utils";
import { getTransactionUrl } from "@/lib/utils/solana";
import { previewBlob } from "@/lib/utils";

import { ViewDocument } from "./types";

// const getDocumentBlob = async (doc: ViewDocument): Promise<Blob> => {
//   const documentData = await getDocumentData(doc.id);
//   const documentDataArray = new Uint8Array(
//     hexToBuffer(documentData.unsigned_document),
//   );
//   return new Blob([documentDataArray], { type: documentData.mime_type });
// };

// View the lastest version of the document from storage service
export const viewDocument = async (doc: ViewDocument): Promise<void> => {
  try {
    const { userId, storageService } = await getStorageServiceForCurrentUser();
    const blob = await storageService.getDocument(
      userId,
      doc.name,
      doc.versionNumber,
    );
    previewBlob(blob);
  } catch (error) {
    captureException(error, { extra: { doc } });
    toast.error("Error viewing document");
  }
};

export const viewTransaction = async (doc: ViewDocument): Promise<void> => {
  try {
    const url = getTransactionUrl(doc.txSignature);
    if (window) {
      window.open(url, "_blank");
    }
  } catch (error) {
    captureException(error, { extra: { doc } });
    toast.error("Error viewing transaction");
  }
};

export const copyTxSignature = async (doc: ViewDocument): Promise<string> => {
  navigator.clipboard.writeText(doc.txSignature);
  return doc.txSignature;
};

// export const copyDocumentSignUrl = async (
//   doc: ViewDocument,
// ): Promise<string> => {
//   const url = window.location.origin;
//   navigator.clipboard.writeText(`${url}/docs/sign/${doc.id}`);
//   return `${url}/sign/${doc.id}`;
// };

// export const copyViewUrl = async (doc: ViewDocument): Promise<string> => {
//   const url = window.location.origin;
//   navigator.clipboard.writeText(`${url}/docs/view/${doc.id}`);
//   return `${url}/docs/view/${doc.id}`;
// };

export const downloadDocument = async (doc: ViewDocument): Promise<void> => {
  const { userId, storageService } = await getStorageServiceForCurrentUser();
  const blob = await storageService.getDocument(
    userId,
    doc.name,
    doc.versionNumber,
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.name || `document-${doc.id}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
