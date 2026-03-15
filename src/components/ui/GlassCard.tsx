"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

const paddingMap = {
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-4 sm:p-6 md:p-8",
} as const;

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  animated?: boolean;
}

export default function GlassCard({
  children,
  className = "",
  padding = "md",
  animated = false,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(!animated);

  useEffect(() => {
    if (!animated) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [animated]);

  return (
    <div
      ref={ref}
      className={`glass-card ${paddingMap[padding]} transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
