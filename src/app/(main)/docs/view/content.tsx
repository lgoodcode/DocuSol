"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { getAllStoredDocuments, hexToBuffer } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

import { DataTable } from "./data-table";

// const documents: Document[] = [
//   {
//     id: "1",
//     name: "Contract-2024.pdf",
//     createdAt: "2024-01-15T09:24:00Z",
//     expiresAt: "2024-02-15T09:24:00Z",
//     status: "pending",
//     password: "123456",
//     size: 1240000,
//   },
//   {
//     id: "2",
//     name: "Agreement.pdf",
//     createdAt: "2024-01-14T15:30:00Z",
//     expiresAt: null,
//     status: "signed",
//     password: null,
//     size: 890000,
//   },
//   {
//     id: "3",
//     name: "NDA-2023.pdf",
//     createdAt: "2023-12-20T11:00:00Z",
//     expiresAt: "2024-01-20T11:00:00Z",
//     status: "expired",
//     password: "123456",
//     size: 450000,
//   },
// ];

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
    unsignedDocument: hexToBuffer(doc.unsigned_document),
    signedDocument: doc.signed_document
      ? hexToBuffer(doc.signed_document)
      : null,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }));

  return documents;
};

export function ViewContent() {
  const [documents, setDocuments] = useState<ViewDocument[]>([]);

  useEffect(() => {
    getDocuments().then((docs) => setDocuments(docs));
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
            <DataTable data={documents} setData={setDocuments} />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
