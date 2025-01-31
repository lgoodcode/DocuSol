"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { getAllStoredDocuments } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

import { DataTable } from "./list-docs-data-table";

const getDocuments = async (): Promise<ViewDocument[]> => {
  const ids = await getAllStoredDocuments().then((docs) =>
    docs.map((doc) => doc.id)
  );
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select(
      `
      id,
      name,
      password,
      is_signed,
      mime_type,
      unsigned_transaction_signature,
      signed_transaction_signature,
      unsigned_hash,
      signed_hash,
      unsigned_document,
      signed_document,
      created_at,
      updated_at
      `
    )
    .in("id", ids);

  if (error) {
    throw error;
  } else if (!data) {
    return [];
  }

  const documents: ViewDocument[] = data.map((doc) => ({
    id: doc.id,
    name: doc.name,
    password: doc.password,
    status: doc.is_signed ? "signed" : "pending",
    mimeType: doc.mime_type,
    is_signed: doc.is_signed,
    unsignedTxSignature: doc.unsigned_transaction_signature,
    signedTxSignature: doc.signed_transaction_signature,
    unsignedHash: doc.unsigned_hash,
    signedHash: doc.signed_hash,
    unsignedDocumentHex: doc.unsigned_document,
    signedDocumentHex: doc.signed_document,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }));

  return documents;
};

export function ListDocsContent() {
  const [documents, setDocuments] = useState<ViewDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDocuments()
      .then(setDocuments)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Documents
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage and track your document signatures
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <Card>
          <CardContent>
            <DataTable
              data={documents}
              setData={setDocuments}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
