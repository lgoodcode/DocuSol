import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";

import { DashboardContent } from "./content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 py-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Badge>Beta</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Use AI to generate documents, sign them, and share on the blockchain.
        </p>
      </div>
      <DashboardContent />
    </div>
  );
}
