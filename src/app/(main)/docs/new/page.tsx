import type { Metadata } from "next";
import { NewDocContent } from "./content";

export const metadata: Metadata = {
  title: "New Document",
};

export default function NewDocumentPage() {
  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <NewDocContent />
    </div>
  );
}
