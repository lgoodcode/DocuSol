import type { Metadata } from "next";

import { ViewContent } from "./content";

export const metadata: Metadata = {
  title: "Documents | DocuSol",
  description: "Manage your documents",
};

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto">
      <ViewContent />
    </div>
  );
}
