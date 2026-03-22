"use client";

import {HTMLMotionProps, motion} from "framer-motion";
import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
} & HTMLMotionProps<"button">;

export default function Button({
  children,
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const styles = {
    primary: "bg-green-600 text-white hover:bg-green-700",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900",
  };

  return (
    <motion.button
      whileTap={{scale: 0.96}}
      whileHover={{scale: 1.02}}
      className={`rounded-lg text-sm font-medium transition-colors ${styles[variant]} ${className ?? "px-4 py-2"}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
