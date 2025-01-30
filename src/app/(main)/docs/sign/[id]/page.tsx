import type { Metadata } from "next";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import { ErrorPage } from "@/components/error-page";
import { DocumentNotFound } from "@/components/doc-not-found";

import { SignDocumentContent } from "./sign-doc-content";

export const metadata: Metadata = {
  title: "Sign Document",
};

type DocumentData =
  | {
      error: Error;
    }
  | {
      document: DocumentToSign | null;
      password: string | null;
    };

const getDocument = async (id: string): Promise<DocumentData | null> => {
  const supabase = await createServerClient();
  const { data: initialData, error: intialError } = await supabase
    .from("documents")
    .select("id,password")
    .eq("id", id)
    .single();

  if (intialError) {
    if (intialError.code !== "PGRST116") {
      console.error(intialError);
      captureException(intialError, {
        extra: { id },
      });
      return null;
    }
    return { error: intialError };
  }

  // Check if there's a password
  if (initialData.password) {
    return { document: null, password: initialData.password };
  }

  const { data: documentData, error: documentError } = await supabase
    .from("documents")
    .select("id,mime_type,unsigned_document")
    .eq("id", id)
    .single();

  if (documentError) {
    if (documentError.code !== "PGRST116") {
      console.error(documentError);
      captureException(documentError, {
        extra: { id },
      });
      return null;
    }
    return { error: documentError };
  }
  return { document: documentData as DocumentToSign, password: null };
};

export default async function SignDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDocument(id);

  if (!data) {
    return <DocumentNotFound />;
    // @ts-expect-error - data is not null
  } else if (data.error) {
    return <ErrorPage />;
  }

  // @ts-expect-error - data is not null
  const { document, password } = data;
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <SignDocumentContent
        id={id}
        docDocument={document}
        docPassword={password}
      />
    </div>
  );
}
