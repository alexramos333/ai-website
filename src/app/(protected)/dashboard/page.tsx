import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/queries";
import GlassCard from "@/components/ui/GlassCard";
import CTALink from "@/components/ui/CTALink";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "User";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="section-padding mx-auto max-w-5xl">
      <h1 className="mb-2 font-black text-white" style={{ fontSize: "clamp(1.75rem, 5vw, 3.5rem)" }}>
        Welcome, {displayName}
      </h1>
      <p className="mb-10 text-white/75">
        {memberSince && <>Member since {memberSince}</>}
        {profile?.role && memberSince && <> &middot; </>}
        {profile?.role && (
          <span className="capitalize">{profile.role}</span>
        )}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard padding="lg">
          <h2 className="mb-3 font-black text-white" style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}>Profile</h2>
          <p className="mb-6 text-sm text-white/75">
            Update your personal information and bio.
          </p>
          <CTALink href="/profile" size="sm" aria-label="Edit your profile">
            Edit Profile
          </CTALink>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="mb-3 font-black text-white" style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}>Articles</h2>
          <p className="mb-6 text-sm text-white/75">
            Manage your published and draft articles.
          </p>
          <CTALink href="/dashboard" size="sm" variant="secondary" aria-label="View articles (coming soon)">
            Coming Soon
          </CTALink>
        </GlassCard>

        <GlassCard padding="lg">
          <h2 className="mb-3 font-black text-white" style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}>Contacts</h2>
          <p className="mb-6 text-sm text-white/75">
            View messages from the contact form.
          </p>
          <CTALink href="/dashboard" size="sm" variant="secondary" aria-label="View contacts (coming soon)">
            Coming Soon
          </CTALink>
        </GlassCard>
      </div>
    </div>
  );
}
