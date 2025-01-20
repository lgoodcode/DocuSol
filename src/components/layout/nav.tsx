"use client";

import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

import {
  LayoutDashboard,
  Folder,
  PenTool,
  Book,
  CopyPlus,
  Send,
  Snowflake,
  TrendingUp,
  Zap,
  Moon,
  User,
  Plus,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { NavButton } from "@/components/layout/nav-button";
import { NavTooltip } from "@/components/layout/nav-tooltip";

export function Nav() {
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-[60px] flex flex-col border-r border-stone-800 sticky top-0 h-screen z-50">
      <div className="flex flex-col flex-1">
        <Link href="/" className="p-4 text-center">
          <Image
            src="/img/docusol_icon.png"
            alt="DocuSol"
            width={318}
            height={85}
          />
        </Link>

        <nav className="grid gap-2 p-2">
          <NavButton href="/docs/new" icon={Plus} label="New Document" />
          <NavButton
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
          />
          <NavButton href="/documents" icon={Folder} label="Documents" />
          <NavButton href="/writer" icon={PenTool} label="Writer" />
        </nav>
      </div>

      <div className="mt-auto">
        <nav className="grid gap-2 p-2">
          <NavButton href="/blog" icon={Book} label="Blog" />
          <NavButton href="/templates" icon={CopyPlus} label="Templates" />
          <NavButton href="/send" icon={Send} label="Send" />
          <NavButton href="/free-tools" icon={Snowflake} label="Free Tools" />
          <NavButton href="/changelog" icon={TrendingUp} label="Changelog" />
          <NavButton href="/pricing" icon={Zap} label="Pricing" />
        </nav>

        <div className="p-2 border-t border-stone-800">
          <NavTooltip content="Theme">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-purple-900/20"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </NavTooltip>
          <NavTooltip content="Account">
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-purple-900/20"
            >
              <User className="h-4 w-4" />
            </Button>
          </NavTooltip>
        </div>
      </div>
    </aside>
  );
}
