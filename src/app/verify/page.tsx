import type { Metadata } from "next";

import { VerifyContent } from "@/components/verify/verify-content";

export const metadata: Metadata = {
  title: "Verify Document",
};

export default function VerifyPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:px-8">
      <VerifyContent />
    </div>
  );
}
