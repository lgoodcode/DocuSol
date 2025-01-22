import localFont from "next/font/local";
import NextTopLoader from "nextjs-toploader";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import {
  metadata as siteMetadata,
  viewport as siteViewport,
} from "@/config/site";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils/cn";
import "./globals.css";

const satoshiFont = localFont({
  src: "./font/Satoshi-Variable.ttf",
  variable: "--font-satoshi",
  display: "swap",
});

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          satoshiFont.variable
        )}
      >
        <SpeedInsights />
        <Analytics />
        <NextTopLoader
          showSpinner={false}
          easing="cubic-bezier(0.4, 0, 0.2, 1)"
        />
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider swipeDirection="right">
            <Toaster />
            {children}
          </ToastProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
