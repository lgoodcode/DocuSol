import localFont from "next/font/local";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import {
  metadata as siteMetadata,
  viewport as siteViewport,
} from "@/config/site";
import { UserProvider } from "@/components/providers/user-provider";
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
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <UserProvider>
            <ToastProvider swipeDirection="right">
              <Toaster />
              {children}
            </ToastProvider>
          </UserProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
