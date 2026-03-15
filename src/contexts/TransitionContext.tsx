"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface TransitionContextValue {
  isTransitioning: boolean;
  targetHref: string;
  triggerTransition: (href: string) => void;
  completeTransition: () => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetHref, setTargetHref] = useState("");

  const triggerTransition = useCallback(
    (href: string) => {
      if (isTransitioning) return;
      setTargetHref(href);
      setIsTransitioning(true);
    },
    [isTransitioning],
  );

  const completeTransition = useCallback(() => {
    setIsTransitioning(false);
    setTargetHref("");
  }, []);

  return (
    <TransitionContext value={{ isTransitioning, targetHref, triggerTransition, completeTransition }}>
      {children}
    </TransitionContext>
  );
}

export function usePageTransition(): TransitionContextValue {
  const context = useContext(TransitionContext);
  if (!context) {
    throw new Error("usePageTransition must be used within a TransitionProvider");
  }
  return context;
}
