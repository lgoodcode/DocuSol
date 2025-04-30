import { validate as uuidValidate } from "uuid";
import { captureException } from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getUser } from "@/lib/supabase/utils";
import { StorageService } from "@/lib/supabase/storage";
import type { ServerSupabaseClient } from "@/lib/supabase/server";

export type InvalidTokenReason =
  | "expired"
  | "used"
  | "mismatch"
  | "invalidated"
  | "unknown"
  | "invalid_uuid";

/**
 * Represents the result of validating document access using ID and token.
 * Note: Document content (blob) is NOT fetched here, only metadata.
 */
export type ValidateDocumentAccessResult =
  | { status: "not_found" }
  | {
      status: "invalid_token";
      reason: InvalidTokenReason;
    }
  | { status: "already_signed"; signed_at: string }
  | { status: "rejected"; rejected_at: string | null }
  | { status: "expired" }
  | {
      status: "ready";
      password?: string;
      signerEmail: string;
      documentId: string;
      documentName: string;
      versionId: string;
      versionNumber: number;
    }
  | { status: "error"; error: Error };

/**
 * Validates document access using the document ID and a verification token.
 * Checks token validity and document metadata status (including rejected/expired).
 * Does NOT fetch the actual document content blob.
 *
 * @param id - The document ID from the URL path.
 * @param token - The verification token from the URL query parameters.
 * @returns A promise resolving to a ValidateDocumentAccessResult object.
 */
export const validateDocumentAccess = async (
  supabase: ServerSupabaseClient,
  id: string,
  token: string | undefined | null,
): Promise<ValidateDocumentAccessResult> => {
  if (!uuidValidate(id)) {
    return { status: "not_found" };
  }

  if (!token) {
    return { status: "invalid_token", reason: "unknown" };
  }

  if (!uuidValidate(token)) {
    return { status: "invalid_token", reason: "invalid_uuid" };
  }

  try {
    // 1. Verify the token
    const { data: tokenData, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select("document_id, email, expires_at, invalidated_at, used_at")
      .eq("token", token)
      .single();

    if (tokenError) {
      // Handle token fetch errors (not found, db error)
      if (tokenError.code === "PGRST116") return { status: "not_found" };
      console.error("Token Fetch Error:", tokenError);
      captureException(tokenError, { extra: { id, token } });
      return { status: "error", error: tokenError };
    } else if (!tokenData) {
      return { status: "invalid_token", reason: "unknown" };
    } else if (!tokenData.email) {
      return { status: "invalid_token", reason: "unknown" };
    }

    // Validate token details
    if (tokenData.document_id !== id)
      return { status: "invalid_token", reason: "mismatch" };
    if (tokenData.used_at) return { status: "invalid_token", reason: "used" };
    if (tokenData.invalidated_at)
      return { status: "invalid_token", reason: "invalidated" };
    if (new Date(tokenData.expires_at) < new Date())
      return { status: "invalid_token", reason: "expired" };

    // 2. Token is valid, check document metadata
    const { data: docData, error: docError } = await supabase
      .rpc("get_document_details_for_signing", { p_document_id: id })
      .single();

    if (docError) {
      // Handle document fetch errors (not found, db error)
      if (docError.code === "PGRST116") {
        console.warn(`Token valid but document ${id} not found.`);
        return { status: "not_found" };
      }
      console.error("Document Metadata Fetch Error:", docError);
      captureException(docError, { extra: { id, token } });
      return { status: "error", error: docError };
    }

    // 3. Check document status
    if (docData.status === "completed" && docData.completed_at) {
      return { status: "already_signed", signed_at: docData.completed_at };
    }
    if (docData.status === "rejected") {
      return { status: "rejected", rejected_at: docData.rejected_at };
    }
    // Check expiration based on expires_at date AND status
    if (
      docData.status === "expired" ||
      (docData.expires_at && new Date(docData.expires_at) < new Date())
    ) {
      // Ensure status is updated if expires_at passed but status isn't 'expired' yet (optional safety)
      // You might have a cron job for this, but checking here is safe.
      if (docData.status !== "expired") {
        // TODO: Optionally update the status in DB to 'expired' here if needed.
        // supabase.from('documents').update({ status: 'expired' }).eq('id', id);
        console.warn(
          `Document ${id} has passed expires_at but status is ${docData.status}. Treating as expired.`,
        );
      }
      return { status: "expired" };
    }
    // Add checks for other statuses if needed (e.g., 'draft' shouldn't be signable via link)
    if (docData.status === "draft") {
      console.warn(`Attempt to sign document ${id} while in draft status.`);
      return { status: "not_found" }; // Or a more specific error?
    }

    // 4. Document is ready for signing
    // Ensure it's in a signable state (e.g., awaiting_signatures or partially_signed)
    if (
      docData.status !== "awaiting_signatures" &&
      docData.status !== "partially_signed"
    ) {
      console.warn(
        `Attempt to sign document ${id} with unexpected status: ${docData.status}`,
      );
      // Maybe return a generic error or 'not_found'?
      // Or let it proceed if some other logic allows it? For now, let's return an error.
      captureException(
        new Error("Attempt to sign document with non-signable status"),
        { extra: { id, status: docData.status } },
      );
      return {
        status: "error",
        error: new Error("Document not available for signing"),
      };
    }

    return {
      status: "ready",
      password: docData.password,
      documentId: docData.id,
      documentName: docData.name,
      signerEmail: tokenData.email,
      versionId: docData.current_version_id,
      versionNumber: docData.current_version_number,
    };
  } catch (error) {
    console.error("Unexpected Validation Error:", error);
    captureException(error, { extra: { id, token } });
    return { status: "error", error: error as Error };
  }
};

/**
 * Get the PDF document from the storage service
 * @param documentName - The name of the document
 * @param version - The version number of the document
 * @returns The PDF document
 */
export const getPdfDocument = async (
  supabase: SupabaseClient,
  documentName: string,
  version: number,
) => {
  const user = await getUser(supabase);
  const storage = new StorageService(supabase);
  // Subtract 1 from version number because the document is always
  // uploaded with version 0 so it will be 1 behind the version number
  // in the database
  return await storage.getDocument(user.id, documentName, version - 1);
};
