import { createClient } from "@/lib/supabase/server";
import Header from "@/components/layout/Header";

export default async function AuthHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <Header />;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "User";

  return <Header user={{ fullName }} />;
}
