import type { Metadata } from "next";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import { ErrorPageContent } from "@/components/error-page-content";
import { DocumentNotFound } from "@/components/doc-not-found";

import { DocAlreadySigned } from "./already-signed";
import { SignDocumentContent } from "./sign-doc-content";

export const metadata: Metadata = {
  title: "Sign Document",
};

/**
 * This is used server-side to check if already signed prior
 * to sending to the client
 */
type DocumentCheckPriorToSign =
  | null // If null, document not found
  | {
      error: Error;
    }
  | {
      // Need to send just the password so that it can be authenticated
      // prior to retrieving and send the data to the client
      password: string | null;
    }
  | {
      // The document is already signed and we want to inform the user
      // without retrieving the document
      is_signed: boolean;
      signed_at: string;
    }
  | {
      // No password and not signed, so we need to send the document
      document: DocumentToSign;
    };

const getDocument = async (id: string): Promise<DocumentCheckPriorToSign> => {
  const supabase = await createServerClient();
  const { data: initialData, error: intialError } = await supabase
    .from("documents")
    .select("id,password,is_signed,signed_at")
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

  // Check if there's a password and set signed data, if any
  if (initialData.password) {
    return {
      password: initialData.password,
    };
  } else if (initialData.is_signed) {
    return {
      is_signed: true,
      signed_at: initialData.signed_at!,
    };
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
  return {
    document: documentData as DocumentToSign,
  };
};

export default async function SignDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getDocument(id);

  if (data === null) {
    return <DocumentNotFound />;
  } else if ("error" in data) {
    return <ErrorPageContent />;
  } else if ("is_signed" in data) {
    return <DocAlreadySigned timestamp={data.signed_at} />;
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
