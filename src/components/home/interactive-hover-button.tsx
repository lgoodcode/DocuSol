import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "group relative w-auto cursor-pointer overflow-hidden rounded-full bg-black text-white dark:bg-slate-900/50 p-2 px-6 text-center font-semibold",
        "border border-black dark:border-slate-800",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-white transition-all duration-300 group-hover:scale-[100.8] dark:group-hover:bg-white"></div>
        <span className="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {children}
        </span>
      </div>
      <div className="absolute top-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100">
        <span className="text-black dark:group-hover:text-black">
          {children}
        </span>
        <ArrowRight className="text-black dark:group-hover:text-black" />
      </div>
    </button>
  );
});

InteractiveHoverButton.displayName = "InteractiveHoverButton";
