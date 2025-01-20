import { List, type LucideIcon, Plus } from "lucide-react";

export type Route = {
  name: string;
  path: `/${string}`;
  Icon: LucideIcon;
  description?: string;
  disabled?: boolean;
};

export const routes: Route[] = [
  {
    name: "Digital Humans",
    path: "/agents",
    Icon: List,
    description: "View your digital humans to chat with and manage.",
  },
  {
    name: "New Digital Human",
    path: "/agents/new",
    Icon: Plus,
    description: "Create a new digital human.",
  },
];
