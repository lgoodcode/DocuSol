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
];
