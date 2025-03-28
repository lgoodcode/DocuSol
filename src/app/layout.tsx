import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import {
  metadata as siteMetadata,
  viewport as siteViewport,
} from "@/config/site";
import { Scan } from "@/components/dev/scan";
import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const satoshiFont = localFont({
  src: "./fonts/Satoshi-Variable.ttf",
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
          "min-h-dvh bg-background font-sans antialiased",
          satoshiFont.variable,
        )}
      >
        <SpeedInsights />
        <Analytics />
        {/* <Scan /> */}
        <ProgressBarProvider />
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WalletProvider>
            {children}
            <Toaster
              richColors
              closeButton
              toastOptions={{
                className: "!backdrop-blur-sm",
              }}
            />
          </WalletProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
