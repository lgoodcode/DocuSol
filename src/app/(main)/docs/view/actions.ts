import { supabase } from "@/lib/supabase/client";
import { hexToBuffer, previewBlob } from "@/lib/utils";
import { getTransactionUrl } from "@/lib/utils/solana";

const getDocument = async (id: string): Promise<Blob> => {
  const { error, data } = await supabase
    .from("documents")
    .select("unsigned_document,signed_document,mime_type,name")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No document found");
  }

  const { unsigned_document, signed_document, mime_type } = data;
  const documentDataString = unsigned_document || signed_document;

  if (!documentDataString) {
    throw new Error("No document data found");
  }

  const documentData = new Uint8Array(hexToBuffer(documentDataString));
  return new Blob([documentData], { type: mime_type });
};

export const viewDocument = async (id: string): Promise<void> => {
  const blob = await getDocument(id);
  previewBlob(blob);
};

export const viewTransaction = async (txSignature: string): Promise<void> => {
  const url = getTransactionUrl(txSignature);
  window.open(url, "_blank");
};

export const copyTxSignature = async (txSignature: string): Promise<void> => {
  navigator.clipboard.writeText(txSignature);
};

export const downloadDocument = async (id: string): Promise<void> => {
  const { data } = await supabase
    .from("documents")
    .select("name")
    .eq("id", id)
    .single();

  const blob = await getDocument(id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = data?.name || `document-${id}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const deleteDocument = async (id: string): Promise<void> => {
  const { error } = await supabase.from("documents").delete().eq("id", id);

  if (error) {
    throw error;
  }
};
