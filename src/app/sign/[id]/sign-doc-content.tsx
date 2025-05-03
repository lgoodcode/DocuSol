"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { captureException } from "@sentry/nextjs";

import { API_PATHS } from "@/config/routes/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { DocumentCanvas } from "@/components/pdf-editor/DocumentCanvas";
import { FieldsList } from "@/components/pdf-editor/FieldsList";
import { createClient } from "@/lib/supabase/client";
import { uploadDocumentToStorage } from "@/lib/utils";
import { PDFHash } from "@/lib/stamp/hash-service";
import { PDFMetadata } from "@/lib/stamp/pdf-metadata";
import type { DocumentContentHash } from "@/lib/types/stamp";
import type { SignRequestForm } from "@/app/api/docs/sign/utils";

import { PasswordRequiredContent } from "./password-required-content";
import {
  useDocumentSigningStore,
  selectCanCompleteSigning,
} from "./useDocumentSignStore";
import { fetchSigningData } from "./utils";

interface SignDocContentProps {
  token: string;
  password?: string;
  signerEmail: string;
  participantId: string;
  documentId: string;
  documentName: string;
  versionId: string;
  versionNumber: number;
  isLastSigner: boolean;
  creatorUserId: string;
}

export function SignDocContent({
  token,
  password,
  signerEmail,
  participantId,
  documentId,
  documentName,
  versionId,
  versionNumber,
  isLastSigner,
  creatorUserId,
}: SignDocContentProps) {
  const supabase = createClient();
  const [isPasswordVerified, setIsPasswordVerified] = useState(!password);
  const [isMounted, setIsMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const canComplete = useDocumentSigningStore(selectCanCompleteSigning);
  const {
    documentDataUrl,
    numPages,
    setNumPages,
    scale,
    fields,
    updateField,
    currentSigner,
    selectedFieldId,
    setSelectedFieldId,
    setDocumentDataUrl,
    setFields,
    setCurrentSigner,
    setLoading,
    setError,
    resetStore,
    isLoading,
    error,
    exportAndDownloadSignedPdf,
  } = useDocumentSigningStore(
    useShallow((state) => ({
      documentDataUrl: state.documentDataUrl,
      numPages: state.numPages,
      scale: state.scale,
      fields: state.fields,
      updateField: state.updateField,
      currentSigner: state.currentSigner,
      selectedFieldId: state.selectedFieldId,
      setNumPages: state.setNumPages,
      setSelectedFieldId: state.setSelectedFieldId,
      setDocumentDataUrl: state.setDocumentDataUrl,
      setFields: state.setFields,
      setCurrentSigner: state.setCurrentSigner,
      setLoading: state.setLoading,
      setError: state.setError,
      resetStore: state.resetStore,
      isLoading: state.isLoading,
      error: state.error,
      exportAndDownloadSignedPdf: state.exportAndDownloadSignedPdf,
    })),
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    resetStore();

    if (!isPasswordVerified) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let isMountedCheck = true;

    const loadData = async () => {
      const result = await fetchSigningData(
        supabase,
        creatorUserId,
        documentName,
        versionNumber,
        documentId,
        signerEmail,
        participantId,
      );

      if (!isMountedCheck) return;

      if (result.error || !result.data) {
        console.error("Error fetching signing data:", result.error);
        setError(
          result.error?.message || "An unexpected error occurred loading data.",
        );
        setLoading(false);
        return;
      }

      const { blob, mappedFields, mappedSigner } = result.data;

      setFields(mappedFields);
      setCurrentSigner(mappedSigner);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMountedCheck && typeof reader.result === "string") {
          setDocumentDataUrl(reader.result);
          setLoading(false);
        } else if (isMountedCheck) {
          setError("Failed to read document file.");
          setLoading(false);
        }
      };
      reader.onerror = () => {
        if (isMountedCheck) {
          console.error("FileReader error reading blob.");
          setError("Failed to read document file.");
          setLoading(false);
        }
      };
      reader.readAsDataURL(blob);
    };

    if (isMounted) {
      loadData();
    }

    return () => {
      isMountedCheck = false;
    };
  }, [
    isMounted,
    isPasswordVerified,
    supabase,
    documentName,
    versionNumber,
    documentId,
    participantId,
    setDocumentDataUrl,
    setFields,
    setCurrentSigner,
    setLoading,
    setError,
    resetStore,
  ]);

  console.log({
    documentId,
    documentName,
    versionNumber,
    versionId,
    isLastSigner,
    creatorUserId,
    signerEmail,
    token,
    password,
  });

  const sendSignedDocument = async (
    signedBlob: Blob,
    signedContentHash: DocumentContentHash,
  ) => {
    const payload: SignRequestForm = {
      documentId,
      documentName,
      token,
      participantId,
      contentHash: signedContentHash.contentHash,
      fileHash: signedContentHash.fileHash,
      metadataHash: signedContentHash.metadataHash,
      signerEmail: signerEmail,
      versionNumber,
      password,
      isLastSigner,
      creatorUserId,
    };

    const response = await fetch(API_PATHS.DOCS.SIGN, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        dryRun: {
          email: false,
          memo: false,
          database: false,
        },
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      const errorMessage =
        errorData?.message ||
        `Failed to submit signed document. Status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return await response.json(); // Or handle success response as needed
  };

  const handleExport = async () => {
    if (isSaving || !documentDataUrl) return;
    setIsSaving(true);
    const toastId = toast.loading("Processing and submitting document...");

    try {
      const signedBlob = await exportAndDownloadSignedPdf(
        `signed_${documentName}_placeholder.pdf`,
      );

      if (!signedBlob) {
        throw new Error("Failed to generate signed PDF blob.");
      }

      const signedContentHash = await PDFHash.generateContentHash(
        Buffer.from(await signedBlob.arrayBuffer()),
      );

      const result = await sendSignedDocument(signedBlob, signedContentHash);
      if (!result?.success) {
        debugger;
        throw new Error("Failed to submit signed document.");
      }

      const { transactionSignature, versionNumber } = result;
      const embededPDFBuffer = await PDFMetadata.embedMetadata(signedBlob, {
        transaction: transactionSignature,
        version: versionNumber,
        documentId,
        password,
      });

      const embededPDF = new File([embededPDFBuffer], `${documentName}.pdf`, {
        type: "application/pdf",
      });

      // Store the PDF in the storage service
      await uploadDocumentToStorage(
        creatorUserId,
        documentName,
        embededPDF,
        versionNumber,
      );

      toast.success("Document submitted successfully!", {
        id: toastId,
        description: "Your signed document has been processed.",
      });

      setIsSigned(true);
    } catch (err) {
      const error = err as Error;
      console.error("Signing submission failed:", error);
      captureException(error);
      // If already signed, show a different message
      if (error.message.includes("409")) {
        toast.error("Document already signed", {
          id: toastId,
          description:
            "Document has already been signed and can no longer be modified.",
        });
      } else {
        toast.error("Submission Failed", {
          id: toastId,
          description: "Please try again",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isPasswordVerified) {
    return (
      <PasswordRequiredContent
        token={token}
        password={password!}
        onSuccess={() => setIsPasswordVerified(true)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-160px)] flex-col items-center justify-center space-y-2">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (!isLoading && error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Document</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isSigned) {
    return (
      <div className="flex h-[calc(100vh-160px)] flex-col items-center justify-center space-y-6">
        <CheckCircle className="h-16 w-16 text-green-500" />
        <p className="text-xl font-semibold">Document Signed Successfully!</p>
        <p className="text-center text-muted-foreground">
          Your document has been successfully signed and processed. You can now
          close this window.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-160px)] overflow-hidden rounded-lg border bg-background shadow-md">
      <LoadingOverlay isLoading={isSaving} message="Processing Document..." />

      <div className="relative flex-1 overflow-hidden rounded-l-lg bg-gray-100 dark:bg-gray-800">
        <DocumentCanvas
          documentDataUrl={documentDataUrl}
          numPages={numPages}
          setNumPages={setNumPages}
          scale={scale}
          fields={fields}
          updateField={updateField}
          currentSigner={currentSigner}
          selectedFieldId={selectedFieldId}
          setSelectedFieldId={setSelectedFieldId}
          viewType="signer"
        />
      </div>

      <div className="flex w-80 flex-col border-l">
        <div className="flex-1 overflow-y-auto">
          <FieldsList viewType="signer" />
        </div>
        <div className="border-t p-4">
          <Button
            onClick={handleExport}
            disabled={!canComplete || isSaving}
            className="w-full"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Signing
          </Button>
          {!canComplete && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Please fill all required fields assigned to you.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
