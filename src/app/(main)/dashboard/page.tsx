import type { Metadata } from "next";

import { DashboardContent } from "./content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 py-8 max-w-5xl mx-auto">
      <DashboardContent />
    </div>
  );
}
