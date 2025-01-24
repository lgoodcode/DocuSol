import {
  LayoutDashboard,
  Folder,
  PenTool,
  CopyPlus,
  Send,
  TrendingUp,
  User,
  Plus,
  type LucideIcon,
  Compass,
} from "lucide-react";

export type Route = {
  name: string;
  path: `/${string}`;
  Icon: LucideIcon;
  description?: string;
  disabled?: boolean;
};

export const navRoutes: Route[] = [
  {
    name: "New Document",
    path: "/docs/new",
    Icon: Plus,
    description: "Create a new document.",
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    Icon: LayoutDashboard,
    description: "View your documents and templates.",
  },
  {
    name: "Documents",
    path: "/docs/view",
    Icon: Folder,
    description: "View your documents.",
  },
  {
    name: "Explorer",
    path: "/docs/explorer",
    Icon: Compass,
    description: "Search for documents.",
  },
  {
    name: "Writer",
    path: "/writer",
    Icon: PenTool,
    description: "Write documents with AI.",
  },
  {
    name: "Templates",
    path: "/templates",
    Icon: CopyPlus,
    description: "Create and manage templates.",
  },
  {
    name: "Send",
    path: "/send",
    Icon: Send,
    description: "Send documents to others.",
  },
  {
    name: "Changelog",
    path: "/changelog",
    Icon: TrendingUp,
    description: "View our changelog.",
  },
];

export const accountRoute: Route = {
  name: "Account",
  path: "/account",
  Icon: User,
  description: "View your account.",
};
