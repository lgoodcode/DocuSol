"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { DocumentCanvas } from "@/components/pdf-editor/DocumentCanvas";
import { FieldsList } from "@/components/pdf-editor/FieldsList";
import { createClient } from "@/lib/supabase/client";

import type { DocumentField } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";

import { PasswordRequiredContent } from "./password-required-content";
import { useDocumentSigningStore } from "./useDocumentSignStore";
import { getPdfDocument } from "./utils";

interface SignDocContentProps {
  token: string;
  password?: string;
  signerEmail: string;
  documentId: string;
  documentName: string;
  versionId: string;
  versionNumber: number;
}

export function SignDocContent({
  token,
  password,
  signerEmail,
  documentId,
  documentName,
  versionId,
  versionNumber,
}: SignDocContentProps) {
  const supabase = createClient();
  const [isPasswordVerified, setIsPasswordVerified] = useState(!password);
  const [isMounted, setIsMounted] = useState(false);
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
    })),
  );

  console.log({
    isPasswordVerified,
    isLoading,
    error,
    documentDataUrl,
    documentId,
    documentName,
    versionNumber,
    signerEmail,
  });

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

    let isMounted = true;

    const fetchData = async () => {
      try {
        const blob = await getPdfDocument(
          supabase,
          documentName,
          versionNumber,
        );
        if (!blob) {
          throw new Error("Document file not found or access denied.");
        }

        if (!isMounted) return;

        const { data: signingRpcData, error: signingError } = await supabase
          .rpc("get_document_signing_data", {
            p_document_id: documentId,
            p_signer_email: signerEmail,
          })
          .single();

        if (!isMounted) return;

        if (signingError) {
          console.error("Error fetching document signing data", signingError);
          throw new Error("Error fetching required signing information.");
        }
        if (
          !signingRpcData ||
          !signingRpcData.fields ||
          !signingRpcData.signer
        ) {
          throw new Error("Document signing data not found for this user.");
        }

        // Map the signer and fields from the SQL RPC response to the document store types
        const mappedFields = (signingRpcData.fields as any[]).map((field) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          value: field.value,
          options: field.options,
          required: field.required,
          signature_scale: field.signature_scale,
          text_styles: field.text_styles || {},
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
        })) satisfies DocumentField[];

        setFields(mappedFields);

        const signerData = signingRpcData.signer as any;
        const mappedSigner = {
          id: signerData.id,
          name: signerData.name,
          email: signerData.email,
          color: signerData.color,
          role: signerData.role,
          mode: signerData.mode,
          isOwner: signerData.is_owner,
        } satisfies DocumentSigner;

        setCurrentSigner(mappedSigner);

        console.log({
          mappedFields,
          mappedSigner,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && typeof reader.result === "string") {
            setDocumentDataUrl(reader.result);
          } else if (isMounted) {
            setError("Failed to read document file.");
            setLoading(false);
          }
        };
        reader.onerror = () => {
          if (isMounted) {
            console.error("Failed to read document file.");
            setError("Failed to read document file.");
            setLoading(false);
          }
        };
        reader.readAsDataURL(blob);
      } catch (err: any) {
        console.error("Error fetching data for signing:", err);
        if (isMounted) {
          setError(err.message || "An unexpected error occurred");
          setLoading(false);
        }
      }
    };

    if (isMounted) {
      fetchData();
    }
  }, [
    isMounted,
    isPasswordVerified,
    supabase,
    documentName,
    versionNumber,
    documentId,
    signerEmail,
    setDocumentDataUrl,
    setFields,
    setCurrentSigner,
    setLoading,
    setError,
    resetStore,
  ]);

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

  // --- DEBUG LOG ---
  console.log("[SignDocContent] State before render:", {
    isLoading,
    error,
    documentDataUrl: !!documentDataUrl, // Check if URL exists
    numPages, // Check numPages from store
    fields, // Check fields array from store
    currentSigner: !!currentSigner, // Check if signer exists
  });

  return (
    <div className="flex h-[calc(100vh-160px)] overflow-hidden rounded-lg border bg-background shadow-md">
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
          <p className="text-center text-sm text-muted-foreground">
            Signing actions go here
          </p>
        </div>
      </div>
    </div>
  );
}
