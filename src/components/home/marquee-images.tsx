import Image from "next/image";

import { Marquee } from "@/components/ui/marquee";

const DARK_URLS = [
  "/img/landing/dashboard.webp",
  "/img/landing/documents.webp",
  "/img/landing/new_doc.webp",
  "/img/landing/explore.webp",
  "/img/landing/sign.webp",
  "/img/landing/verify.webp",
];

const LIGHT_URLS = [
  "/img/landing/dashboard_light.webp",
  "/img/landing/documents_light.webp",
  "/img/landing/new_doc_light.webp",
  "/img/landing/explore_light.webp",
  "/img/landing/sign_light.webp",
  "/img/landing/verify_light.webp",
];

export function MarqueeImages({ theme }: { theme: string }) {
  const urls = theme === "dark" ? DARK_URLS : LIGHT_URLS;

  return (
    <Marquee pauseOnHover className="p-0 h-[700px] [--gap:12rem]">
      {urls.map((src) => (
        <Image
          key={src}
          src={src}
          alt="DocuSol images"
          width={1025}
          height={851}
          className="relative z-0 w-full object-contain"
        />
      ))}
    </Marquee>
  );
}
