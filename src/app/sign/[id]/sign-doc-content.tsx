"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

import type { DocumentField } from "@/lib/pdf-editor/document-types";
import type { DocumentSigner } from "@/lib/types/stamp";

import { PasswordRequiredContent } from "./password-required-content";
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

interface DocumentSigningData {
  signer: DocumentSigner;
  fields: DocumentField[];
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
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<Blob | null>(null);
  const [documentSigningData, setDocumentSigningData] =
    useState<DocumentSigningData | null>(null);

  const fetchDocument = async () => {
    setIsLoading(true);

    const document = await getPdfDocument(
      supabase,
      documentName,
      versionNumber,
    );

    if (!document) {
      setError("Document not found");
    } else {
      setDocument(document);
    }
    console.log("document", document);
    setIsLoading(false);
  };

  const fetchDocumentSigningData = async () => {
    const { data, error } = await supabase
      .rpc("get_document_signing_data", {
        p_document_id: documentId,
        p_signer_email: signerEmail,
      })
      .single();

    if (error) {
      console.error("Error fetching document signing data", error);
      setError("Error fetching document signing data");
    } else if (!data) {
      setError("Document signing data not found");
    } else {
      setDocumentSigningData({
        signer: data.signer as DocumentSigner,
        fields: data.fields as unknown as DocumentField[],
      });
    }
    console.log("documentData", data);
  };

  useEffect(() => {
    if (!password || (password && isPasswordVerified)) {
      fetchDocument();
      fetchDocumentSigningData();
    }
  }, [password, isPasswordVerified]);

  if (password && !isPasswordVerified) {
    return (
      <PasswordRequiredContent
        token={token}
        password={password}
        onSuccess={() => setIsPasswordVerified(true)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-2">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
}
