"use client";

import { useState } from "react";

import { PasswordRequiredContent } from "./password-required-content";

interface SignDocContentProps {
  token: string;
  password?: string;
}

export function SignDocContent({ token, password }: SignDocContentProps) {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  if (password && !isPasswordVerified) {
    return (
      <PasswordRequiredContent
        token={token}
        password={password}
        onSuccess={() => setIsPasswordVerified(true)}
      />
    );
  }

  return <div>"placeholder"</div>;
}
