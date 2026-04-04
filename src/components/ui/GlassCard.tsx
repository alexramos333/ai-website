"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

/* ─── Module-level shared IntersectionObserver ─── */

type ObserverCallback = () => void;

const observerCallbacks = new Map<Element, ObserverCallback>();
let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const callback = observerCallbacks.get(entry.target);
          if (callback) {
            callback();
            observerCallbacks.delete(entry.target);
            sharedObserver!.unobserve(entry.target);
          }
        }
      }
    },
    { threshold: 0.1 },
  );
  return sharedObserver;
}

function observe(el: Element, callback: ObserverCallback): void {
  observerCallbacks.set(el, callback);
  getSharedObserver().observe(el);
}

function unobserve(el: Element): void {
  observerCallbacks.delete(el);
  sharedObserver?.unobserve(el);
}

/* ─── Component ─── */

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

    observe(el, () => setIsVisible(true));
    return () => { unobserve(el); };
  }, [animated]);

  return (
    <div
      ref={ref}
      className={`glass-card glass-card-contained ${paddingMap[padding]} transition-all duration-700 ease-out ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
