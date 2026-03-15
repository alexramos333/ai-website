import GlassCard from "@/components/ui/GlassCard";

export default function BlogLoading() {
  return (
    <div className="section-padding mx-auto max-w-7xl pt-28">
      {/* Heading skeleton */}
      <div className="mx-auto mb-12 text-center">
        <div className="mx-auto h-10 w-72 animate-pulse rounded-lg bg-white/10" />
        <div className="mx-auto mt-4 h-5 w-96 max-w-full animate-pulse rounded-lg bg-white/5" />
        <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-[#FF9B60] to-[#f2295b]" />
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCard key={i}>
            <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/5" />
            <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/5" />
            <div className="mt-4 flex gap-3">
              <div className="h-3 w-24 animate-pulse rounded bg-white/5" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/5" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
