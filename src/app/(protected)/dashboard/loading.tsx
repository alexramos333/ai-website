export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-white/20 border-t-[#004be0]" />
        <p className="text-sm text-white/50">Loading dashboard...</p>
      </div>
    </div>
  );
}
