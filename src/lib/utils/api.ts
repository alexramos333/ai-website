import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodError } from "zod";
import type { Database } from "@/lib/database.types";
import { generateSlug } from "@/lib/utils/sanitize";

// ─── Response Helpers ───

export function createSuccessResponse(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, { status, headers });
}

export function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createValidationErrorResponse(zodError: ZodError): NextResponse {
  const fields: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const field = String(issue.path[0] ?? "_root");
    if (!fields[field]) {
      fields[field] = issue.message;
    }
  }
  return NextResponse.json({ error: "Validation failed.", fields }, { status: 400 });
}

// ─── Admin Validation ───

export async function validateAdminUser(
  supabase: SupabaseClient<Database>
): Promise<{ isAdmin: boolean; userId: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { isAdmin: false, userId: null };
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");

  if (rpcError || !isAdmin) {
    return { isAdmin: false, userId: user.id };
  }

  return { isAdmin: true, userId: user.id };
}

// ─── Rate Limiting ───
// Single-instance in-memory fallback. Replace with Upstash Redis or Vercel KV for production.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let callsSinceCleanup = 0;

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

export function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return ip;
}

export function checkRateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): { allowed: boolean } {
  callsSinceCleanup += 1;
  if (callsSinceCleanup >= 100) {
    callsSinceCleanup = 0;
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return { allowed: false };
  }

  return { allowed: true };
}

// ─── Slug Generation ───

export function slugify(text: string): string {
  return generateSlug(text);
}
