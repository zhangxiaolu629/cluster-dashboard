"use client";

import { motion } from "framer-motion";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  className?: string;
}

export default function FadeIn({
  children,
  delay = 0,
  direction = "up",
  duration = 0.3,
  className,
}: FadeInProps) {
  const getInitialPosition = () => {
    switch (direction) {
      case "up":
        return { opacity: 0, y: 20 };
      case "down":
        return { opacity: 0, y: -20 };
      case "left":
        return { opacity: 0, x: 20 };
      case "right":
        return { opacity: 0, x: -20 };
      default:
        return { opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    switch (direction) {
      case "up":
      case "down":
        return { opacity: 1, y: 0 };
      case "left":
      case "right":
        return { opacity: 1, x: 0 };
      default:
        return { opacity: 1 };
    }
  };

  return (
    <motion.div
      initial={getInitialPosition()}
      animate={getAnimatePosition()}
      exit={{ opacity: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface SlideProps {
  children: React.ReactNode;
  active: boolean;
  direction?: "left" | "right";
  className?: string;
}

export function Slide({ children, active, direction = "right", className }: SlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === "right" ? 50 : -50 }}
      animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: direction === "right" ? -50 : 50 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
