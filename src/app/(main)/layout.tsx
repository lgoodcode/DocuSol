import { Nav } from "@/components/layout/nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex">
      {/* Tech pattern overlay */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/5 dark:from-primary/[0.03] to-transparent" />
      </div>

      <Nav />
      <main className="relative z-10 flex-1 px-6 mt-[64px] md:mt-0">
        {children}
      </main>
    </div>
  );
}
