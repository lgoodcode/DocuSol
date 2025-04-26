"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PAGE_PATHS } from "@/config/routes/pages";

export function DocumentNotFound() {
  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div className="container relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <SearchX className="mx-auto h-24 w-24 text-muted-foreground/50" />
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-primary/50 sm:text-5xl md:text-6xl">
            Document not found
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full space-y-8"
        >
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            The document you are looking for doesn&apos;t exist or has been
            removed.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Link href={PAGE_PATHS.DOCS.LIST}>
            <Button size="lg" variant="outline" className="mt-4 block">
              Go to Documents
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
