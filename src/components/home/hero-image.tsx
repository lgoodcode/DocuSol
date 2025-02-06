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
        className="3xl:-right-[10%] absolute hidden will-change-transform xl:-right-[22%] xl:block 2xl:-right-[13%]"
      >
        <div className="relative z-10 scale-100 p-4 [perspective:2000px] md:scale-[73%] lg:scale-[83%]">
          <motion.div
            className="relative overflow-hidden rounded-xl border border-border/40 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-all duration-700 ease-out before:absolute before:inset-0 before:z-10 before:bg-gradient-to-b before:from-background/10 before:to-background/5"
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
            {/* Preload both images */}
            <link rel="preload" as="image" href="/img/landing/new_doc.webp" />
            <link
              rel="preload"
              as="image"
              href="/img/landing/new_doc_light.webp"
            />
            {/* Render the appropriate image based on theme */}
            {theme === "dark" ? (
              <Image
                src="/img/landing/new_doc.webp"
                alt="DocuSol Dashboard Preview"
                width={923}
                height={766}
                className="relative z-0 w-full object-contain"
                priority
              />
            ) : (
              <Image
                src="/img/landing/new_doc_light.webp"
                alt="DocuSol Dashboard Preview"
                width={923}
                height={766}
                className="relative z-0 w-full object-contain"
                priority
              />
            )}
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
        className="will-change-transform xl:hidden"
      >
        <div className="relative z-10 mx-auto max-w-[960px] px-8 !pt-0 md:p-16">
          <motion.div
            className="relative overflow-hidden rounded-xl border border-border/40 shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-700 ease-out before:absolute before:inset-0 before:z-10 before:bg-gradient-to-b before:from-background/10 before:to-background/5"
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
            {/* Preload both images */}
            <link rel="preload" as="image" href="/img/landing/new_doc.webp" />
            <link
              rel="preload"
              as="image"
              href="/img/landing/new_doc_light.webp"
            />
            {/* Render the appropriate image based on theme */}
            {theme === "dark" ? (
              <Image
                src="/img/landing/new_doc.webp"
                alt="DocuSol Dashboard Preview"
                width={1025}
                height={851}
                className="relative z-0 w-full object-contain"
                priority
              />
            ) : (
              <Image
                src="/img/landing/new_doc_light.webp"
                alt="DocuSol Dashboard Preview"
                width={1025}
                height={851}
                className="relative z-0 w-full object-contain"
                priority
              />
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
