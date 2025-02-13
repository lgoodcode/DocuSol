import { headers } from "next/headers";

import { Nav } from "@/components/layout/nav";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { WalletAuthWrapper } from "@/components/layout/wallet-auth-wrapper";
import { BetaNoticeDialog } from "@/components/beta-notice-dialog";
import { WalletNoticeDialog } from "@/components/wallet-notice-dialog";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const xErrorRewrite = headersList.get("x-error-rewrite");

  return (
    <QueryProvider>
      <WalletProvider>
        <div className="relative flex">
          {/* Radial gradient overlay */}
          <div className="pointer-events-none fixed inset-0">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 to-transparent dark:from-primary/[0.03]" />
          </div>

          <BetaNoticeDialog />
          <WalletNoticeDialog />

          <Nav />
          <main className="relative z-10 mt-[64px] flex-1 px-6 md:mt-0">
            <WalletAuthWrapper error={xErrorRewrite}>
              {children}
            </WalletAuthWrapper>
          </main>
        </div>
      </WalletProvider>
    </QueryProvider>
  );
}
