import type { Document } from "@/lib/supabase/types";

type NewDocument = Pick<
  Document,
  | "name"
  | "password"
  | "original_filename"
  | "mime_type"
  | "unsigned_document"
  | "signed_document"
>;

export async function uploadFile(newDocument: NewDocument) {
  const formData = new FormData();
  formData.append("name", newDocument.name);
  formData.append("password", newDocument.password || "");
  formData.append("originalFilename", newDocument.original_filename);
  formData.append("mimeType", newDocument.mime_type);
  formData.append("unsigned_document", newDocument.unsigned_document);
  formData.append("signed_document", newDocument.signed_document || "");

  const response = await fetch("/api/docs/new", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return await response.json();
}
