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
      className="fixed inset-0 z-50 -top-16 flex items-center justify-center bg-background"
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
          className="relative w-[144px] h-[144px]"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 0, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image
            src="/img/branding/logo.webp"
            alt="DocuSol Logo"
            className="object-contain"
            fill
          />
        </motion.div>
        <motion.div className="h-2 bg-primary/20 rounded-full w-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
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
