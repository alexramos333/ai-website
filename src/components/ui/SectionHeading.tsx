import type { ReactNode } from "react";

const alignMap = {
  center: "mx-auto",
  left: "mr-auto",
} as const;

interface SectionHeadingProps {
  children: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export default function SectionHeading({
  children,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const textAlign = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`${textAlign} ${className}`}>
      <h2
        className="font-black text-white text-glow"
        style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
      >
        {children}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg text-white/75">{subtitle}</p>
      )}
      <div
        className={`mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#FF9B60] to-[#f2295b] ${alignMap[align]}`}
      />
    </div>
  );
}
