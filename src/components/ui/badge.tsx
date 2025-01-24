import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary shadow-sm border border-primary/20 dark:border-primary/30 hover:bg-primary/20 dark:hover:bg-primary/30 hover:text-primary dark:hover:text-primary",
        secondary:
          "bg-secondary/90 dark:bg-secondary/90 text-secondary-foreground dark:text-secondary-foreground shadow-sm border border-secondary/20 dark:border-secondary/30 hover:bg-secondary/20 dark:hover:bg-secondary/30",
        destructive:
          "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 shadow-sm border border-red-200/40 dark:border-red-700/40 hover:bg-red-200 dark:hover:bg-red-900/70 hover:text-red-800 dark:hover:text-red-200",
        success:
          "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-sm border border-green-200/40 dark:border-green-700/40 hover:bg-green-200 dark:hover:bg-green-900/70 hover:text-green-800 dark:hover:text-green-200",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
