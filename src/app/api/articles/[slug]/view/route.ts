import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSuccessResponse, createErrorResponse } from "@/lib/utils/api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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
