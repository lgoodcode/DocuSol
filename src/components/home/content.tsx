"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useTheme } from "next-themes";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Bolt, Bot, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/home/footer";
import { InteractiveHoverButton } from "@/components/home/interactive-hover-button";
import { LoadingScreen } from "@/components/home/loading-screen";
import { HeroImage } from "@/components/home/hero-image";
import { Marquee } from "@/components/ui/marquee";
import { Boxes } from "@/components/home/background-boxes";
import { DockerContainer } from "@/components/home/docker";
import { PoweredByLogos } from "@/components/home/powered-by-logos";

const contentVariants = {
  hidden: {
    opacity: 0,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 1.2,
      ease: [0.4, 0, 0.2, 1],
      when: "beforeChildren",
      staggerChildren: 0.3,
    },
  },
};

const childVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const loadingScreenVariants = {
  visible: {
    opacity: 1,
    transition: { duration: 0 },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

const sectionVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: { duration: 0 },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export function HomeContent() {
  const { theme = "dark" } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const contentControls = useAnimationControls();

  useEffect(() => {
    // Initial loading screen duration
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(loadingTimer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Start showing content AFTER loading screen exit animation completes
      const startContentTimer = setTimeout(() => {
        setShowContent(true);
      }, 100); // Match loading screen exit duration

      return () => clearTimeout(startContentTimer);
    }
  }, [isLoading]);

  return (
    <>
      {/* Root layout component cannot be a client component - just copy pasta */}
      <ProgressBar
        height="3px"
        color={theme === "dark" ? "#fff" : "#000"}
        options={{
          showSpinner: false,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Loading Screen with fixed position */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            variants={loadingScreenVariants}
            initial="visible"
            exit="exit"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      {showContent && (
        <motion.div
          className="flex relative max-w-[100vw]"
          initial="hidden"
          animate="visible"
          variants={contentVariants}
        >
          {/* Background Elements */}
          <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-background/50 dark:from-background dark:via-background dark:to-background/20 pointer-events-none" />
          <div className="fixed inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 dark:from-transparent dark:via-primary/[0.03] dark:to-primary/[0.05] pointer-events-none" />
          <div className="fixed inset-0 w-full h-full opacity-[0.23] bg-transparent pointer-events-none">
            <Boxes />
          </div>

          <motion.div
            variants={contentVariants}
            initial="initial"
            animate={contentControls}
          >
            <DockerContainer delay={0.5} />
          </motion.div>

          {/* Main Content */}
          <motion.div
            variants={childVariants}
            className="flex-1 overflow-auto relative"
          >
            <motion.div
              variants={childVariants}
              className="relative max-w-screen overflow-hidden"
            >
              {/* Hero Section */}
              <section className="relative max-w-[1720px] mx-auto grid grid-cols-1 xl:grid-cols-2 min-h-[100vh]">
                {/* Left Column */}
                <div className="px-8 md:px-16 py-12 pt-28 md:pt-20 lg:px-32 !pb-28 xl:p-36 xl:pt-24 xl:pr-16 2xl:p-24 flex flex-col relative z-10">
                  <div className="flex items-center mb-6">
                    <Badge>Beta</Badge>
                  </div>

                  {/* Left Column Content */}
                  <motion.div variants={childVariants} className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-[64px] h-[64px] md:w-[92px] md:h-[92px] xl:w-[108px] xl:h-[108px] flex items-center justify-center">
                        <Image
                          src="/img/docusol_icon.webp"
                          alt="DocuSol Logo"
                          width={120}
                          height={48}
                          className="w-full h-full object-contain"
                          priority
                        />
                      </div>
                      <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-br from-primary to-black/45 dark:to-primary-foreground bg-clip-text text-transparent">
                        DocuSol
                      </h1>
                    </div>

                    <p className="text-xl md:text-3xl text-muted-foreground font-light">
                      A secure document signing and sharing app powered with AI
                      to enhance your personal and business needs with the
                      blockchain
                    </p>

                    <p className="text-base md:text-lg text-muted-foreground">
                      Generate, sign, and share documents securely on the
                      blockchain. Let AI assist you in creating, reviewing, and
                      managing your documents efficiently.
                    </p>

                    <PoweredByLogos />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link href="/docs/new">
                        <InteractiveHoverButton className="w-full sm:w-auto rounded-none text-base lg:text-lg py-3 lg:py-4 px-4 lg:px-6">
                          Get Started Now
                        </InteractiveHoverButton>
                      </Link>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column - Dashboard Preview Images */}
                <HeroImage theme={theme} />
              </section>

              {/* What is DocuSol? */}
              <motion.section
                className="relative my-24 lg:top-16 border-t border-border"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="text-center p-4 text-4xl font-semibold border-b border-border">
                  What is DocuSol?
                </h2>
                <div className="max-w-2xl mx-auto my-24 pb-24 text-center px-8">
                  <h3 className="text-2xl font-semibold">
                    A revolutionary platform that combines AI-powered document
                    generation with secure blockchain-based signing and sharing
                    capabilities.
                  </h3>
                </div>
              </motion.section>

              {/* Features */}
              <motion.section
                id="features"
                className="border-t border-border my-24 lg:my-64"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="text-center p-4 text-2xl md:text-4xl font-semibold border-b border-border">
                  Key Features
                </h2>
                <div className="grid md:grid-cols-2 gap-8 p-8 md:p-16 lg:px-32 2xl:px-64">
                  <div className="space-y-4">
                    <p className="text-lg text-muted-foreground">
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
                        <Bot className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">AI Generation</h4>
                      <p className="text-sm text-muted-foreground">
                        Create professional documents with AI assistance
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-primary/20 p-2 w-fit rounded-lg">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Secure Signing</h4>
                      <p className="text-sm text-muted-foreground">
                        Sign documents with advanced security measures
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-primary/20 p-2 w-fit rounded-lg">
                        <Bolt className="w-6 h-6 text-primary" />
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
              </motion.section>

              {/* Marquee */}
              <section className="mt-24 mb-12">
                <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden border-t border-b border-border bg-transparent">
                  <Marquee className="[--duration:20s] p-0">
                    {[
                      "/img/landing/dashboard.webp",
                      "/img/landing/documents.webp",
                      "/img/landing/new_document.webp",
                    ].map((src) => (
                      <Image
                        key={src}
                        src={src}
                        alt="DocuSol images"
                        width={823}
                        height={616}
                        className="relative z-0 w-full object-contain"
                      />
                    ))}
                  </Marquee>

                  {/* Left gradient overlay */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-[9%] sm:w-1/6 md:w-1/4 xl:w-1/4 bg-gradient-to-r from-background via-background/80 to-transparent dark:from-background/95 dark:via-background/75 dark:to-transparent"></div>

                  {/* Right gradient overlay */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-[9%] sm:w-1/6 md:w-1/4 xl:w-1/4 bg-gradient-to-l from-background via-background/80 to-transparent dark:from-background/95 dark:via-background/75 dark:to-transparent"></div>
                </div>
              </section>

              {/* Call To Action */}
              <motion.section
                className="py-12"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="min-h-[50vh] flex items-center justify-center p-8">
                  <div className="text-center">
                    <h2 className="max-w-md mx-auto mb-2 md:mb-10 h-32 sm:h-24 xl:h-16 xl:max-w-none text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-black/45 dark:to-primary-foreground bg-clip-text text-transparent">
                      Start Securing Your Documents Today
                    </h2>
                    <div className="flex flex-col gap-6">
                      <p className="text-xl text-muted-foreground font-medium">
                        Build your documents with AI and sign them on the
                        blockchain
                      </p>
                      <Button
                        size="lg"
                        className="w-fit mx-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl"
                      >
                        Try it out now
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Footer */}
              <motion.footer
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <Footer />
              </motion.footer>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
