import { getUser, getProfile } from "@/lib/supabase/queries";
import Header from "@/components/layout/Header";

export default async function AuthHeader() {
  const user = await getUser();

  if (!user) {
    return <Header />;
  }

  const profile = await getProfile(user.id);

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email ||
    "User";

  return <Header user={{ fullName }} />;
}
