"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";

import { DataTable } from "./list-docs-data-table";
import { getDocuments } from "./db";

export function ListDocsContent() {
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Documents
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
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
            <DataTable data={documents ?? []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
