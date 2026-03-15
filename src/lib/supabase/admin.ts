// WARNING: This client uses the service_role key which bypasses RLS.
// NEVER import this file in client components or expose it to the browser.
// Use only in server-side API routes and Server Actions.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
