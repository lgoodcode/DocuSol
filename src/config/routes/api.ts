export type ApiRoute = {
  name: string;
  path: `/api/${string}`;
  description?: string;
  disabled?: boolean;
  protected?: boolean;
};

export const apiRoutes: ApiRoute[] = [
  {
    name: "Login",
    path: "/api/auth/login",
    description:
      "Login to the application via wallet auth and generate session",
  },
  {
    // TODO: implement logout
    name: "Logout",
    path: "/api/auth/logout",
    description: "Logout from the application",
  },
  {
    name: "Session",
    path: "/api/auth/session",
    description: "Verify session is valid",
  },
  {
    name: "Docs - Create",
    path: "/api/docs/new",
    description: "Create a new document",
    protected: true,
  },
  {
    name: "Docs - Search",
    path: "/api/docs/search",
    description: "Search for documents",
    protected: true,
  },
  {
    name: "Docs - Sign",
    path: "/api/docs/sign",
    description: "Sign a document",
    protected: true,
  },
  {
    name: "Docs - Verify",
    path: "/api/docs/verify",
    description: "Verify a document",
    protected: true,
  },
];
