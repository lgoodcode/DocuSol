import type { Metadata } from "next";

import { DashboardContent } from "./content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Welcome your new WorkOS, here to fill your skill gaps and amplifying
          your skill-set.
        </p>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="flex -space-x-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full border-2 border-background bg-muted"
              />
            ))}
          </div>
          <span className="font-medium">
            Loved by <span className="text-foreground">32,000+ users</span>
          </span>
        </div>
      </div>
      <DashboardContent />
    </div>
  );
}
