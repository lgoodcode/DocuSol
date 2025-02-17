import type { ApiRoute } from "./index";

export const API_ROUTES: Record<string, ApiRoute> = {
  "auth.login": {
    name: "Login",
    path: "/api/auth/login",
    description:
      "Login to the application via wallet auth and generate session",
  },
  "auth.logout": {
    name: "Logout",
    path: "/api/auth/logout",
    description: "Logout from the application",
  },
  "auth.session": {
    name: "Session",
    path: "/api/auth/session",
    description: "Verify session is valid",
  },
  "docs.create": {
    name: "Docs - Create",
    path: "/api/docs/new",
    description: "Create a new document",
    protected: true,
  },
  "docs.search": {
    name: "Docs - Search",
    path: "/api/docs/search",
    description: "Search for documents",
    protected: true,
  },
  "docs.sign": {
    name: "Docs - Sign",
    path: "/api/docs/sign",
    description: "Sign a document",
    protected: true,
  },
  "docs.verify": {
    name: "Docs - Verify",
    path: "/api/docs/verify",
    description: "Verify a document",
    protected: true,
  },
};

export const API_PATHS = {
  AUTH: {
    LOGIN: API_ROUTES["auth.login"].path,
    LOGOUT: API_ROUTES["auth.logout"].path,
    SESSION: API_ROUTES["auth.session"].path,
  },
  DOCS: {
    CREATE: API_ROUTES["docs.create"].path,
    SEARCH: API_ROUTES["docs.search"].path,
    SIGN: API_ROUTES["docs.sign"].path,
    VERIFY: API_ROUTES["docs.verify"].path,
  },
} as const;
