import type { Metadata } from "next";
import { DocumentSigning } from "./signing";

export const metadata: Metadata = {
  title: "New Document",
};

export default function NewDocumentPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">New Document</h1>
        <p className="text-sm text-muted-foreground">
          Sign your document with your signature.
        </p>
      </div>
      <DocumentSigning />
    </div>
  );
}
