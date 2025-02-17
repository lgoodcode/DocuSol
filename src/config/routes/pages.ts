import {
  LayoutDashboard,
  Folder,
  PenTool,
  CopyPlus,
  Send,
  TrendingUp,
  User,
  ShieldCheck,
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
  protected?: boolean;
};

export const pageRoutes: Route[] = [
  {
    name: "New Document",
    path: "/docs/new",
    Icon: Plus,
    description: "Create a new document.",
    protected: true,
  },
  {
    name: "Dashboard",
    path: "/dashboard",
    Icon: LayoutDashboard,
    description: "View your documents and templates.",
    protected: true,
  },
  {
    name: "Documents",
    path: "/docs/list",
    Icon: Folder,
    description: "View your documents.",
    protected: true,
  },
  {
    name: "Explore",
    path: "/docs/explore",
    Icon: Compass,
    description: "Search for documents.",
    protected: true,
  },
  {
    name: "Verify",
    path: "/docs/verify",
    Icon: ShieldCheck,
    description: "Verify documents.",
    protected: true,
  },
  {
    name: "Writer",
    path: "/writer",
    Icon: PenTool,
    description: "Write documents with AI.",
    protected: true,
  },
  {
    name: "Templates",
    path: "/templates",
    Icon: CopyPlus,
    description: "Create and manage templates.",
    protected: true,
  },
  {
    name: "Send",
    path: "/send",
    Icon: Send,
    description: "Send documents to others.",
    protected: true,
  },
  {
    name: "Changelog",
    path: "/changelog",
    Icon: TrendingUp,
    description: "View our changelog.",
    protected: true,
  },
];

export const accountRoute: Route = {
  name: "Account",
  path: "/account",
  Icon: User,
  description: "View your account.",
  protected: true,
};
