"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function HeroImage({ theme }: { theme: string }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: "100%", scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: 1,
        }}
        className="hidden xl:block absolute xl:-right-[22%] 2xl:-right-[13%] 3xl:-right-[10%] will-change-transform"
      >
        <div className="p-4 md:p-16 relative z-10 [perspective:2000px]">
          <motion.div
            className="
              relative rounded-xl overflow-hidden
              border border-border/40
              shadow-[0_20px_50px_rgba(0,0,0,0.2)]
              transition-all duration-700 ease-out
              backdrop-blur-sm
              before:absolute before:inset-0 before:bg-gradient-to-b before:from-background/10 before:to-background/5 before:z-10
            "
            initial={{
              rotateX: 0,
              rotateZ: -15,
            }}
            animate={{
              rotateX: 12,
              rotateZ: -5,
            }}
            transition={{
              duration: 1.2,
              ease: [0.4, 0, 0.2, 1],
              delay: 1.3,
            }}
          >
            <Image
              src={
                theme === "dark"
                  ? "/img/landing/new_document.webp"
                  : "/img/landing/new_document_light.webp"
              }
              alt="DocuSol Dashboard Preview"
              width={823}
              height={616}
              className="object-contain w-full relative z-0"
              priority
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile version of hero image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
          delay: 1,
        }}
        className="xl:hidden will-change-transform"
      >
        <div className="px-8 !pt-0 md:p-16 max-w-[960px] mx-auto relative z-10">
          <motion.div
            className="
              relative rounded-xl overflow-hidden
              border border-border/40
              shadow-[0_10px_30px_rgba(0,0,0,0.15)]
              transition-all duration-700 ease-out
              before:absolute before:inset-0 before:bg-gradient-to-b before:from-background/10 before:to-background/5 before:z-10
            "
            initial={{
              rotateX: 12,
              rotateZ: -5,
              perspective: 1000,
            }}
            animate={{
              rotateX: 0,
              rotateZ: 0,
              perspective: 0,
            }}
            transition={{
              duration: 1.4,
              ease: [0.4, 0, 0.2, 1],
              delay: 1.3,
            }}
          >
            <Image
              src={
                theme === "dark"
                  ? "/img/landing/small_new_document.webp"
                  : "/img/landing/small_new_document_light.webp"
              }
              alt="DocuSol Dashboard Preview"
              width={823}
              height={616}
              className="object-contain w-full relative z-0"
              priority
            />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
