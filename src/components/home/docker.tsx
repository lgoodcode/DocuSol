"use client";

import { Moon, Sun, Pill } from "lucide-react";
import Link from "next/link";
import React, { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";
import { StaticDock, StaticDockIcon } from "@/components/ui/dock";

export type IconProps = React.HTMLAttributes<SVGElement>;

// X/Twitter icon
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

// Memoized DockLink component
const DockLink = memo(
  ({
    href,
    label,
    icon: Icon,
    className,
    onClick,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<IconProps>;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        buttonVariants({ variant: "ghost", size: "icon" }),
        "size-12 rounded-md !bg-transparent",
        className
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
    </Link>
  )
);
DockLink.displayName = "DockLink";

// Memoized DockTooltip component
const DockTooltip = memo(
  ({ children, content }: { children: React.ReactNode; content: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  )
);
DockTooltip.displayName = "DockTooltip";

// Main Docker component
function Docker() {
  const { theme, setTheme } = useTheme();

  return (
    <TooltipProvider>
      <StaticDock direction="middle">
        <StaticDockIcon>
          <DockTooltip content="X/Twitter">
            <DockLink
              href="https://twitter.com"
              label="X/Twitter"
              icon={XIcon}
            />
          </DockTooltip>
        </StaticDockIcon>
        <StaticDockIcon>
          <DockTooltip content="X/Twitter">
            <DockLink href="https://twitter.com" label="PumpFun" icon={Pill} />
          </DockTooltip>
        </StaticDockIcon>
        <StaticDockIcon>
          <DockTooltip content="Theme">
            <DockLink
              href="#"
              label="Toggle theme"
              icon={theme === "dark" ? Sun : Moon}
              onClick={(e) => {
                e.preventDefault();
                setTheme(theme === "dark" ? "light" : "dark");
              }}
            />
          </DockTooltip>
        </StaticDockIcon>
      </StaticDock>
    </TooltipProvider>
  );
}

export function DockerContainer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
    setIsOpen(true);
  }, []);

  const handleDockerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handlePageClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-0" onClick={handlePageClick} />
      <motion.div
        className={cn(
          "fixed top-0 left-0 w-full z-50",
          isInitialized && "transition-transform duration-300",
          !isOpen && "-translate-y-full"
        )}
        onClick={handleDockerClick}
        initial={{ y: "-100%" }}
        animate={{ y: isOpen ? 0 : "-100%" }}
        transition={{ duration: 0.3 }}
      >
        <Docker />
      </motion.div>
    </>
  );
}
