"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { captureException } from "@sentry/nextjs";

import { PLATFORM_FEE } from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { getUser } from "@/lib/supabase/utils";
import { StorageService } from "@/lib/supabase/storage";
import { isValidEmail, withRetry } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { sign } from "@/lib/utils/sign";
import { hasSufficientBalance } from "@/lib/utils/solana";
import { useDocumentStore } from "@/lib/pdf-editor/stores/useDocumentStore";
import type { DocumentSigner } from "@/lib/types/stamp";

export const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Please provide an email address";
  }

  if (!isValidEmail(email)) {
    return "Invalid email address";
  }

  return null;
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return "Please provide a name";
  }
  if (name.length > 100) {
    return "Name must be less than 100 characters";
  }
  if (name.length < 2) {
    return "Name must be at least 2 characters";
  }
  return null;
};

/**
 * Converts a string to title case (e.g., "john doe" -> "John Doe")
 */
export const toTitleCase = (str: string): string =>
  str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Checks if an email already exists in the signers list
 *
 * @param signers The list of signers to check against
 * @param email The email to check
 * @param excludeIndex Optional index to exclude from the check (for editing)
 * @returns Error message if duplicate, null otherwise
 */
export const checkDuplicateEmail = (
  signers: DocumentSigner[],
  email: string,
  excludeId?: string,
): string | null => {
  const isDuplicate = signers.some(
    (signer) =>
      signer.email.toLowerCase() === email.toLowerCase() &&
      signer.id !== excludeId,
  );

  return isDuplicate
    ? `A signer with email ${email} has already been added`
    : null;
};

export function useSignDoc() {
  const { toast } = useToast();

  return async function signDocument(
    file: File,
    signatureType: "draw" | "type",
    hasDrawn: boolean,
    writtenSignature: HTMLCanvasElement | null,
    typedSignature: string,
  ) {
    // TODO: revist this logic for improved signing flow
    const isSigned =
      (signatureType === "draw" && hasDrawn) ||
      (signatureType === "type" && typedSignature);

    if (!isSigned) {
      return null;
    }

    try {
      const signedDoc = await sign(
        file,
        signatureType === "draw" ? writtenSignature : null,
        signatureType === "type" ? typedSignature : undefined,
      );

      return signedDoc;
    } catch (err) {
      const error = err as Error;
      console.error(error);

      const isEncrypted = error.message.includes("encrypted");
      const errorMessage = isEncrypted
        ? "The document is encrypted and cannot be modified"
        : "An error occurred while signing the document";

      // Don't need to capture exceptions for encrypted documents
      if (!isEncrypted) {
        captureException(error);
      }

      toast({
        title: "Document Signing Error",
        description: errorMessage,
        variant: "destructive",
      });

      return null;
    }
  };
}

export function useUserHasSufficientBalance() {
  const { toast } = useToast();
  const { publicKey } = useWallet();

  return async function userHasSufficientBalance() {
    try {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      const isSufficient = await hasSufficientBalance(publicKey);
      if (!isSufficient) {
        toast({
          title: "Insufficient Balance",
          description: (
            <span>
              You need at least <strong>{PLATFORM_FEE} SOL</strong> in your
              wallet to upload a document for the platform fee.
            </span>
          ),
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (err) {
      const error = err as Error;
      console.error(error);
      captureException(error);

      toast({
        title: "Error",
        description: "An error occurred while verifying your balance",
        variant: "destructive",
      });
      return false;
    }
  };
}

export async function uploadDocumentToStorage(
  documentName: string,
  file: File,
  version: number,
) {
  const supabase = createClient();
  const user = await getUser(supabase);
  const storageService = new StorageService(supabase);

  await withRetry(async () => {
    await storageService.uploadFile(
      user.id,
      documentName,
      file,
      file.type,
      version,
    );
  });
}

/**
 * Function to reset a document and its version atomically
 * with retries and rollback on failure
 *
 * @returns A function that handles document reset atomically
 */
export function useResetDocument() {
  const { documentId, documentName, reset } = useDocumentStore();
  const supabase = createClient();

  return async function resetDocument() {
    try {
      const user = await getUser(supabase);
      const storageService = new StorageService(supabase);
      const filePath = storageService.getFilePath(user.id, documentName, 0);

      async function deleteFileFromStorage() {
        try {
          await withRetry(
            async () => {
              await storageService.deleteFiles([filePath]);
            },
            {
              cancelOnError: (error) =>
                error.message === "The resource does not exist",
            },
          );
        } catch (error) {
          console.error("Error deleting file from storage:", error);
          captureException(error);
        }
      }

      async function deleteDocumentFromDB() {
        try {
          if (documentId) {
            await withRetry(async () => {
              await supabase.from("documents").delete().eq("id", documentId);
            });
          }
        } catch (error) {
          console.error("Error deleting document from DB:", error);
          captureException(error);
        }
      }

      await Promise.all([deleteFileFromStorage(), deleteDocumentFromDB()]);
    } catch (error) {
      console.error("Error resetting document:", error);
      captureException(error);
      throw error;
    } finally {
      reset();
    }
  };
}

/**
 * Function to upload a document and create its version atomically
 * with retries and rollback on failure
 *
 * @returns A function that handles document upload and version creation atomically
 */
export async function uploadInitialDocument(
  documentName: string,
  file: File,
  hash: string,
) {
  const supabase = createClient();
  const version = 0;
  const user = await getUser(supabase);
  const storageService = new StorageService(supabase);
  const filePath = storageService.getFilePath(user.id, documentName, version);
  let documentUploaded = false;

  try {
    await uploadDocumentToStorage(documentName, file, version);
    documentUploaded = true;

    // Step 2: Create the document and version in the database
    const { error, data } = await withRetry(async () => {
      return await supabase.rpc("create_document_with_version", {
        p_name: documentName,
        p_hash: hash,
      });
    });

    if (error) {
      throw error;
    } else if (data.length === 0) {
      throw new Error("Document not created");
    }

    return data[0].document_id;
  } catch (err) {
    const error = err as Error;
    // File uploaded to storage but DB operation failed
    if (documentUploaded) {
      try {
        await storageService.deleteFiles([filePath]);
      } catch (cleanupErr) {
        console.error("Failed to clean up file from storage:", cleanupErr);
        captureException(cleanupErr);
      }
    }

    throw error;
  }
}
