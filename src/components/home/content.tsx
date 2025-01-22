"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { Bolt, Bot, Lock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InteractiveHoverButton } from "@/components/home/interactive-hover-button";
import { LoadingScreen } from "@/components/home/loading-screen";
import { Marquee } from "@/components/ui/marquee";
import { Boxes } from "@/components/home/background-boxes";
import { Docker } from "@/components/home/dock";

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
    }, 1500);

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
      {/* Root layout component cannot be a client component - just copy pasta */}
      <ProgressBar
        height="2px"
        color={theme === "dark" ? "#fff" : "#000"}
        options={{
          showSpinner: false,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      <AnimatePresence>
        {showContent && (
          <motion.div
            className="flex relative max-w-[100vw]"
            variants={variants}
            initial="hidden"
            animate="visible"
          >
            {/* Background Gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-background via-background to-background/50 dark:from-background dark:via-background dark:to-background/20 pointer-events-none" />
            <div className="fixed inset-0 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 dark:from-transparent dark:via-primary/[0.03] dark:to-primary/[0.05] pointer-events-none" />
            <div className="fixed inset-0 w-full h-full opacity-[0.23] bg-transparent pointer-events-none">
              <Boxes />
            </div>

            {/* <div className="fixed bottom-0 left-0 w-full h-full z-50 pointer-events-none">
              <Docker />
            </div> */}

            {/* Main Content */}
            <motion.div
              variants={childVariants}
              className="flex-1 overflow-auto relative"
            >
              <motion.div
                variants={childVariants}
                className="relative max-w-screen overflow-x-hidden"
              >
                {/* Hero Section */}
                <section className="relative max-w-[1720px] mx-auto grid grid-cols-1 xl:grid-cols-2 min-h-[100vh]">
                  {/* Left Column */}
                  <div className="px-36 py-12 pt-24 !pb-28 xl:p-36 xl:pr-16 2xl:p-24 flex flex-col relative z-10">
                    <div className="flex items-center mb-4">
                      <Badge>Beta</Badge>
                    </div>

                    {/* Left Column Content */}
                    <motion.div
                      variants={childVariants}
                      className="space-y-6 lg:space-y-8"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-[50px] h-[50px] md:w-[76px] md:h-[76px] flex items-center justify-center">
                          <Image
                            src="/img/docusol_icon.png"
                            alt="DocuSol Logo"
                            width={120}
                            height={48}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <h1 className="text-3xl md:text-5xl lg:text-7xl font-bold bg-gradient-to-br from-primary to-primary-foreground bg-clip-text text-transparent">
                          DocuSol
                        </h1>
                      </div>

                      <p className="text-xl md:text-3xl text-muted-foreground font-light">
                        A secure document signing and sharing app powered with
                        AI to enhance your personal and business needs with the
                        blockchain
                      </p>

                      <p className="text-base md:text-lg text-muted-foreground">
                        Generate, sign, and share documents securely on the
                        blockchain. Let AI assist you in creating, reviewing,
                        and managing your documents efficiently.
                      </p>

                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Powered by
                        </p>
                        <div className="flex items-center gap-4">
                          {/* Vercel */}
                          <div className="w-24 lg:w-32">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 512 116" // Adjusted viewBox to match actual content height
                              preserveAspectRatio="xMidYMid"
                            >
                              <g>
                                <path
                                  d="M255.420487,28.975665 C235.427278,28.975665 221.011885,42.0147142 221.011885,61.5732881 C221.011885,81.1318619 237.238257,94.1709111 257.231466,94.1709111 C269.310696,94.1709111 279.959253,89.3899264 286.551217,81.3310696 L272.697227,73.3265422 C269.039049,77.3288059 263.479344,79.6649689 257.231466,79.6649689 C248.556876,79.6649689 241.186191,75.1375212 238.451613,67.893605 L289.195246,67.893605 C289.593662,65.8653084 289.829089,63.7645727 289.829089,61.5551783 C289.829089,42.0147142 275.413696,28.975665 255.420487,28.975665 Z M238.288625,55.2348613 C240.552349,48.0090549 246.745897,43.4634975 255.402377,43.4634975 C264.076967,43.4634975 270.270515,48.0090549 272.516129,55.2348613 L238.288625,55.2348613 L238.288625,55.2348613 Z M450.426712,28.975665 C430.433503,28.975665 416.01811,42.0147142 416.01811,61.5732881 C416.01811,81.1318619 432.244482,94.1709111 452.237691,94.1709111 C464.316921,94.1709111 474.965478,89.3899264 481.557442,81.3310696 L467.703452,73.3265422 C464.045274,77.3288059 458.485569,79.6649689 452.237691,79.6649689 C443.563101,79.6649689 436.192417,75.1375212 433.457838,67.893605 L484.201471,67.893605 C484.599887,65.8653084 484.835314,63.7645727 484.835314,61.5551783 C484.835314,42.0147142 470.419921,28.975665 450.426712,28.975665 L450.426712,28.975665 Z M433.31296,55.2348613 C435.576684,48.0090549 441.770232,43.4634975 450.426712,43.4634975 C459.101302,43.4634975 465.29485,48.0090549 467.540464,55.2348613 L433.31296,55.2348613 Z M362.630447,61.5732881 C362.630447,72.4391624 369.729485,79.6830787 380.740238,79.6830787 C388.201471,79.6830787 393.797397,76.2965478 396.676853,70.7730617 L410.585173,78.7956989 C404.826259,88.3938879 394.032824,94.1709111 380.740238,94.1709111 C360.728919,94.1709111 346.331636,81.1318619 346.331636,61.5732881 C346.331636,42.0147142 360.747029,28.975665 380.740238,28.975665 C394.032824,28.975665 404.808149,34.7526882 410.585173,44.3508772 L396.676853,52.3735144 C393.797397,46.8500283 388.201471,43.4634975 380.740238,43.4634975 C369.747595,43.4634975 362.630447,50.7074137 362.630447,61.5732881 Z M512,9.0548953 L512,92.3599321 L495.701188,92.3599321 L495.701188,9.0548953 L512,9.0548953 Z M66.9156763,-1.42108547e-14 L133.831353,115.90266 L0,115.90266 L66.9156763,-1.42108547e-14 Z M234.213922,9.0548953 L184.031692,95.9818902 L133.849462,9.0548953 L152.665535,9.0548953 L184.031692,63.3842671 L215.397849,9.0548953 L234.213922,9.0548953 Z M340.898698,30.786644 L340.898698,48.3350311 C339.087719,47.8098472 337.168081,47.4476514 335.103565,47.4476514 C324.581777,47.4476514 316.993775,54.6915676 316.993775,65.557442 L316.993775,92.3599321 L300.694963,92.3599321 L300.694963,30.786644 L316.993775,30.786644 L316.993775,47.4476514 C316.993775,38.2478778 327.696661,30.786644 340.898698,30.786644 Z"
                                  fill={
                                    theme === "dark"
                                      ? "rgba(255, 255, 255, 0.25)"
                                      : "#000"
                                  }
                                  fillRule="nonzero"
                                />
                              </g>
                            </svg>
                          </div>
                          <span className="text-muted-foreground">•</span>
                          <Image
                            src="/svg/microsoft.svg"
                            alt="Microsoft"
                            width={100}
                            height={40}
                            className="dark:invert w-24 lg:w-32"
                          />
                          <span className="text-muted-foreground">•</span>
                          <Image
                            src="/svg/openai.svg"
                            alt="OpenAI"
                            width={100}
                            height={40}
                            className="dark:invert w-24 lg:w-32"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link href="/docs/new">
                          <InteractiveHoverButton className="w-full sm:w-auto rounded-none text-base lg:text-lg py-3 lg:py-4 px-4 lg:px-6">
                            Get Started Now
                          </InteractiveHoverButton>
                        </Link>
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column - Dashboard Preview */}
                  <motion.div
                    initial={{ opacity: 0, x: "100%", scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{
                      duration: 0.7,
                      ease: "easeOut",
                      delay: 1,
                    }}
                    className="hidden xl:block absolute xl:-right-[22%] 2xl:-right-[13%] 3xl:-right-[10%] backdrop-blur-sm will-change-transform"
                  >
                    <div className="p-4 md:p-16 relative z-10 [perspective:2000px]">
                      <motion.div
                        className="
        relative rounded-xl overflow-hidden
        border border-border/40
        shadow-[0_20px_50px_rgba(0,0,0,0.2)]
        transition-all duration-700 ease-out
        backdrop-blur-sm
        hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)]
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
                        whileHover={{
                          rotateX: 10,
                          rotateZ: -3,
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
                              ? "/img/landing/new_document.png"
                              : "/img/landing/new_document_light.png"
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
                    className="xl:hidden backdrop-blur-sm will-change-transform"
                  >
                    <div className="px-4 !pt-0 md:p-16 max-w-[960px] mx-auto relative z-10">
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
                              ? "/img/landing/small_new_document.png"
                              : "/img/landing/small_new_document_light.png"
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
                </section>

                {/* What is DocuSol? */}
                <section className="mt-24 border-t border-border">
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
                </section>

                {/* Marquee */}
                <section className="mt-24 mb-12">
                  <div className="relative flex h-[500px] w-full flex-col items-center justify-center overflow-hidden border border-border bg-transparent shadow-xl">
                    <Marquee className="[--duration:20s] py-0">
                      {[
                        "/img/landing/dashboard.png",
                        "/img/landing/documents.png",
                        "/img/landing/new_document.png",
                      ].map((src) => (
                        <Image
                          key={src}
                          src={src}
                          alt="DocuSol images"
                          width={823}
                          height={616}
                          className="relative z-0 w-full object-contain"
                          priority
                        />
                      ))}
                    </Marquee>

                    {/* Left gradient overlay */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 md:w-1/4 xl:w-1/4 bg-gradient-to-r from-background via-background/80 to-transparent dark:from-background/95 dark:via-background/75 dark:to-transparent"></div>

                    {/* Right gradient overlay */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 md:w-1/4 xl:w-1/4 bg-gradient-to-l from-background via-background/80 to-transparent dark:from-background/95 dark:via-background/75 dark:to-transparent"></div>
                  </div>
                </section>

                {/* Call To Action */}
                <section className="py-12">
                  <div className="min-h-[50vh] flex items-center justify-center p-8">
                    <div className="text-center">
                      <h2 className="max-w-md mx-auto mb-4 h-16 md:max-w-none text-4xl md:text-5xl font-bold bg-gradient-to-br from-primary to-black/50 dark:to-primary-foreground bg-clip-text text-transparent">
                        Start Securing Your Documents Today
                      </h2>
                      <div className="flex flex-col gap-6">
                        <p className="text-xl text-muted-foreground font-medium">
                          Join thousands of professionals who trust DocuSol for
                          their document needs
                        </p>
                        <Link href="/docs/new">
                          <InteractiveHoverButton className="w-full sm:w-auto rounded-none text-base lg:text-lg py-3 lg:py-4 px-4 lg:px-6">
                            Get Started Now
                          </InteractiveHoverButton>
                        </Link>
                      </div>
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
