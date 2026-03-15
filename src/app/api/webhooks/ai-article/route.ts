import { type NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { articleSchema } from "@/lib/utils/validation";
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse, slugify } from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";

const webhookArticleSchema = articleSchema.extend({
  author_id: z.string().uuid("author_id must be a valid UUID"),
});

function verifyToken(token: string, secret: string): boolean {
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);

  if (tokenBuffer.length !== secretBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

export async function POST(request: NextRequest) {
  const secret = process.env.AI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("AI_WEBHOOK_SECRET is not configured.");
    return createErrorResponse("Webhook not configured.", 500);
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !verifyToken(token, secret)) {
    return createErrorResponse("Invalid or missing authorization.", 401);
  }

  try {
    const body: unknown = await request.json();
    const result = webhookArticleSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const title = sanitizeText(result.data.title);
    const content = sanitizeText(result.data.content, 50_000);
    const excerpt = result.data.excerpt ? sanitizeText(result.data.excerpt) : undefined;
    const metaTitle = result.data.meta_title ? sanitizeText(result.data.meta_title, 200) : undefined;
    const metaDesc = result.data.meta_description ? sanitizeText(result.data.meta_description, 500) : undefined;
    const slug = result.data.slug || slugify(title);
    const admin = createAdminClient();

    const { data, error } = await admin
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
        author_id: result.data.author_id,
      })
      .select("id, slug")
      .single();

    if (error) {
      console.error("Webhook article insert error:", error.message);
      return createErrorResponse("Failed to create article.", 500);
    }

    console.log(
      `Webhook: article created at ${new Date().toISOString()}, slug: ${data.slug}`
    );

    return createSuccessResponse({ success: true, article: data }, 201);
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }
}
