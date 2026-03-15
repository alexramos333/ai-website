const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AI_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SITE_URL",
] as const;

export function checkEnv(): { missing: string[] } {
  const missing: string[] = [];
  for (const name of requiredEnvVars) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    console.warn(
      `[check-env] Missing environment variables: ${missing.join(", ")}`
    );
  }
  return { missing };
}
