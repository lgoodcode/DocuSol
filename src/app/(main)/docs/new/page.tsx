import type { Metadata } from "next";

import { NewDocContent } from "./content";

export const metadata: Metadata = {
  title: "New Document",
};

export default function NewDocumentPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 md:px-8">
      <NewDocContent />
    </div>
  );
}
