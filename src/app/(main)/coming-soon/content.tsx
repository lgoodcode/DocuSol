"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ComingSoon() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubscribed(true);
    setIsLoading(false);
  }

  return (
    <div className="relative bg-background overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-grid-primary/[0.02] bg-[size:60px_60px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="z-10 relative container mx-auto flex flex-col items-center justify-center min-h-screen max-w-3xl text-center gap-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <h1 className="text-4xl p-6 sm:text-5xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
            The Future of Document Signing
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            Secure. Decentralized. Revolutionary.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          {!isSubscribed ? (
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
              <Button
                type="submit"
                className="w-full h-12 group"
                disabled={isLoading}
              >
                Get Early Access
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-all" />
              </Button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-muted p-6 text-center"
            >
              <p className="font-medium text-primary">
                Thanks for joining! We&apos;ll be in touch soon.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center"
        >
          {[
            { label: "Users Waitlisted", value: "2,000+" },
            { label: "Security Score", value: "A+" },
            { label: "Launch Date", value: "Q2 2025" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-2">
              <div className="text-2xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Tech pattern overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] dark:from-primary/5 to-transparent" />
      </div>
    </div>
  );
}
