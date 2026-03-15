import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";

export default function NotFound() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4">
      <GlassCard className="max-w-md text-center" padding="lg">
        <p className="text-6xl font-black text-white/20">404</p>
        <h1
          className="mt-4 font-black text-white text-glow"
          style={{ fontSize: "clamp(1.75rem, 5vw, 3.5rem)" }}
        >
          Page Not Found
        </h1>
        <p className="mt-3 text-white/75">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <CTAButton href="/" aria-label="Return to home page">
            Back to Home
          </CTAButton>
        </div>
      </GlassCard>
    </div>
  );
}
