import { validate as uuidValidate } from "uuid";
import { captureException } from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { DocumentField } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";
import { getUser } from "@/lib/supabase/utils";
import { StorageService } from "@/lib/supabase/storage";
import { PDFMetadata } from "@/lib/pdf-editor/pdf-metadata";
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
      participantId: string;
      documentId: string;
      documentName: string;
      versionId: string;
      versionNumber: number;
      isLastSigner: boolean;
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
      .rpc("get_document_details_for_signing", {
        p_document_id: id,
        p_signer_email: tokenData.email,
      })
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

    // Check if participant was found (RPC might return nulls if email didn't match)
    if (!docData.participant_id) {
      console.warn(
        `Participant not found for email ${tokenData.email} on document ${id}`,
      );
      // Treat as if the document wasn't found for this specific link
      return { status: "not_found" };
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
      participantId: docData.participant_id,
      versionId: docData.current_version_id,
      versionNumber: docData.current_version_number,
      isLastSigner: docData.is_last,
      creatorUserId: docData.creator_user_id,
    };
  } catch (error) {
    console.error("Unexpected Validation Error:", error);
    captureException(error, { extra: { id, token } });
    return { status: "error", error: error as Error };
  }
};

/**
 * Get the PDF document Blob from the storage service.
 * Assumes the user has permission to access the document.
 *
 * @param supabase - Supabase client instance.
 * @param documentName - The name of the document.
 * @param version - The version number of the document to fetch.
 * @returns The PDF document blob or null if not found/error.
 */
export const getPdfDocument = async (
  supabase: SupabaseClient,
  documentName: string,
  version: number,
): Promise<Blob | null> => {
  try {
    const user = await getUser(supabase);
    const storage = new StorageService(supabase);
    // Version 0 in storage corresponds to version 1 from DB perspective, etc.
    // The calling function should provide the correct *database* version number.
    // Version 0 from DB (draft) is not stored this way typically.
    // If version 1 is requested, fetch storage version 0.
    const storageVersion = version > 0 ? version - 1 : 0; // Adjust for 0-based storage version
    return await storage.getDocument(user.id, documentName, storageVersion);
  } catch (error) {
    console.error("Error getting PDF document from storage:", error);
    captureException(error, { extra: { documentName, version } });
    return null;
  }
};

/**
 * Result type for fetchSigningData.
 */
export type FetchSigningDataResult = {
  data: {
    blob: Blob;
    mappedFields: DocumentField[];
    mappedSigner: DocumentSigner;
  } | null;
  error: Error | null;
};

/**
 * Fetches all necessary data for the signing page: document blob, fields, and signer info.
 *
 * @param supabase - Supabase client instance.
 * @param documentName - Name of the document.
 * @param versionNumber - Version number of the document.
 * @param documentId - ID of the document.
 * @param signerEmail - Email of the signer.
 * @param participantId - ID of the participant.
 * @returns A promise resolving to a FetchSigningDataResult object.
 */
export const fetchSigningData = async (
  supabase: SupabaseClient,
  documentName: string,
  versionNumber: number,
  documentId: string,
  signerEmail: string,
  participantId: string,
): Promise<FetchSigningDataResult> => {
  try {
    // 1. Fetch the PDF document blob
    const blob = await getPdfDocument(supabase, documentName, versionNumber);
    if (!blob) {
      throw new Error("Document file not found or access denied.");
    }

    // 2. Fetch document fields and signer details for this specific participant
    const { data: details, error: detailsError } = await supabase
      .rpc("get_document_signing_data", {
        p_document_id: documentId,
        p_signer_email: signerEmail,
      })
      .single();

    if (detailsError) {
      console.error(
        `Participant ${participantId} not found for document ${documentId}.`,
        detailsError,
      );
      return {
        data: null,
        error: new Error(
          "Could not retrieve signing details for this participant.",
        ),
      };
    }

    // Ensure necessary details were returned
    if (!details.fields || !details.signer) {
      console.error(
        "RPC get_document_signing_data did not return expected data.",
        { details },
      );
      return {
        data: null,
        error: new Error("Incomplete signing details received."),
      };
    }

    // 3. Map fields (assuming 'fields' is JSONB in the expected format)
    const mappedFields = details.fields.map(
      (field: any): DocumentField => ({
        id: field.id,
        type: field.type,
        label: field.label,
        value: field.value || "", // Default to empty string if null
        options: field.options,
        required: field.required,
        signatureScale: field.signature_scale,
        textStyles: field.text_styles || {},
        assignedTo: field.participant_id,
        createdAt: field.created_at,
        updatedAt: field.updated_at,
        position: {
          x: field.position_x,
          y: field.position_y,
          page: field.position_page,
        },
        size: {
          width: field.size_width,
          height: field.size_height,
        },
      }),
    ) satisfies DocumentField[];

    // 4. Map the current signer
    // The RPC should return only the relevant participant's details
    const mappedSigner: DocumentSigner = {
      id: details.signer.id,
      name: details.signer.name,
      email: details.signer.email,
      role: details.signer.role,
      mode: details.signer.mode,
      isOwner: details.signer.is_owner,
      color: details.signer.color,
      userId: details.signer.user_id,
    };

    return {
      data: {
        blob,
        mappedFields,
        mappedSigner,
      },
      error: null,
    };
  } catch (err: any) {
    console.error("Error in fetchSigningData:", err);
    // Capture exception without tagging it to a specific operation like RPC or storage
    captureException(err, {
      extra: { documentName, versionNumber, documentId, participantId },
    });
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
};
