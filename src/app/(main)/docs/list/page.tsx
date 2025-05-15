import type { Metadata } from "next";

import { ListDocsContent } from "./list-docs-content";

export const metadata: Metadata = {
  title: "Documents | DocuSol",
  description: "Manage your documents",
};

export default function DocumentsPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:px-8">
      <ListDocsContent />
    </div>
  );
}
