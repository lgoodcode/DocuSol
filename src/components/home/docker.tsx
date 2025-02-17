"use client";

import { Moon, Sun, FileText, Github, Rocket } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

import {
  GITHUB_URL,
  X_URL,
  DISCORD_URL,
  // DEXSCREENER_URL,
  // CONTRACT_ADDRESS,
} from "@/constants";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { StaticDock, StaticDockIcon } from "@/components/ui/dock";
// import { CopyButton } from "../ui/copy-button";

export type IconProps = React.HTMLAttributes<SVGElement>;

const XIcon = memo((props: IconProps) => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>X</title>
    <path
      fill="currentColor"
      d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
    />
  </svg>
));
XIcon.displayName = "XIcon";

const DockItem = memo(
  ({
    href,
    newTab = true,
    content,
    children,
    onClick,
  }: {
    href?: string;
    newTab?: boolean;
    content: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <DockTooltip content={content}>
      {href ? (
        <Link
          href={href}
          className="block"
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
        >
          <Button
            className="rounded-full border-none !bg-transparent px-2.5 text-foreground hover:bg-gray-300 hover:text-foreground"
            onClick={onClick}
          >
            {children}
          </Button>
        </Link>
      ) : (
        <Button
          className="rounded-full border-none !bg-transparent px-2.5 text-foreground hover:bg-gray-300 hover:text-foreground"
          onClick={onClick}
        >
          {children}
        </Button>
      )}
    </DockTooltip>
  ),
);

DockItem.displayName = "DockItem";
const DockTooltip = memo(
  ({ children, content }: { children: React.ReactNode; content: string }) => (
    <TooltipProvider delayDuration={350}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={10}>
          <p className="text-sm font-medium">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
);
DockTooltip.displayName = "DockTooltip";

function Docker() {
  const { theme, setTheme } = useTheme();

  return (
    <StaticDock direction="middle">
      <StaticDockIcon>
        <DockItem href="/login" newTab={false} content="Get Started">
          <Rocket className="size-5" />
        </DockItem>
      </StaticDockIcon>
      <StaticDockIcon>
        <DockItem
          href="https://docusol.gitbook.io/docusol"
          content="Documentation"
        >
          <FileText className="size-5" />
        </DockItem>
      </StaticDockIcon>
      {X_URL && (
        <StaticDockIcon>
          <DockItem href={X_URL} content="X">
            <XIcon className="size-5" />
          </DockItem>
        </StaticDockIcon>
      )}
      {GITHUB_URL && (
        <StaticDockIcon>
          <DockItem href={GITHUB_URL} content="GitHub">
            <Github className="size-5" />
          </DockItem>
        </StaticDockIcon>
      )}

      {DISCORD_URL && (
        <StaticDockIcon>
          <DockItem href={DISCORD_URL} content="Discord">
            <svg
              width="100%"
              height="100%"
              viewBox="0 -28.5 256 256"
              fill="currentColor"
            >
              <g>
                <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"></path>
              </g>
            </svg>
          </DockItem>
        </StaticDockIcon>
      )}

      {/* {DEXSCREENER_URL && (
        <StaticDockIcon>
          <DockItem href={DEXSCREENER_URL} content="DexScreener">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 252 300"
              focusable="false"
              className="fill-current"
            >
              <path d="M151.818 106.866c9.177-4.576 20.854-11.312 32.545-20.541 2.465 5.119 2.735 9.586 1.465 13.193-.9 2.542-2.596 4.753-4.826 6.512-2.415 1.901-5.431 3.285-8.765 4.033-6.326 1.425-13.712.593-20.419-3.197m1.591 46.886l12.148 7.017c-24.804 13.902-31.547 39.716-39.557 64.859-8.009-25.143-14.753-50.957-39.556-64.859l12.148-7.017a5.95 5.95 0 003.84-5.845c-1.113-23.547 5.245-33.96 13.821-40.498 3.076-2.342 6.434-3.518 9.747-3.518s6.671 1.176 9.748 3.518c8.576 6.538 14.934 16.951 13.821 40.498a5.95 5.95 0 003.84 5.845zM126 0c14.042.377 28.119 3.103 40.336 8.406 8.46 3.677 16.354 8.534 23.502 14.342 3.228 2.622 5.886 5.155 8.814 8.071 7.897.273 19.438-8.5 24.796-16.709-9.221 30.23-51.299 65.929-80.43 79.589-.012-.005-.02-.012-.029-.018-5.228-3.992-11.108-5.988-16.989-5.988s-11.76 1.996-16.988 5.988c-.009.005-.017.014-.029.018-29.132-13.66-71.209-49.359-80.43-79.589 5.357 8.209 16.898 16.982 24.795 16.709 2.929-2.915 5.587-5.449 8.814-8.071C69.31 16.94 77.204 12.083 85.664 8.406 97.882 3.103 111.959.377 126 0m-25.818 106.866c-9.176-4.576-20.854-11.312-32.544-20.541-2.465 5.119-2.735 9.586-1.466 13.193.901 2.542 2.597 4.753 4.826 6.512 2.416 1.901 5.432 3.285 8.766 4.033 6.326 1.425 13.711.593 20.418-3.197"></path>
              <path d="M197.167 75.016c6.436-6.495 12.107-13.684 16.667-20.099l2.316 4.359c7.456 14.917 11.33 29.774 11.33 46.494l-.016 26.532.14 13.754c.54 33.766 7.846 67.929 24.396 99.193l-34.627-27.922-24.501 39.759-25.74-24.231L126 299.604l-41.132-66.748-25.739 24.231-24.501-39.759L0 245.25c16.55-31.264 23.856-65.427 24.397-99.193l.14-13.754-.016-26.532c0-16.721 3.873-31.578 11.331-46.494l2.315-4.359c4.56 6.415 10.23 13.603 16.667 20.099l-2.01 4.175c-3.905 8.109-5.198 17.176-2.156 25.799 1.961 5.554 5.54 10.317 10.154 13.953 4.48 3.531 9.782 5.911 15.333 7.161 3.616.814 7.3 1.149 10.96 1.035-.854 4.841-1.227 9.862-1.251 14.978L53.2 160.984l25.206 14.129a41.926 41.926 0 015.734 3.869c20.781 18.658 33.275 73.855 41.861 100.816 8.587-26.961 21.08-82.158 41.862-100.816a41.865 41.865 0 015.734-3.869l25.206-14.129-32.665-18.866c-.024-5.116-.397-10.137-1.251-14.978 3.66.114 7.344-.221 10.96-1.035 5.551-1.25 10.854-3.63 15.333-7.161 4.613-3.636 8.193-8.399 10.153-13.953 3.043-8.623 1.749-17.689-2.155-25.799l-2.01-4.175z"></path>
            </svg>
          </DockItem>
        </StaticDockIcon>
      )}
      {CONTRACT_ADDRESS && (
        <StaticDockIcon>
          <DockItem content="Contract Address">
            <CopyButton
              value={CONTRACT_ADDRESS}
              icon={<Pill className="size-5" />}
              noStyle
            />
          </DockItem>
        </StaticDockIcon>
      )} */}
      <StaticDockIcon>
        <DockItem
          content={theme === "dark" ? "Light theme" : "Dark theme"}
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark");
          }}
        >
          {theme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </DockItem>
      </StaticDockIcon>
    </StaticDock>
  );
}

export function DockerContainer({ delay }: { delay: number }) {
  return (
    <motion.div
      className="fixed left-0 top-0 z-50 w-full"
      initial={{ y: "-100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
        opacity: { duration: 0.5 },
        delay: delay,
      }}
    >
      <Docker />
    </motion.div>
  );
}
