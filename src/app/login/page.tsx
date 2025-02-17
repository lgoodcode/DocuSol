import { Metadata } from "next";

import { LoginContent } from "./login-content";

export const metadata: Metadata = {
  title: "Login",
  description: "Connect your wallet to access the platform",
};

export default function LoginPage() {
  return <LoginContent />;
}
