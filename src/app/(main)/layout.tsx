import { headers } from "next/headers";

import { PrivyProvider } from "@/components/providers/privy-provider";
import { Nav } from "@/components/layout/nav";
import { ErrorPageContent } from "@/components/error-page-content";
import { RateLimitPageContent } from "@/components/rate-limit-page-content";
import { WalletAuthWrapper } from "@/components/layout/wallet-auth-wrapper";
import { BetaNoticeDialog } from "@/components/beta-notice-dialog";
import { WalletNoticeDialog } from "@/components/wallet-notice-dialog";

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
    <PrivyProvider>
      <div className="relative flex">
        {/* Radial gradient overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 dark:from-primary/[0.03] to-transparent" />
        </div>

        <BetaNoticeDialog />
        <WalletNoticeDialog />

        <Nav />
        <main className="relative z-10 flex-1 px-6 mt-[64px] md:mt-0">
          <WalletAuthWrapper>{content}</WalletAuthWrapper>
        </main>
      </div>
    </PrivyProvider>
  );
}
