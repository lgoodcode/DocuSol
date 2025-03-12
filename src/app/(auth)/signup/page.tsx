import { Metadata } from "next";

import { SignupContent } from "./signup-content";

export const metadata: Metadata = {
  title: "Signup",
  description: "Create an account to access the platform",
};

export default function SignupPage() {
  return <SignupContent />;
}
