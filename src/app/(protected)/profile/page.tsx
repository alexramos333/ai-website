import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/forms/ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, website, bio")
    .eq("id", user.id)
    .single();

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
