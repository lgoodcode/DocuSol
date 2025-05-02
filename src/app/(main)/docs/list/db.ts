import { createClient } from "@/lib/supabase/client";
import { getStorageServiceForCurrentUser } from "@/lib/utils";

import type { ViewDocument } from "./types";

export const getDocuments = async (): Promise<ViewDocument[]> => {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_documents_to_list");

  if (error) {
    throw error;
  }
  const nonDraftDocs = data.filter((doc) => doc.status !== "draft");
  return nonDraftDocs.map((doc) => ({
    id: doc.id,
    name: doc.name,
    password: doc.has_password,
    status: doc.status,
    txSignature: doc.tx_signature,
    expires: doc.expires_at,
    created: doc.created_at,
    updated: doc.updated_at,
    versionNumber: doc.version_number,
  }));
};

type DocumentData = {
  name: string;
  contentHash: string;
  fileHash: string;
  metadataHash: string;
};

export const getDocumentData = async (id: string): Promise<DocumentData> => {
  const supabase = createClient();

  // Fetch document name and current version hashes
  const { error, data } = await supabase
    .from("documents")
    .select(
      `
      name,
      document_versions ( contentHash, fileHash, metadataHash )
      `,
      // Old query:
      // "unsigned_document,signed_document,mime_type,name"
    )
    .eq("id", id)
    // Ensure we fetch the version linked by current_version_id
    // Supabase automatically joins based on the foreign key relationship
    // if the select syntax is correct and RLS permits.
    // We might need to adjust RLS on document_versions if access fails.
    .single();

  if (error) {
    console.error(`Error fetching document data for ID ${id}:`, error);
    throw error;
  }

  if (!data) {
    throw new Error(`No document found with ID ${id}`);
  }

  // Extract data - Supabase returns related records as an object or array.
  // Assuming document_versions is an object because of .single() and one-to-one FK (current_version_id)
  // If current_version_id can be null or the relationship is one-to-many, this might be an array.
  const versionData = Array.isArray(data.document_versions)
    ? data.document_versions[0]
    : data.document_versions;

  if (!versionData) {
    throw new Error(`No current version data found for document ID ${id}`);
  }

  // Removed old destructuring:
  // const { unsigned_document, signed_document, mime_type, name } = data;
  // const documentDataString = unsigned_document || signed_document;
  // if (!documentDataString) {
  //   throw new Error("No document data found");
  // }

  return {
    name: data.name,
    contentHash: versionData.contentHash,
    fileHash: versionData.fileHash,
    metadataHash: versionData.metadataHash,
    // Removed old fields:
    // unsigned_document: unsigned_document,
    // signed_document: signed_document,
    // mime_type: mime_type,
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
  debugger;
  const supabase = createClient();
  const { userId, storageService } = await getStorageServiceForCurrentUser();

  // 1. Delete from S3 storage
  try {
    const filePath = storageService.getFilePath(
      userId,
      doc.name,
      doc.versionNumber,
    );
    await storageService.deleteFiles([filePath]);
  } catch (storageError) {
    console.error(
      `Error deleting document ${filePath} from storage:`,
      storageError,
    );
    // Decide if you want to stop the whole process if S3 delete fails
    // For now, we'll throw, assuming deletion should be atomic.
    throw storageError;
  }

  // 3. Delete from database
  const { error: deleteDbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", doc.id);

  if (deleteDbError) {
    console.error(
      "Error deleting document record from database:",
      deleteDbError,
    );
    throw deleteDbError;
  }
};
