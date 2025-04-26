"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TimerOff } from "lucide-react";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";

export function DocumentExpiredPage() {
  const title = "Document Expired";
  const message =
    "This document has expired and can no longer be signed. Please contact the sender if you need access.";

  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <TimerOff className="mx-auto h-24 w-24 text-destructive/80" />
          <h1 className="bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-destructive/50 sm:text-5xl md:text-6xl">
            {title}
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full space-y-8"
        >
          <p className="mx-auto max-w-lg text-muted-foreground sm:text-lg md:text-xl">
            {message}
          </p>
          <p className="mx-auto max-w-xl text-muted-foreground sm:text-lg md:text-xl">
            If you believe this is an error, please contact support via{" "}
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              target="_blank"
              className="text-primary underline"
            >
              {SUPPORT_EMAIL}
            </Link>{" "}
            or via the ticketing system in our{" "}
            <Link
              href={DISCORD_URL}
              target="_blank"
              className="text-primary underline"
            >
              Discord
            </Link>
            .
          </p>
        </motion.div>
      </div>
    </div>
  );
}
