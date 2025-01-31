import type { Metadata } from "next";

import { ListDocsContent } from "./list-docs-content";

export const metadata: Metadata = {
    title: "Documents | DocuSol",
    description: "Manage your documents",
};

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-8 py-8 max-w-7xl mx-auto">
      <ListDocsContent />
    </div>
  );
}
