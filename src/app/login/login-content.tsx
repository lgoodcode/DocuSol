"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next-nprogress-bar";
import { motion } from "framer-motion";
import {
  Loader2,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletAuth } from "@/lib/auth/use-wallet-auth";
import { BoxBackground } from "@/components/layout/box-background";
import { DockerContainer } from "@/components/home/docker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConnectionStep =
  | "idle"
  | "signing"
  | "authenticating"
  | "success"
  | "error";

interface StepConfig {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  className: string;
  animation?: string;
}

const NUM_STEPS = 3;
const CONNECTION_STEPS: Record<ConnectionStep, StepConfig> = {
  idle: {
    step: 0,
    icon: Wallet,
    title: "Connect Wallet",
    description: "Select your wallet to continue",
    className: "text-primary",
  },
  signing: {
    step: 0,
    icon: Wallet,
    title: "Waiting for Signature",
    description: "Please sign the message to verify your wallet...",
    className: "text-primary",
    animation: "animate-pulse",
  },
  authenticating: {
    step: 1,
    icon: Loader2,
    title: "Authenticating",
    description: "Verifying your credentials...",
    className: "text-primary",
    animation: "animate-spin",
  },
  success: {
    step: 2,
    icon: CheckCircle2,
    title: "Connected Successfully",
    description: "Redirecting you to the app...",
    className: "text-green-500",
  },
  error: {
    step: -1,
    icon: XCircle,
    title: "Connection Failed",
    description: "Please try again",
    className: "text-destructive",
  },
};

const StepIndicator = ({ status }: { status: ConnectionStep }) => {
  const stepConfig = CONNECTION_STEPS[status];

  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      {Array.from({ length: NUM_STEPS }).map((_, index) => (
        <div
          key={index}
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            status === "error"
              ? "bg-destructive"
              : index < stepConfig.step
                ? "bg-primary"
                : index === stepConfig.step
                  ? status === "success"
                    ? "bg-primary"
                    : "animate-pulse bg-primary"
                  : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

const ConnectionStatus = ({
  step,
  error,
}: {
  step: ConnectionStep;
  error: string | null;
}) => {
  const config = CONNECTION_STEPS[step];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <Icon className={`h-12 w-12 ${config.className} ${config.animation}`} />
      <div className="text-center">
        <h3 className="text-lg font-semibold">{config.title}</h3>
        <p className="text-sm text-muted-foreground">
          {step === "error" ? error || config.description : config.description}
        </p>
      </div>
    </div>
  );
};

export function LoginContent() {
  const router = useRouter();
  const [step, setStep] = useState<ConnectionStep>("idle");
  const [isOpen, setIsOpen] = useState(false);
  const {
    selectWallet,
    signing,
    authenticating,
    authenticated,
    disconnect,
    error,
    wallets,
  } = useWalletAuth();
  const walletsInstalled = wallets.filter(
    (wallet) => wallet.readyState === "Installed",
  );

  const handleOpenChange = () => {
    if (isOpen) {
      setIsOpen(false);
      disconnect();
    } else {
      setIsOpen(true);
    }
    setStep("idle");
  };

  // Update step based on wallet state
  useEffect(() => {
    if (authenticated) {
      setStep("success");
      router.push("/docs/list");
    } else if (signing) {
      setStep("signing");
    } else if (authenticating) {
      setStep("authenticating");
    } else if (error) {
      setStep("error");
    }
  }, [authenticated, authenticating, error, router, signing]);

  return (
    <>
      <main className="relative">
        <BoxBackground />
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
            when: "beforeChildren",
            staggerChildren: 0.3,
          }}
        >
          <DockerContainer delay={0.5} />
        </motion.div>

        <div className="z-30 flex min-h-dvh items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <div>
              <Card className="p-6">
                <CardContent className="grid gap-6 p-0">
                  <div className="text-center">
                    <h1 className="mb-2 text-2xl font-bold">Welcome Back</h1>
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet to continue
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => setIsOpen(true)}
                    disabled={step !== "idle" && step !== "error"}
                    className="w-full"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </main>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          onInteractOutside={(e) => {
            if (!authenticating && authenticated) {
              e.preventDefault();
            }
          }}
          className="sm:max-w-md"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle className="sr-only">
              {authenticated
                ? "Connected Wallet"
                : authenticating
                  ? "Connecting..."
                  : "Connect Wallet"}
            </DialogTitle>
            <h1 className="text-center text-2xl font-bold">
              {authenticated
                ? "Connected Wallet"
                : authenticating
                  ? "Connecting..."
                  : "Connect Wallet"}
            </h1>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <StepIndicator status={step} />

            {!(authenticating || authenticated || signing) && (
              <div className="flex flex-col items-center gap-4 py-6">
                <Wallet className="h-12 w-12" />

                {!walletsInstalled.length && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription>
                      No wallets installed. Please install a wallet to use the
                      app.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-5 w-5" />
                    <AlertDescription className="text-base">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {!!walletsInstalled.length && (
                  <div className="flex w-full flex-col gap-2">
                    {walletsInstalled.map((wallet) => (
                      <Button
                        key={wallet.adapter.name}
                        variant="ghost"
                        onClick={() => selectWallet(wallet.adapter.name)}
                        className="w-full justify-start gap-6 px-4 py-6 text-left text-lg"
                      >
                        <Image
                          src={wallet.adapter.icon}
                          alt={wallet.adapter.name}
                          width={28}
                          height={28}
                        />
                        {wallet.adapter.name}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {(authenticating || authenticated || signing) && (
              <ConnectionStatus step={step} error={error} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
