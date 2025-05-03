"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, Link2Off } from "lucide-react";

import { SUPPORT_EMAIL, DISCORD_URL } from "@/constants";

import { InvalidTokenReason } from "./utils";

interface InvalidTokenPageProps {
  reason: InvalidTokenReason;
}

export function InvalidTokenPage({ reason }: InvalidTokenPageProps) {
  let title = "Invalid Link";
  let message = "This document signing link is invalid.";
  let Icon = Link2Off;
  let iconColor = "text-destructive/80"; // Default destructive color

  switch (reason) {
    case "expired":
      title = "Link Expired";
      message =
        "This document signing link has expired. Please request a new link from the sender.";
      Icon = AlertTriangle;
      iconColor = "text-yellow-500/80"; // Warning color
      break;
    case "used":
      title = "Link Already Used";
      message =
        "This document signing link has already been used to sign the document.";
      Icon = AlertTriangle;
      iconColor = "text-yellow-500/80"; // Warning color
      break;
    case "mismatch":
      title = "Invalid Link";
      message =
        "This signing link does not correspond to the requested document.";
      // Icon and color remain default (XCircle, destructive)
      break;
    case "unknown": // Fallback for general invalidity
    default:
      // Keep default message, icon, and color
      break;
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
          <Icon className={`mx-auto h-24 w-24 ${iconColor}`} />
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
