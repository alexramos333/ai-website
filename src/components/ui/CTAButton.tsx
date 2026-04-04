"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import type { ReactNode } from "react";

interface CTAButtonBaseProps {
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

interface CTAButtonLinkProps extends CTAButtonBaseProps {
  href: string;
  onClick?: never;
  type?: never;
  loading?: never;
  disabled?: never;
}

interface CTAButtonActionProps extends CTAButtonBaseProps {
  onClick: () => void;
  href?: never;
  type?: never;
  loading?: never;
  disabled?: never;
}

interface CTAButtonSubmitProps extends CTAButtonBaseProps {
  type: "submit";
  loading?: boolean;
  disabled?: boolean;
  href?: never;
  onClick?: never;
}

type CTAButtonProps =
  | CTAButtonLinkProps
  | CTAButtonActionProps
  | CTAButtonSubmitProps;

const sizeMap = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

function useInViewClass() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("cta-in-view");
        } else {
          el.classList.remove("cta-in-view");
        }
      },
      { threshold: 0 },
    );

    observer.observe(el);
    return () => { observer.disconnect(); };
  }, []);

  return wrapperRef;
}

export default function CTAButton({
  children,
  variant = "primary",
  className = "",
  size = "md",
  href,
  onClick,
  type,
  loading,
  disabled,
  "aria-label": ariaLabel,
}: CTAButtonProps) {
  const wrapperRef = useInViewClass();
  const variantClass = variant === "secondary" ? "opacity-80" : "";
  const inner = (
    <span className={`cta-btn-inside block ${sizeMap[size]} ${variantClass}`}>
      {children}
    </span>
  );

  if (href) {
    return (
      <div ref={wrapperRef} className="inline-block">
        <Link
          href={href}
          className={`cta-btn inline-block ${className}`}
          aria-label={ariaLabel}
        >
          {inner}
        </Link>
      </div>
    );
  }

  if (type === "submit") {
    const isDisabled = disabled || loading;
    return (
      <div ref={wrapperRef} className="inline-block">
        <button
          type="submit"
          className={`cta-btn relative ${isDisabled ? "pointer-events-none opacity-50" : ""} ${className}`}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-busy={loading}
        >
          <span className={`cta-btn-inside block ${sizeMap[size]} ${variantClass} ${loading ? "opacity-0" : ""}`}>
            {children}
          </span>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="inline-block">
      <button
        type="button"
        onClick={onClick}
        className={`cta-btn ${className}`}
        aria-label={ariaLabel}
      >
        {inner}
      </button>
    </div>
  );
}
