import { headers } from "next/headers";

import { ProgressBarProvider } from "@/components/providers/progress-bar-provider";
import { Nav } from "@/components/layout/nav";
import { ErrorPageContent } from "@/components/error-page-content";
import { RateLimitPageContent } from "@/components/rate-limit-page-content";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const middlewareError = headersList.get("Middleware-Error");
  const retryAfter = headersList.get("Retry-After");

  let content: React.ReactNode;
  if (middlewareError) {
    content = <ErrorPageContent />;
  } else if (retryAfter) {
    content = <RateLimitPageContent waitTime={retryAfter} />;
  } else {
    content = children;
  }

  return (
    <>
      <ProgressBarProvider />
      <div className="relative flex">
        {/* Radial gradient overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 dark:from-primary/[0.03] to-transparent" />
        </div>

        <Nav />
        <main className="relative z-10 flex-1 px-6 mt-[64px] md:mt-0">
          {content}
        </main>
      </div>
    </>
  );
}
