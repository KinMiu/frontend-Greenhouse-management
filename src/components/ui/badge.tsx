import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  color?: "green" | "red" | "gray";
};

export default function Badge({children, color = "gray"}: BadgeProps) {
  const styles = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <span className={`px-2 py-1 text-xs rounded ${styles[color]}`}>
      {children}
    </span>
  );
}
