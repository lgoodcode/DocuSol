"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import type { ViewDocument } from "@/lib/supabase/types";
import { getAllStoredDocuments } from "@/lib/utils";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { supabase } from "@/lib/supabase/client";

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
  const { data, error } = await supabase
    .from("documents")
    .select("id,name,password,is_signed,created_at")
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
    createdAt: doc.created_at,
  }));

  return documents;
};

export function ViewContent() {
  const [documents, setDocuments] = useState<ViewDocument[]>([]);
  console.log(documents);
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
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Manage and track your document signatures
        </p>
      </motion.div>
      <DataTable<ViewDocument, ViewDocument>
        columns={columns}
        data={documents}
      />
    </>
  );
}
