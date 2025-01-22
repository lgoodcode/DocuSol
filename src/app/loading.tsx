"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1],
        repeat: Infinity,
      }}
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
          className="relative w-[120px] h-[120px]"
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
            src="/img/docusol_icon.png"
            alt="DocuSol Logo"
            fill
            className="object-contain"
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
