import type { Metadata } from "next";
import { useState } from "react";
import { captureException } from "@sentry/nextjs";

import { ErrorPageContent } from "@/components/error-page-content";
import { DocumentNotFound } from "@/components/doc-not-found";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/supabase/utils";

import { validateDocumentAccess } from "./utils";
import { DocAlreadySigned } from "./already-signed";
import { InvalidTokenPage } from "./invalid-token-page";
import { DocumentRejectedPage } from "./rejected-page";
import { DocumentExpiredPage } from "./expired-page";
import { SignDocContent } from "./sign-doc-content";

export const metadata: Metadata = {
  title: "Sign Document",
};

// Define the props for the page, including searchParams
interface SignDocumentPageProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function SignDocumentPage({
  params,
  searchParams,
}: SignDocumentPageProps) {
  const { id } = await params;
  const token = (await searchParams)?.token as string;

  if (!token) {
    return <InvalidTokenPage reason="no_token" />;
  }

  const supabase = await createServerClient();
  const validationResult = await validateDocumentAccess(supabase, id, token);
  // const validationResult = {
  //   status: "ready",
  //   password: "",
  //   signerEmail: "lawrence@docusol.app",
  //   participantId: "ec721edd-fa57-4f8c-8927-cd7192b6492b",
  //   documentId: "4a3e0d88-372c-4848-b7f0-b0e22668cbc3",
  //   documentName: "test",
  //   versionId: "ac8dafd8-2ba7-4147-a655-4edcb0192288",
  //   versionNumber: 1,
  //   isLastSigner: true,
  //   creatorUserId: "5d270ad5-789b-4f94-9260-bd073b7f6e65",
  // };
  console.log("validationResult", validationResult);

  // Handle validating the document access
  switch (validationResult.status) {
    case "not_found":
      return <DocumentNotFound />;
    case "invalid_token":
      return <InvalidTokenPage reason={validationResult.reason} />;
    case "already_signed":
      return <DocAlreadySigned timestamp={validationResult.signed_at} />;
    case "rejected":
      return <DocumentRejectedPage rejectedAt={validationResult.rejected_at} />;
    case "expired":
      return <DocumentExpiredPage />;
    case "error":
      console.error("Page Render Error:", validationResult.error);
      return <ErrorPageContent />;
    case "ready":
      return (
        <div className="container mx-auto max-w-7xl space-y-8 py-8">
          <SignDocContent
            token={token}
            password={validationResult?.password}
            documentId={validationResult.documentId}
            documentName={validationResult.documentName}
            signerEmail={validationResult.signerEmail}
            participantId={validationResult.participantId}
            versionId={validationResult.versionId}
            versionNumber={validationResult.versionNumber}
            isLastSigner={validationResult.isLastSigner}
            creatorUserId={validationResult.creatorUserId}
          />
        </div>
      );
    default:
      captureException(new Error("Unhandled validation status"), {
        extra: { validationResult },
      });
      return <ErrorPageContent />;
  }
}
