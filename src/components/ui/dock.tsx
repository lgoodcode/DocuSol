"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  motion,
  MotionProps,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { PropsWithChildren, useRef } from "react";

import { cn } from "@/lib/utils/cn";

// Shared types and constants
export interface BaseDockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

export const dockVariants = cva(
  "supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 mx-auto mt-8 flex h-[58px] w-max items-center justify-center gap-2 rounded-2xl border p-2 backdrop-blur-md"
);

// Static (Disabled) Components
interface StaticDockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number;
  className?: string;
  children?: React.ReactNode;
}

const StaticDockIcon = ({
  size = DEFAULT_SIZE,
  className,
  children,
  ...props
}: StaticDockIconProps) => {
  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-colors duration-200 hover:bg-black/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

StaticDockIcon.displayName = "StaticDockIcon";

const StaticDock = React.forwardRef<HTMLDivElement, BaseDockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      direction = "middle",
      ...props
    },
    ref
  ) => {
    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return (
            <StaticDockIcon size={iconSize}>
              {/* @ts-expect-error - child.props is not defined */}
              {child.props.children}
            </StaticDockIcon>
          );
        }
        return child;
      });
    };

    return (
      <div
        ref={ref}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {renderChildren()}
      </div>
    );
  }
);

StaticDock.displayName = "StaticDock";

// Animated Components
interface AnimatedDockIconProps
  extends Omit<MotionProps & React.HTMLAttributes<HTMLDivElement>, "children"> {
  size?: number;
  magnification?: number;
  distance?: number;
  mouseX?: MotionValue<number>;
  className?: string;
  children?: React.ReactNode;
  props?: PropsWithChildren;
}

const AnimatedDockIcon = ({
  size = DEFAULT_SIZE,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  ...props
}: AnimatedDockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const padding = Math.max(6, size * 0.2);
  const defaultMouseX = useMotionValue(Infinity);

  const distanceCalc = useTransform(mouseX ?? defaultMouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeTransform = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [size, magnification, size]
  );

  const scaleSize = useSpring(sizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{
        width: scaleSize,
        height: scaleSize,
        padding,
      }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

AnimatedDockIcon.displayName = "AnimatedDockIcon";

const AnimatedDock = React.forwardRef<HTMLDivElement, BaseDockProps>(
  (
    {
      className,
      children,
      iconSize = DEFAULT_SIZE,
      iconMagnification = DEFAULT_MAGNIFICATION,
      iconDistance = DEFAULT_DISTANCE,
      direction = "middle",
      ...props
    },
    ref
  ) => {
    const mouseX = useMotionValue(Infinity);

    const renderChildren = () => {
      return React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return (
            <AnimatedDockIcon
              mouseX={mouseX}
              size={iconSize}
              magnification={iconMagnification}
              distance={iconDistance}
            >
              {/* @ts-expect-error - child.props is not defined */}
              {child.props.children}
            </AnimatedDockIcon>
          );
        }
        return child;
      });
    };

    return (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }), {
          "items-start": direction === "top",
          "items-center": direction === "middle",
          "items-end": direction === "bottom",
        })}
      >
        {renderChildren()}
      </motion.div>
    );
  }
);

AnimatedDock.displayName = "AnimatedDock";

// Main Export Component
interface DockProps extends BaseDockProps {
  animated?: boolean;
}

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ animated = true, ...props }, ref) => {
    const Component = animated ? AnimatedDock : StaticDock;
    return <Component ref={ref} {...props} />;
  }
);

Dock.displayName = "Dock";

export { Dock, AnimatedDock, StaticDock, AnimatedDockIcon, StaticDockIcon };
