"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PenTool } from "lucide-react";

import { SUPPORT_EMAIL, SUPPORT_DISCORD_URL } from "@/constants";

export function DocAlreadySigned({ timestamp }: { timestamp: string }) {
  return (
    <div className="relative overflow-hidden min-h-[calc(100dvh-200px)] flex items-center justify-center">
      <div className="relative mx-auto flex flex-col items-center justify-center max-w-4xl text-center gap-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <PenTool className="h-24 w-24 text-muted-foreground/50 mx-auto" />
          <h1 className="p-2 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 dark:to-primary/50">
            Already signed
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full space-y-8"
        >
          <p className="sm:text-lg max-w-sm md:max-w-lg lg:max-w-xl md:text-xl text-muted-foreground mx-auto">
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
          <p className="sm:text-lg md:text-xl max-w-xl text-muted-foreground mx-auto">
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
              href={SUPPORT_DISCORD_URL}
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
