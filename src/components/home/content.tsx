"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InteractiveHoverButton } from "@/components/home/interactive-hover-button";
import { LoadingScreen } from "@/components/home/loading-screen";

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      when: "beforeChildren",
      staggerChildren: 0.3,
    },
  },
};

const childVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export default function HomeContent() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Add this useEffect to manage the state transitions
  useEffect(() => {
    if (!isLoading) {
      // Only show content after loading is complete
      setTimeout(() => {
        setShowContent(true);
      }, 300); // Small delay to ensure smooth transition
    }
  }, [isLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div
            className="flex relative"
            variants={variants}
            initial="hidden"
            animate="visible"
          >
            {/* Background Gradient */}
            <motion.div
              variants={childVariants}
              className="fixed inset-0 bg-gradient-to-br from-background via-background to-background/50 dark:from-background dark:via-background dark:to-background/30 pointer-events-none"
            />
            <motion.div
              variants={childVariants}
              className="fixed inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 dark:from-transparent dark:via-primary/10 dark:to-primary/10 pointer-events-none"
            />

            {/* Main Content */}
            <motion.div
              variants={childVariants}
              className="flex-1 overflow-auto relative"
            >
              <motion.div variants={childVariants} className="relative">
                {/* Hero Section */}
                <section className="relative mx-[120px] grid md:grid-cols-2 min-h-[85vh]">
                  {/* Left Column */}
                  <div className="p-8 md:p-16 flex flex-col relative z-10">
                    <div className="flex items-center mb-4">
                      <Badge>Beta</Badge>
                    </div>

                    {/* Left Column Content */}
                    <motion.div variants={childVariants} className="space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-[76px] h-[76px] flex items-center justify-center">
                          <Image
                            src="/img/docusol_icon.png"
                            alt="DocuSol Logo"
                            width={120}
                            height={48}
                          />
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
                          DocuSol
                        </h1>
                      </div>

                      <p className="text-2xl md:text-3xl text-muted-foreground font-light">
                        A secure document signing and sharing app powered with
                        AI to enhance your personal and business needs with the
                        blockchain
                      </p>

                      <p className="text-muted-foreground text-lg">
                        Generate, sign, and share documents securely on the
                        blockchain. Let AI assist you in creating, reviewing,
                        and managing your documents efficiently.
                      </p>

                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Backed by
                        </p>
                        <div className="flex items-center gap-4">
                          <Image
                            src="/svg/microsoft.svg"
                            alt="Microsoft"
                            width={120}
                            height={48}
                            className="dark:invert"
                          />
                          <span className="text-muted-foreground">•</span>
                          <Image
                            src="/svg/openai.svg"
                            alt="OpenAI"
                            width={120}
                            height={48}
                            className="dark:invert"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/docs/new">
                          <InteractiveHoverButton className="rounded-none text-lg py-5 px-8">
                            Get Started Now
                          </InteractiveHoverButton>
                        </Link>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column - Dashboard Preview */}
                  <motion.div
                    initial={{ opacity: 0, transform: "translateX(100%)" }}
                    animate={{ opacity: 1, transform: "translateX(0)" }}
                    transition={{
                      duration: 1,
                      ease: "easeOut",
                      delay: 1,
                    }}
                    className="absolute -right-[15%] backdrop-blur-sm will-change-transform"
                  >
                    <div className="p-8 md:p-16 relative z-10">
                      <div className="relative rounded-lg overflow-hidden border border-border shadow-2xl">
                        <Image
                          src={
                            theme === "dark"
                              ? "/img/landing/new_document.png"
                              : "/img/landing/new_document_light.png"
                          }
                          alt="DocuSol Dashboard Preview"
                          width={823}
                          height={616}
                          className="object-contain w-full"
                          priority
                        />
                      </div>
                    </div>
                  </motion.div>
                </section>

                {/* What is DocuSol? */}
                <section className="border-t border-border">
                  <h2 className="text-center p-4 text-lg font-semibold border-b border-border">
                    What is DocuSol?
                  </h2>
                  <div className="max-w-2xl mx-auto my-32 text-center px-8">
                    <p className="text-muted-foreground mb-4">DocuSol is</p>
                    <h3 className="text-2xl font-semibold">
                      A revolutionary platform that combines AI-powered document
                      generation with secure blockchain-based signing and
                      sharing capabilities.
                    </h3>
                  </div>
                </section>

                {/* Features */}
                <section className="border-t border-border">
                  <h2 className="text-center p-4 text-lg font-semibold border-b border-border">
                    Key Features
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8 p-8 md:p-16">
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        DocuSol empowers you with
                      </p>
                      <h3 className="text-3xl font-semibold">
                        AI-driven document creation, secure signing, and
                        blockchain-based sharing capabilities.
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="bg-primary/20 p-2 w-fit rounded-lg">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold">AI Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          Create professional documents with AI assistance
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-primary/20 p-2 w-fit rounded-lg">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold">Secure Signing</h4>
                        <p className="text-sm text-muted-foreground">
                          Sign documents with advanced security measures
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-primary/20 p-2 w-fit rounded-lg">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold">Blockchain Storage</h4>
                        <p className="text-sm text-muted-foreground">
                          Store and share documents on the blockchain
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-primary/20 p-2 w-fit rounded-lg">
                          <svg
                            className="w-6 h-6 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                            />
                          </svg>
                        </div>
                        <h4 className="font-semibold">AI Assistant</h4>
                        <p className="text-sm text-muted-foreground">
                          Get help with document review and management
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Call To Action */}
                <section className="border-t border-border">
                  <div className="min-h-[50vh] flex items-center justify-center p-8">
                    <div className="text-center space-y-8">
                      <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
                        Start Securing Your Documents Today
                      </h2>
                      <p className="text-xl text-muted-foreground">
                        Join thousands of professionals who trust DocuSol for
                        their document needs
                      </p>
                      <Link href="/docs/new">
                        <Button
                          size="lg"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          Get Started Free
                        </Button>
                      </Link>
                    </div>
                  </div>
                </section>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
