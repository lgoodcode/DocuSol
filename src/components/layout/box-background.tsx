import { Boxes } from "@/components/home/background-boxes";

export function BoxBackground() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-background via-background to-background/50 dark:from-background dark:via-background dark:to-background/20" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-transparent via-primary/5 to-primary/10 dark:from-transparent dark:via-primary/[0.03] dark:to-primary/[0.05]" />
      <div className="pointer-events-none fixed inset-0 -z-10 h-full w-full bg-transparent opacity-[0.23]">
        <Boxes />
      </div>
    </>
  );
}
