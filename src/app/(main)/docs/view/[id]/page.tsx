import type { Metadata } from "next";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";
import { DocumentNotFound } from "@/components/doc-not-found";
import { ErrorPageContent } from "@/components/error-page-content";

import { ViewDocContent } from "./view-doc-content";

export const metadata: Metadata = {
  title: "View Document",
};

type DocumentViewFetchResult =
  | {
      error?: boolean;
    }
  | DocumentDetails
  | null;

const getDocument = async (hash: string): Promise<DocumentViewFetchResult> => {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .select("*")
    .or(`unsigned_hash.eq.${hash},signed_hash.eq.${hash}`)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(error);
    captureException(error, {
      extra: { hash },
    });
    return {error: true}
  }

  if ((error && error.code === "PGRST116") || !data) {
    return null;
  }

  return {
    ...data,
    password: !!data.password,
  };
};

export default async function ViewDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    return <DocumentNotFound />;
  } else if (document && "error" in document) {
    return <ErrorPageContent />;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <ViewDocContent document={document as DocumentDetails} />
    </div>
  );
}
