import type { Metadata, Viewport } from "next";

export const siteName = "DocuSol";

export const heroDescription = "Share documents securely on the blockchain.";

const seoDescription =
  "DocuSol - The ultimate platform for sharing documents securely on the blockchain.";
const keywords = [
  "DocuSol",
  "Blockchain",
  "Documents",
  "Secure",
  "Share",
  "Blockchain documents",
  "Secure documents",
  "Share documents",
  "Blockchain documents platform",
  "Custom documents",
  "Conversational documents builder",
  "Human-like documents",
  "No-code documents deployment",
  "Digital documents personality creator",
  "Natural language documents platform",
  "Interactive documents assistant builder",
];

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#8c4bcb" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: "%s | " + siteName,
  },
  metadataBase: new URL("https://docusol.app"),
  keywords: keywords,
  description: seoDescription,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/img/icon.png",
    apple: "/img/icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://docusol.app",
    title: siteName,
    description: heroDescription,
    siteName: siteName,
    images: [
      {
        url: "/img/logo-318x85.png",
        width: 318,
        height: 85,
        alt: "alt text",
      },
      {
        url: "/img/icon.png",
        width: 64,
        height: 52,
        alt: "alt text",
      },
      {
        url: "/img/icon-logo-1231x1049.png",
        width: 1231,
        height: 1049,
        alt: "alt text",
      },
      {
        url: "/img/icon-1024x1024.png",
        width: 1024,
        height: 1024,
        alt: "alt text",
      },
    ],
  },
};
