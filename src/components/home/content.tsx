"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useTheme } from "next-themes";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Bolt, Bot, Lock } from "lucide-react";

import { heroDescription } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/home/footer";
import { InteractiveHoverButton } from "@/components/home/interactive-hover-button";
import { LoadingScreen } from "@/components/home/loading-screen";
import { HeroImage } from "@/components/home/hero-image";
import { MarqueeImages } from "@/components/home/marquee-images";
import { Boxes } from "@/components/home/background-boxes";
import { DockerContainer } from "@/components/home/docker";

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
          className="relative flex max-w-[100vw]"
          initial="hidden"
          animate="visible"
          variants={contentVariants}
        >
          {/* Background Elements */}
          <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-background via-background to-background/50 dark:from-background dark:via-background dark:to-background/20" />
          <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 dark:from-transparent dark:via-primary/[0.03] dark:to-primary/[0.05]" />
          <div className="pointer-events-none fixed inset-0 h-full w-full bg-transparent opacity-[0.23]">
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
            className="relative flex-1 overflow-auto"
          >
            <motion.div
              variants={childVariants}
              className="max-w-screen relative overflow-hidden"
            >
              {/* Hero Section */}
              <section className="relative mx-auto grid min-h-[85dvh] max-w-[1720px] grid-cols-1 xl:grid-cols-2">
                {/* Left Column */}
                <div className="relative z-10 flex flex-col gap-3 px-8 py-12 !pb-28 pt-28 md:px-16 md:pt-20 lg:px-32 xl:p-36 xl:pr-16 xl:pt-24 2xl:p-24">
                  <div className="mb-2 flex items-center md:mb-0">
                    <Badge>Beta</Badge>
                  </div>

                  {/* Left Column Content */}
                  <motion.div variants={childVariants} className="space-y-8">
                    <div className="flex items-center">
                      <div className="flex h-[128px] items-center justify-center">
                        {/* Preload both images */}
                        <link
                          rel="preload"
                          as="image"
                          href="/img/branding/logo_full_light_1694x432.png"
                        />
                        <link
                          rel="preload"
                          as="image"
                          href="/img/branding/logo_full_dark_1694x432.png"
                        />
                        {/* Render the appropriate image based on theme */}
                        {theme === "dark" ? (
                          <Image
                            src="/img/branding/logo_full_light_1694x432.png"
                            alt="DocuSol Logo"
                            width={1694}
                            height={432}
                            className="h-full w-full object-contain"
                            priority
                          />
                        ) : (
                          <Image
                            src="/img/branding/logo_full_dark_1694x432.png"
                            alt="DocuSol Logo"
                            width={1694}
                            height={432}
                            className="h-full w-full object-contain"
                            priority
                          />
                        )}
                      </div>

                      {/* Old */}
                      {/* <div className="flex h-[64px] w-[64px] items-center justify-center md:h-[92px] md:w-[92px] xl:h-[120px] xl:w-[120px]">
                        <Image
                          src="/img/branding/logo.webp"
                          alt="DocuSol Logo"
                          width={500}
                          height={500}
                          className="h-full w-full object-contain"
                          priority
                        />
                      </div>
                      <h1 className="bg-gradient-to-br from-primary to-black/45 bg-clip-text text-5xl font-bold text-transparent dark:to-primary-foreground lg:text-7xl">
                        DocuSol
                      </h1> */}
                    </div>

                    <p className="text-xl font-light text-muted-foreground md:text-3xl">
                      {heroDescription}
                    </p>

                    <p className="text-base text-muted-foreground md:text-lg">
                      Upload your documents, to share, sign, and have file
                      hashes of signed documents stored on the blockchain, where
                      it is immutable and tamper-proof.
                    </p>

                    {/* Replace with something here? */}
                    {/* <PoweredByLogos /> */}

                    <div className="flex flex-col gap-4 sm:flex-row">
                      <Link href="/docs/new">
                        <InteractiveHoverButton className="rounded-none px-6 py-4 text-lg">
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
                className="relative my-24 border-t border-border lg:top-16"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-200px" }}
              >
                <h2 className="border-b border-border p-4 text-center text-4xl font-semibold">
                  What is DocuSol?
                </h2>
                <div className="mx-auto my-24 max-w-2xl px-8 pb-24 text-center">
                  <h3 className="text-2xl font-semibold">
                    A simple and secure platform that gives you decentralized
                    signatures, allowing you to self-verify signed documents
                    integrity on the blockchain.
                  </h3>
                </div>
              </motion.section>

              {/* Features */}
              <motion.section
                id="features"
                className="my-24 border-t border-border lg:my-64"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                <h2 className="border-b border-border p-4 text-center text-2xl font-semibold md:text-4xl">
                  Key Features
                </h2>
                <div className="grid gap-8 p-8 md:grid-cols-2 md:p-16 lg:px-32 2xl:px-64">
                  <div className="space-y-4">
                    <p className="text-lg text-muted-foreground">
                      DocuSol empowers you with
                    </p>
                    <h3 className="text-3xl font-semibold">
                      Secure decentralized and transparent signatures
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="w-fit rounded-lg bg-primary/20 p-2">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">AI Generation</h4>
                      <p className="text-sm text-muted-foreground">
                        Create professional documents with AI assistance
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-fit rounded-lg bg-primary/20 p-2">
                        <Lock className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Secure Signing</h4>
                      <p className="text-sm text-muted-foreground">
                        Sign documents with advanced security measures
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-fit rounded-lg bg-primary/20 p-2">
                        <Bolt className="h-6 w-6 text-primary" />
                      </div>
                      <h4 className="font-semibold">Blockchain Transparency</h4>
                      <p className="text-sm text-muted-foreground">
                        Files hashes of signed documents are stored on the
                        blockchain, tamper-proof and immutable.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="w-fit rounded-lg bg-primary/20 p-2">
                        <svg
                          className="h-6 w-6 text-primary"
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
              <section className="mb-12 mt-24">
                <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden border-b border-t border-border bg-transparent">
                  <MarqueeImages theme={theme} />

                  {/* Left gradient overlay */}
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-[9%] bg-gradient-to-r from-background via-background/80 to-transparent dark:from-background/95 dark:via-background/75 dark:to-transparent sm:w-1/6 md:w-1/4 xl:w-1/4"></div>

                  {/* Right gradient overlay */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-[9%] bg-gradient-to-l from-background via-background/80 to-transparent dark:from-background/95 dark:via-background/75 dark:to-transparent sm:w-1/6 md:w-1/4 xl:w-1/4"></div>
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
                <div className="flex min-h-[50vh] items-center justify-center p-8">
                  <div className="text-center">
                    <h2 className="mx-auto mb-2 h-32 max-w-md bg-gradient-to-br from-primary to-black/45 bg-clip-text text-4xl font-bold text-transparent dark:to-primary-foreground sm:h-24 md:mb-10 md:text-5xl xl:h-16 xl:max-w-none">
                      Start Securing Your Documents Today
                    </h2>
                    <div className="flex flex-col gap-6">
                      <p className="text-xl font-medium text-muted-foreground">
                        Sign your documents and have the integrity of those
                        signatures stored on the blockchain.
                      </p>
                      <Link href="/docs/new">
                        <Button
                          size="lg"
                          className="mx-auto w-fit bg-primary text-lg font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl"
                        >
                          Try it out now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Footer */}
              <motion.footer
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
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
