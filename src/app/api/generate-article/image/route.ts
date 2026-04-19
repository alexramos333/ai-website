import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { imageStepSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from "@/lib/utils/api";
import { verifyToken, extractBearerToken } from "@/lib/article-generation";
import { generateBlogImage } from "@/lib/image-gen";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  // Verify bearer token
  const secret = process.env.AI_WEBHOOK_SECRET;
  if (!secret) {
    console.error("AI_WEBHOOK_SECRET is not configured.");
    return createErrorResponse("Webhook not configured.", 500);
  }

  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token || !verifyToken(token, secret)) {
    return createErrorResponse("Invalid or missing authorization.", 401);
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }

  const parseResult = imageStepSchema.safeParse(body);
  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { job_id, image_prompt } = parseResult.data;
  const supabase = createAdminClient();

  // Fetch job to get article_id and keyword
  const { data: job, error: jobError } = await supabase
    .from("article_generations")
    .select("id, keyword, article_id, status")
    .eq("id", job_id)
    .single();

  if (jobError || !job) {
    return createErrorResponse("Generation job not found.", 404);
  }

  if (!job.article_id) {
    return createErrorResponse("Job has no article_id — run the write step first.", 400);
  }

  // Fetch article for slug
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, slug, title")
    .eq("id", job.article_id)
    .single();

  if (articleError || !article) {
    return createErrorResponse("Article not found.", 404);
  }

  try {
    console.log(`[ARTICLE GEN] Step 4: Generating image for "${job.keyword}" (slug="${article.slug}") | image_prompt=${image_prompt ? image_prompt.length + " chars" : "none (using default)"}`);

    const prompt = image_prompt
      ? `Professional blog header image for an article about ${job.keyword}: ${image_prompt}`
      : `Professional blog header image: a photorealistic, visually striking scene representing the concept of ${job.keyword}. Clean composition, modern aesthetic, warm lighting. No text, words, letters, logos, or watermarks.`;

    const imageStart = Date.now();

    // Race image generation against a 90s timeout
    const ogImageUrl = await Promise.race([
      generateBlogImage(prompt, article.slug),
      new Promise<string>((resolve) =>
        setTimeout(() => {
          console.warn("[IMAGE GEN] Timed out after 90s.");
          resolve("");
        }, 90_000),
      ),
    ]);

    const imageElapsed = ((Date.now() - imageStart) / 1000).toFixed(1);

    if (ogImageUrl) {
      await supabase
        .from("articles")
        .update({ og_image: ogImageUrl })
        .eq("id", article.id);
      console.log(`[ARTICLE GEN] Step 4 complete: image=${ogImageUrl} | elapsed=${imageElapsed}s`);
    } else {
      console.warn(`[ARTICLE GEN] Step 4: Image generation failed or timed out after ${imageElapsed}s.`);
    }

    // Mark job as completed (article is already published regardless of image outcome)
    await supabase
      .from("article_generations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return createSuccessResponse({
      success: true,
      job_id,
      article_id: article.id,
      image_url: ogImageUrl || null,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ARTICLE GEN] Image step failed: keyword="${job.keyword}" error="${errorMessage}"`);

    // Still mark as completed — the article is already published
    await supabase
      .from("article_generations")
      .update({
        status: "completed",
        error_message: `Image generation failed: ${errorMessage}`,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    // Return success since the article exists — image is a bonus
    return createSuccessResponse({
      success: true,
      job_id,
      article_id: article.id,
      image_url: null,
    });
  }
}
