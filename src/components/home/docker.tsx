"use client";

import { Moon, Sun, Pill, FileText, Github, PenTool } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

import {
  GITHUB_URL,
  X_URL,
  DEXSCREENER_URL,
  CONTRACT_ADDRESS,
} from "@/constants";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { StaticDock, StaticDockIcon } from "@/components/ui/dock";
import { CopyButton } from "../ui/copy-button";

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
            className="!bg-transparent px-2.5 rounded-full border-none text-foreground hover:text-foreground hover:bg-gray-300"
            onClick={onClick}
          >
            {children}
          </Button>
        </Link>
      ) : (
        <Button
          className="!bg-transparent px-2.5 rounded-full border-none text-foreground hover:text-foreground hover:bg-gray-300"
          onClick={onClick}
        >
          {children}
        </Button>
      )}
    </DockTooltip>
  )
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
  )
);
DockTooltip.displayName = "DockTooltip";

function Docker() {
  const { theme, setTheme } = useTheme();

  return (
    <StaticDock direction="middle">
      <StaticDockIcon>
        <DockItem href="/docs/new" newTab={false} content="Get Started">
          <PenTool className="size-5" />
        </DockItem>
      </StaticDockIcon>
      <StaticDockIcon>
        <DockItem
          href="/api-documentation"
          newTab={false}
          content="API Documentation"
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

      {DEXSCREENER_URL && (
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
      )}
      <StaticDockIcon>
        <DockItem
          content={theme === "dark" ? "Light Mode" : "Dark Mode"}
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
      className="fixed top-0 left-0 w-full z-50"
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
