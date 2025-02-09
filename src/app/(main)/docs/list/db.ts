import { getAllStoredDocuments } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export const getDocuments = async (): Promise<ViewDocument[]> => {
  const ids = await getAllStoredDocuments().then((docs) =>
    docs.map((doc) => doc.id),
  );
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      id,
      name,
      password,
      is_signed,
      mime_type,
      unsigned_transaction_signature,
      signed_transaction_signature,
      unsigned_hash,
      signed_hash,
      unsigned_document,
      signed_document,
      created_at,
      updated_at
      `,
    )
    .in("id", ids);

  if (error) {
    throw error;
  } else if (!data) {
    return [];
  }

  const documents: ViewDocument[] = data.map((doc) => ({
    id: doc.id,
    name: doc.name,
    password: doc.password,
    status: doc.is_signed ? "signed" : "pending",
    mimeType: doc.mime_type,
    is_signed: doc.is_signed,
    unsignedTxSignature: doc.unsigned_transaction_signature,
    signedTxSignature: doc.signed_transaction_signature,
    unsignedHash: doc.unsigned_hash,
    signedHash: doc.signed_hash,
    unsignedDocumentHex: doc.unsigned_document,
    signedDocumentHex: doc.signed_document,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }));

  return documents;
};

type DocumentData = {
  unsigned_document: string;
  signed_document: string | null;
  mime_type: string;
  name: string;
};

export const getDocumentData = async (id: string): Promise<DocumentData> => {
  const supabase = createClient();
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

  const { unsigned_document, signed_document, mime_type, name } = data;
  const documentDataString = unsigned_document || signed_document;

  if (!documentDataString) {
    throw new Error("No document data found");
  }

  return {
    name: name,
    unsigned_document: unsigned_document,
    signed_document: signed_document,
    mime_type: mime_type,
  };
};

export const renameDocument = async (doc: ViewDocument) => {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents")
    .update({ name: doc.name })
    .eq("id", doc.id);

  if (error) {
    throw error;
  }
};

export const deleteDocument = async (doc: ViewDocument) => {
  const supabase = createClient();
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);

  if (error) {
    throw error;
  }
};
