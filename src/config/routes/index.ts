import type { LucideIcon } from "lucide-react";

export interface Route {
  name: string;
  path: `/${string}`;
  description?: string;
  disabled?: boolean;
  protected?: boolean;
}

export interface PageRoute extends Route {
  Icon: LucideIcon;
}

export interface ApiRoute extends Route {
  path: `/api/${string}`;
}

import { API_ROUTES, API_PATHS } from "./api";
import { PAGE_ROUTES, PAGE_PATHS } from "./pages";

const PROTECTED_PATHS: string[] = [
  ...Object.values(API_ROUTES)
    .filter((route) => route.protected)
    .map((route) => route.path),
  ...Object.values(PAGE_ROUTES)
    .filter((route) => route.protected)
    .map((route) => route.path),
];

export { PROTECTED_PATHS, API_ROUTES, PAGE_ROUTES, API_PATHS, PAGE_PATHS };
