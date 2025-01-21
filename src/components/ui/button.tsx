import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center gap-2 justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 shadow-sm border border-slate-200/40 dark:border-slate-700/40 hover:bg-slate-200 dark:hover:bg-slate-900/70 hover:text-slate-800 dark:hover:text-slate-200",
        secondary:
          "bg-zinc-200 dark:bg-zinc-900/50 text-zinc-800 dark:text-zinc-300 shadow-sm border border-zinc-300/40 dark:border-zinc-700/40 hover:bg-zinc-300 dark:hover:bg-zinc-900/70 hover:text-zinc-900 dark:hover:text-zinc-200",
        destructive:
          "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 shadow-sm border border-red-200/40 dark:border-red-700/40 hover:bg-red-200 dark:hover:bg-red-900/70 hover:text-red-800 dark:hover:text-red-200",
        success:
          "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 shadow-sm border border-green-200/40 dark:border-green-700/40 hover:bg-green-200 dark:hover:bg-green-900/70 hover:text-green-800 dark:hover:text-green-200",
        outline:
          "border border-slate-400 dark:border-slate-700/40 bg-slate-100/30 dark:bg-slate-800/30 shadow-sm hover:bg-slate-200/80 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300",
        ghost:
          "text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200",
        link: "text-slate-700 dark:text-slate-300 underline-offset-4 hover:text-slate-900 dark:hover:text-slate-100 hover:underline",
        accent:
          "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-200/40 dark:border-indigo-700/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 hover:text-indigo-800 dark:hover:text-indigo-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size,
      children,
      isLoading,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const spinnerSize = size === "icon" ? "sm" : "md";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        disabled={isLoading || props.disabled}
      >
        {isLoading && <Spinner size={spinnerSize} />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
