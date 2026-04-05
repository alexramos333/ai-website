import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSuccessResponse, createErrorResponse, getRateLimitKey, checkRateLimit } from "@/lib/utils/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const rateLimitKey = `view:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests.", 429);
  }

  const { slug } = await params;

  if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/.test(slug)) {
    return createErrorResponse("Invalid slug.", 400);
  }

  const admin = createAdminClient();

  const { data: article, error: fetchError } = await admin
    .from("articles")
    .select("id, view_count")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (fetchError || !article) {
    return createErrorResponse("Article not found.", 404);
  }

  const { error: updateError } = await admin
    .from("articles")
    .update({ view_count: article.view_count + 1 })
    .eq("id", article.id);

  if (updateError) {
    console.error("View count increment error:", updateError.message);
    return createErrorResponse("Failed to increment view count.", 500);
  }

  return createSuccessResponse({ success: true });
}
