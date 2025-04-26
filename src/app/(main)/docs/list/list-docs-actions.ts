"use client";

import { getTransactionUrl } from "@/lib/utils/solana";

import { ViewDocument } from "./types";

// const getDocumentBlob = async (doc: ViewDocument): Promise<Blob> => {
//   const documentData = await getDocumentData(doc.id);
//   const documentDataArray = new Uint8Array(
//     hexToBuffer(documentData.unsigned_document),
//   );
//   return new Blob([documentDataArray], { type: documentData.mime_type });
// };

// export const viewDocument = async (doc: ViewDocument): Promise<void> => {
//   const blob = await getDocumentBlob(doc);
//   previewBlob(blob);
// };

export const viewTransaction = async (doc: ViewDocument): Promise<void> => {
  const url = getTransactionUrl(doc.txSignature);
  if (window) {
    window.open(url, "_blank");
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

// export const downloadDocument = async (doc: ViewDocument): Promise<void> => {
//   const blob = await getDocumentBlob(doc);
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = doc.name || `document-${doc.id}`;
//   document.body.appendChild(a);
//   a.click();
//   document.body.removeChild(a);
//   URL.revokeObjectURL(url);
// };
