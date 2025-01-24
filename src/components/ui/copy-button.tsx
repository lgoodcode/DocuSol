"use client";

import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy } from "lucide-react";

export const CopyButton = forwardRef(
  ({ value, noStyle }: { value: string; noStyle?: boolean }, ref) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button
        ref={ref as React.RefObject<HTMLButtonElement>}
        onClick={handleCopy}
        className={
          noStyle ? "" : "p-2 bg-transparent hover:bg-transparent rounded-md"
        }
        aria-label={copied ? "Copied!" : "Copy to clipboard"}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={copied ? "check" : "copy"}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </motion.div>
        </AnimatePresence>
      </button>
    );
  }
);

CopyButton.displayName = "CopyButton";
