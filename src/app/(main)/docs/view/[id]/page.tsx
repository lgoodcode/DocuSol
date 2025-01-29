import type { Metadata } from "next";
import { captureException } from "@sentry/nextjs";

import type { Document } from "@/lib/supabase/types";
import { createServerClient } from "@/lib/supabase/server";
import { DocumentNotFound } from "@/components/doc-not-found";

import { ViewDocumentContent } from "./content";

export const metadata: Metadata = {
  title: "View Document",
};

const getDocument = async (hash: string): Promise<Document | null> => {
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
  }

  if (error && error.code === "PGRST116") {
    return null;
  }
  return data;
};

export default async function ViewDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getDocument(id);
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {document ? (
        <ViewDocumentContent document={document} />
      ) : (
        <DocumentNotFound />
      )}
    </div>
  );
}
