"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next-nprogress-bar";
import { motion } from "framer-motion";
import { captureException } from "@sentry/nextjs";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useWalletAuth } from "@/lib/auth/use-wallet-auth";
import { WalletDialog } from "@/components/layout/wallet-dialog";
import { BoxBackground } from "@/components/layout/box-background";
export function LoginContent() {
  const router = useRouter();
  const { authenticating, authenticated } = useWalletAuth();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (authenticated) {
      router.push("/home");
    }
  }, [authenticated, router]);

  return (
    <main className="relative">
      <BoxBackground />
      <div className="z-30 flex min-h-dvh items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.3,
            ease: "easeOut",
          }}
          className="w-full max-w-md"
        >
          <Card className="p-6">
            <CardContent className="grid gap-6 p-0">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: 0.2,
                }}
                className="z-10 grid items-center justify-center gap-6"
              >
                <Link
                  href="/"
                  className="mx-auto text-center transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/img/branding/icon_large_1000x1000.webp"
                    alt="Logo"
                    width={48}
                    height={48}
                    priority
                  />
                </Link>

                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold md:text-3xl">Welcome</h1>
                  </div>
                  <p className="text-sm text-muted-foreground md:text-base">
                    Connect your wallet to use the platform
                  </p>
                </div>

                {serverError && (
                  <Alert variant="destructive">
                    <AlertTitle>{serverError}</AlertTitle>
                  </Alert>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <WalletDialog open={open} setOpen={setOpen}>
                    <Button
                      size="lg"
                      onClick={() => setOpen(true)}
                      disabled={authenticating}
                      className="w-full"
                    >
                      {authenticating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" />
                          Connect Wallet
                        </>
                      )}
                    </Button>
                  </WalletDialog>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
