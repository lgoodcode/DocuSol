"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PenTool } from "lucide-react";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";

export function DocAlreadySigned({ timestamp }: { timestamp: string }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div className="relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <PenTool className="mx-auto h-24 w-24 text-muted-foreground/50" />
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-primary/50 sm:text-5xl md:text-6xl">
            Already signed
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full space-y-8"
        >
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            This document was already signed on{" "}
            {new Date(timestamp).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="mx-auto max-w-xl text-muted-foreground sm:text-lg md:text-xl">
            If this was a mistake, please contact support via{" "}
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
