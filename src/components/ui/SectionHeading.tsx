import type { ReactNode } from "react";

const alignMap = {
  center: "mx-auto",
  left: "mr-auto",
} as const;

const accentMap = {
  orange: "from-[#FF9B60] to-[#f2295b]",
  blue: "from-[#5de6fc] to-[#6000ff]",
} as const;

interface SectionHeadingProps {
  children: ReactNode;
  subtitle?: string;
  align?: "left" | "center";
  accentColor?: "orange" | "blue";
  className?: string;
}

export default function SectionHeading({
  children,
  subtitle,
  align = "center",
  accentColor = "blue",
  className = "",
}: SectionHeadingProps) {
  const textAlign = align === "center" ? "text-center" : "text-left";

  return (
    <div className={`${textAlign} ${className}`}>
      <div className="glass-card px-6 py-6">
        <h2
          className="font-black text-white text-glow"
          style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
        >
          {children}
        </h2>
        <div
          className="mt-4 h-[3px] w-full rounded-full bg-[#5de6fc]"
        />
      </div>
    </div>
  );
}
