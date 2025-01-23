import type { Metadata, Viewport } from "next";

export const siteName = "DocuSol";

export const heroDescription = "Share documents securely on the blockchain.";

const seoDescription =
  "The ultimate platform for sharing documents securely on the blockchain.";
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
    { media: "(prefers-color-scheme: dark)", color: "#000" },
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
    icon: "/img/docusol_icon.webp",
    shortcut: "/img/docusol_icon.webp",
    apple: "/img/docusol_icon.webp",
  },
  openGraph: {
    type: "website",
    url: "https://docusol.app",
    title: siteName,
    description: heroDescription,
    siteName: siteName,
    images: [
      {
        url: "/img/docusol_logo.webp",
        width: 318,
        height: 85,
        alt: "DocuSol Logo",
      },
      {
        url: "/img/docusol_icon.webp",
        width: 64,
        height: 52,
        alt: "DocuSol Logo",
      },
      {
        url: "/img/docusol_logo.webp",
        width: 1231,
        height: 1049,
        alt: "DocuSol Logo",
      },
      {
        url: "/img/docusol_logo.webp",
        width: 1024,
        height: 1024,
        alt: "DocuSol Logo",
      },
    ],
  },
};
