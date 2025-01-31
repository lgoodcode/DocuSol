import type { Metadata } from "next";

// import { DashboardContent } from "./dashboard-content";
import { Maintenance } from "@/components/maintenance";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 py-8 max-w-5xl mx-auto">
      <Maintenance />
    </div>
  );
}
