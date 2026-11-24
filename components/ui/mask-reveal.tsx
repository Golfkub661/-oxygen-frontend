"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type Direction = "left" | "right" | "up" | "down";

export interface MaskRevealProps extends Omit<
  React.ComponentProps<typeof motion.div>,
  "children"
> {
  children?: React.ReactNode;
  direction?: Direction;
  duration?: number;
  delay?: number;
  zoom?: boolean;
  inView?: boolean;
  inViewMargin?: string;
}

const hidden: Record<Direction, string> = {
  left: "inset(0% 100% 0% 0%)",
  right: "inset(0% 0% 0% 100%)",
  up: "inset(0% 0% 100% 0%)",
  down: "inset(100% 0% 0% 0%)",
};

export function MaskReveal({
  children,
  className,
  direction = "left",
  duration = 0.9,
  delay = 0,
  zoom = false,
  inView = false,
  inViewMargin = "-50px",
  ...props
}: MaskRevealProps) {
  const ease = [0.76, 0, 0.24, 1] as const;

  return (
    <motion.div
      data-slot="mask-reveal"
      initial={{ clipPath: hidden[direction] }}
      {...(inView
        ? {
            whileInView: { clipPath: "inset(0% 0% 0% 0%)" },
            viewport: { once: true, margin: inViewMargin },
          }
        : { animate: { clipPath: "inset(0% 0% 0% 0%)" } })}
      transition={{ duration, delay, ease }}
      className={cn("overflow-hidden motion-reduce:[clip-path:none]!", className)}
      {...props}
    >
      <motion.div
        initial={{ scale: zoom ? 1.15 : 1 }}
        {...(inView
          ? {
              whileInView: { scale: 1 },
              viewport: { once: true, margin: inViewMargin },
            }
          : { animate: { scale: 1 } })}
        transition={{ duration: duration * 1.2, delay, ease }}
        className="size-full motion-reduce:[transform:none]!"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default MaskReveal;