"use client";

import { motion } from "framer-motion";

export function ComingSoon() {
  return (
    <div className="relative flex min-h-[calc(100dvh-200px)] items-center justify-center overflow-hidden">
      <div className="container relative mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text p-2 text-4xl font-bold tracking-tighter text-transparent dark:to-primary/50 sm:text-5xl md:text-6xl">
            Coming Soon
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          <p className="mx-auto text-muted-foreground sm:text-lg md:text-xl">
            We are working hard to bring you the future of decentralized
            document signing.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
