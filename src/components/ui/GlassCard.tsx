import type { ReactNode } from "react";

const paddingMap = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-4 sm:p-6 md:p-8",
} as const;

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export default function GlassCard({
  children,
  className = "",
  padding = "md",
}: GlassCardProps) {
  return (
    <div
      className={`glass-card glass-card-contained ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
