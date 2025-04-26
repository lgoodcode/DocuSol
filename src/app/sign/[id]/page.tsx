import type { Metadata } from "next";
import { useState } from "react";
import { captureException } from "@sentry/nextjs";

import { ErrorPageContent } from "@/components/error-page-content";
import { DocumentNotFound } from "@/components/doc-not-found";

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
  const token = (await searchParams)?.token as string | undefined;
  // const validationResult = await validateDocumentAccess(id, token);
  const validationResult = {
    status: "ready",
    password: "test",
  };

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
        <div className="container mx-auto max-w-4xl space-y-8 py-8">
          <SignDocContent token={token} password={validationResult?.password} />
        </div>
      );
    default:
      captureException(new Error("Unhandled validation status"), {
        extra: { validationResult },
      });
      return <ErrorPageContent />;
  }
}
