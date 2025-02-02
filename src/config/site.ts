import type { Metadata, Viewport } from "next";

export const siteName = "DocuSol";

export const heroDescription =
  "Secure. Share. Sign. On-Chain Solutions. Decentralized signatures using the blockchain.";

const seoDescription =
  "Secure. Share. Sign. On-Chain Solutions. Decentralized signatures using the blockchain.";
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
    { media: "(prefers-color-scheme: dark)", color: "#0f0f12" },
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
    icon: "/img/branding/logo.webp",
    shortcut: "/img/branding/logo.webp",
    apple: "/img/branding/logo.webp",
  },
  openGraph: {
    type: "website",
    url: "https://docusol.app",
    title: siteName,
    description: heroDescription,
    siteName: siteName,
    images: [
      {
        url: "/img/branding/logo.webp",
        width: 318,
        height: 85,
        alt: "DocuSol Logo",
      },
    ],
  },
};
