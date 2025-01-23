"use client";

import { motion } from "framer-motion";

export function ComingSoon() {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-200px)] flex items-center justify-center">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

      <div className="relative container mx-auto flex flex-col items-center justify-center max-w-4xl text-center gap-4 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="p-2 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 dark:to-primary/50">
            Coming Soon
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          <p className="sm:text-lg md:text-xl text-muted-foreground mx-auto">
            We are working hard to bring you the future of decentralized
            document signing powered by Solana and AI.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
