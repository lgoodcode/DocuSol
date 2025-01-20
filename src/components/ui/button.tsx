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
          "bg-primary text-primary-foreground shadow-sm border border-primary/50 hover:bg-primary/80",
        destructive:
          "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 shadow-sm border border-red-200/40 dark:border-red-700/40 hover:bg-red-200 dark:hover:bg-red-900/70 hover:text-red-800 dark:hover:text-red-200",
        outline:
          "border border-slate-700/50 bg-slate-900/30 shadow-sm hover:bg-slate-800/50 hover:text-slate-200",
        secondary:
          "bg-slate-800/70 text-slate-200 shadow-sm border border-slate-600/40 hover:bg-slate-700/80",
        ghost: "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100",
        link: "text-slate-300 underline-offset-4 hover:text-slate-100 hover:underline",
        accent:
          "bg-indigo-900/70 text-indigo-100 shadow-sm border border-indigo-700/40 hover:bg-indigo-800/80",
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
