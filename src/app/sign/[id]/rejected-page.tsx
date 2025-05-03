"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { FileX2 } from "lucide-react";

interface DocumentRejectedPageProps {
  rejectedAt: string | null;
}

export function DocumentRejectedPage({
  rejectedAt,
}: DocumentRejectedPageProps) {
  const title = "Document Rejected";
  let message = "This document has been rejected and cannot be signed.";

  if (rejectedAt) {
    try {
      const rejectedDate = new Date(rejectedAt);
      const timeAgo = formatDistanceToNow(rejectedDate, { addSuffix: true });
      message = `This document was rejected ${timeAgo} and cannot be signed.`;
    } catch (e) {
      console.error("Error formatting rejected date:", e);
      // Keep default message if formatting fails
    }
  }

  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div className="container relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <FileX2 className="mx-auto h-24 w-24 text-destructive/80" />
          <h1 className="p-2 text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            {title}
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full space-y-8"
        >
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            {message}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
