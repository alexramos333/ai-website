import { redirect } from "next/navigation";
import { getUser, getProfile } from "@/lib/supabase/queries";
import ProfileForm from "@/components/forms/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  return (
    <div className="section-padding">
      <ProfileForm
        initialData={{
          full_name: profile?.full_name ?? "",
          website: profile?.website ?? "",
          bio: profile?.bio ?? "",
        }}
      />
    </div>
  );
}
