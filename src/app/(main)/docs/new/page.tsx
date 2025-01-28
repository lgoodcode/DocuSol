import type { Metadata } from "next";
import { NewDocumentContent } from "./new-doc-content";

export const metadata: Metadata = {
  title: "New Document",
};

export default function NewDocumentPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <NewDocumentContent />
    </div>
  );
}
