"use client";

import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";

interface BlogErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function BlogError({ error, reset }: BlogErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <GlassCard className="max-w-md text-center" padding="lg">
        <h2
          className="font-black text-white"
          style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
        >
          Something went wrong
        </h2>
        <p className="mt-3 text-white/75">
          {error.message || "Failed to load blog content. Please try again."}
        </p>
        <div className="mt-6">
          <CTAButton onClick={reset} aria-label="Try loading the page again">
            Try Again
          </CTAButton>
        </div>
      </GlassCard>
    </div>
  );
}
