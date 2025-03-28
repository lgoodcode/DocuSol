import type { Metadata } from "next";
import { NewDocContent } from "./content";

export const metadata: Metadata = {
  title: "New Document",
};

export default function NewDocumentPage() {
  return <NewDocContent />;
}
