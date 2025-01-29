import type { Metadata } from "next";
import { captureException } from "@sentry/nextjs";

import { createServerClient } from "@/lib/supabase/server";

import { SignDocumentContent } from "./sign-doc-content";
import { DocumentNotFound } from "./doc-not-found";

export const metadata: Metadata = {
  title: "Sign Document",
};

const getDocument = async (id: string) => {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(error);
    captureException(error, {
      extra: { id },
    });
  }

  if (error && error.code === "PGRST116") {
    return null;
  }
  return data;
};

export default async function SignDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocument(id);
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {document ? (
        <SignDocumentContent id={id} document={document} />
      ) : (
        <DocumentNotFound />
      )}
    </div>
  );
}
