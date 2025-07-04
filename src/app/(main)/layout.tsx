import { Nav } from "@/components/layout/nav";
import { QueryProvider } from "@/components/providers/query-provider";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <div className="relative flex overflow-x-hidden">
        {/* Radial gradient overlay */}
        <div className="pointer-events-none fixed inset-0">
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 to-transparent dark:from-primary/[0.03]" />
        </div>

        <Nav />
        <main className="relative z-10 mt-16 flex-1 md:mt-0">{children}</main>
      </div>
    </QueryProvider>
  );
}
