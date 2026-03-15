import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  validateAdminUser,
} from "@/lib/utils/api";

const publishSchema = z.object({
  slug: z.string(),
  published: z.boolean(),
});

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
    const result = publishSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const updateData = result.data.published
      ? { published: true, published_at: new Date().toISOString() }
      : { published: false };

    const { data, error } = await supabase
      .from("articles")
      .update(updateData)
      .eq("slug", result.data.slug)
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
