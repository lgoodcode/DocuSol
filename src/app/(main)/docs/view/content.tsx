"use client";

import { motion } from "framer-motion";

import type { Document } from "@/types/document";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const documents: Document[] = [
  {
    id: "1",
    name: "Contract-2024.pdf",
    createdAt: "2024-01-15T09:24:00Z",
    expiresAt: "2024-02-15T09:24:00Z",
    status: "pending",
    password: "123456",
    size: 1240000,
  },
  {
    id: "2",
    name: "Agreement.pdf",
    createdAt: "2024-01-14T15:30:00Z",
    expiresAt: null,
    status: "signed",
    password: null,
    size: 890000,
  },
  {
    id: "3",
    name: "NDA-2023.pdf",
    createdAt: "2023-12-20T11:00:00Z",
    expiresAt: "2024-01-20T11:00:00Z",
    status: "expired",
    password: "123456",
    size: 450000,
  },
];

export function ViewContent() {
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
      <DataTable columns={columns} data={documents} />
    </>
  );
}
