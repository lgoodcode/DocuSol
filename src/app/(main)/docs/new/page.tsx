import type { Metadata } from "next";
import { DocumentSigning } from "./signing";

export const metadata: Metadata = {
  title: "New Document",
};

export default function NewDocumentPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <DocumentSigning />
    </div>
  );
}
