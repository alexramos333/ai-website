import Link from "next/link";
import type { ReactNode } from "react";

interface CTALinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  size?: "sm" | "md" | "lg";
  target?: string;
  rel?: string;
  "aria-label": string;
}

const sizeMap = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
} as const;

export default function CTALink({
  href,
  children,
  variant = "primary",
  className = "",
  size = "md",
  target,
  rel,
  "aria-label": ariaLabel,
}: CTALinkProps) {
  const variantClass = variant === "secondary" ? "opacity-80" : "";

  return (
    <Link
      href={href}
      className={`cta-btn cta-in-view inline-block ${className}`}
      aria-label={ariaLabel}
      {...(target && { target })}
      {...(rel && { rel })}
    >
      <span className={`cta-btn-inside block ${sizeMap[size]} ${variantClass}`}>
        {children}
      </span>
    </Link>
  );
}
