"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface LoadingScreenProps {
  onAnimationComplete?: () => void;
}

export function LoadingScreen({ onAnimationComplete }: LoadingScreenProps) {
  return (
    <motion.div
      // -top-16 to account for the content height to truly center
      className="fixed inset-0 -top-16 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      onAnimationComplete={onAnimationComplete}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.5,
          scale: { duration: 0.6 },
          opacity: { duration: 0.6 },
        }}
        className="flex flex-col items-center space-y-4"
      >
        <motion.div
          className="relative h-[144px] w-[144px]"
          animate={{
            scale: [1, 0.9, 1],
            rotate: [0, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/img/branding/icon_100x100.webp"
            alt="DocuSol Logo"
            className="object-contain"
            fill
            priority
          />
        </motion.div>
        <motion.div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
