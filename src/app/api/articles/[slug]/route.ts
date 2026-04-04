import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { articleSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  validateAdminUser,
} from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !article) {
    return createErrorResponse("Article not found.", 404);
  }

  return createSuccessResponse(article, 200, CACHE_HEADERS);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAdmin, userId } = await validateAdminUser(supabase);

  if (!userId) {
    return createErrorResponse("Authentication required.", 401);
  }

  if (!isAdmin) {
    return createErrorResponse("Admin access required.", 403);
  }

  try {
    const body: unknown = await request.json();
    const result = articleSchema.partial().safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const sanitized = { ...result.data };
    if (sanitized.title) sanitized.title = sanitizeText(sanitized.title);
    if (sanitized.content) sanitized.content = sanitizeText(sanitized.content, 50_000);
    if (sanitized.excerpt) sanitized.excerpt = sanitizeText(sanitized.excerpt);
    if (sanitized.meta_title) sanitized.meta_title = sanitizeText(sanitized.meta_title, 200);
    if (sanitized.meta_description) sanitized.meta_description = sanitizeText(sanitized.meta_description, 500);

    const { data, error } = await supabase
      .from("articles")
      .update(sanitized)
      .eq("slug", slug)
      .select()
      .single();

    if (error || !data) {
      return createErrorResponse("Article not found.", 404);
    }

    return createSuccessResponse(data);
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isAdmin, userId } = await validateAdminUser(supabase);

  if (!userId) {
    return createErrorResponse("Authentication required.", 401);
  }

  if (!isAdmin) {
    return createErrorResponse("Admin access required.", 403);
  }

  const { data, error } = await supabase
    .from("articles")
    .delete()
    .eq("slug", slug)
    .select()
    .single();

  if (error || !data) {
    return createErrorResponse("Article not found.", 404);
  }

  return createSuccessResponse({ success: true });
}
