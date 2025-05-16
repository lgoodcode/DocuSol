import {
  // LayoutDashboard,
  Folder,
  // PenTool,
  // CopyPlus,
  // Send,
  // TrendingUp,
  ShieldCheck,
  Plus,
  // Compass,
} from "lucide-react";

import type { PageRoute } from "./index";

export const PAGE_ROUTES: Record<string, PageRoute> = {
  "docs.new": {
    name: "New Document",
    path: "/docs/new",
    Icon: Plus,
    description: "Create a new document.",
    protected: true,
  },
  // dashboard: {
  //   name: "Dashboard",
  //   path: "/dashboard",
  //   Icon: LayoutDashboard,
  //   description: "View your documents and templates.",
  //   protected: true,
  // },
  "docs.list": {
    name: "Documents",
    path: "/docs/list",
    Icon: Folder,
    description: "View your documents.",
    protected: true,
  },
  sign: {
    name: "Sign",
    path: "/sign",
    description: "Sign documents.",
    protected: false,
    noNav: true,
  },
  // "docs.explore": {
  //   name: "Explore",
  //   path: "/docs/explore",
  //   Icon: Compass,
  //   description: "Search for documents.",
  //   protected: true,
  // },
  "docs.verify": {
    name: "Verify",
    path: "/docs/verify",
    Icon: ShieldCheck,
    description: "Verify documents.",
    protected: true,
  },
  // writer: {
  //   name: "Writer",
  //   path: "/writer",
  //   Icon: PenTool,
  //   description: "Write documents with AI.",
  //   protected: true,
  // },
  // templates: {
  //   name: "Templates",
  //   path: "/templates",
  //   Icon: CopyPlus,
  //   description: "Create and manage templates.",
  //   protected: true,
  // },
  // send: {
  //   name: "Send",
  //   path: "/send",
  //   Icon: Send,
  //   description: "Send documents to others.",
  //   protected: true,
  // },
  // changelog: {
  //   name: "Changelog",
  //   path: "/changelog",
  //   Icon: TrendingUp,
  //   description: "View our changelog.",
  //   protected: true,
  // },
};

export const PAGE_PATHS = {
  DOCS: {
    NEW: PAGE_ROUTES["docs.new"].path,
    LIST: PAGE_ROUTES["docs.list"].path,
    // EXPLORE: PAGE_ROUTES["docs.explore"].path,
    VERIFY: PAGE_ROUTES["docs.verify"].path,
  },
  SIGN: PAGE_ROUTES["sign"].path,
  // DASHBOARD: PAGE_ROUTES["dashboard"].path,
  // WRITER: PAGE_ROUTES["writer"].path,
  // TEMPLATES: PAGE_ROUTES["templates"].path,
  // SEND: PAGE_ROUTES["send"].path,
  // CHANGELOG: PAGE_ROUTES["changelog"].path,
} as const;
