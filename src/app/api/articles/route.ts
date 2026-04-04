import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { articleSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  validateAdminUser,
  slugify,
} from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 10, 1), 50);
  const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);
  const tag = searchParams.get("tag");

  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("id, title, slug, excerpt, tags, published_at, view_count")
    .eq("published", true);

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data, error } = await query
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Articles fetch error:", error.message);
    return createErrorResponse("Failed to fetch articles.", 500);
  }

  return createSuccessResponse(data, 200, {
    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
  });
}

export async function POST(request: NextRequest) {
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
    const result = articleSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const title = sanitizeText(result.data.title);
    const content = sanitizeText(result.data.content, 50_000);
    const excerpt = result.data.excerpt ? sanitizeText(result.data.excerpt) : undefined;
    const metaTitle = result.data.meta_title ? sanitizeText(result.data.meta_title, 200) : undefined;
    const metaDesc = result.data.meta_description ? sanitizeText(result.data.meta_description, 500) : undefined;
    const slug = result.data.slug || slugify(title);

    const { data, error } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        content,
        excerpt,
        meta_title: metaTitle,
        meta_description: metaDesc,
        og_image: result.data.og_image,
        published: result.data.published,
        published_at: result.data.published ? new Date().toISOString() : null,
        tags: result.data.tags,
        author_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Article create error:", error.message);
      return createErrorResponse("Failed to create article.", 500);
    }

    return createSuccessResponse(data, 201);
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }
}
