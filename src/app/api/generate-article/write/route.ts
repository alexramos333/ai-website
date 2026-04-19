import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeArticleSchema, articlePlanResponseSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  slugify,
} from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";
import {
  ARTICLE_MODEL,
  verifyToken,
  extractBearerToken,
  callClaude,
} from "@/lib/article-generation";
import {
  ARTICLE_WRITE_SYSTEM_PROMPT,
  ARTICLE_WRITE_USER_PROMPT,
} from "@/lib/prompts/blog-article";
import { markdownToHtml } from "@/lib/markdown";

export const maxDuration = 300;

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

  const parseResult = writeArticleSchema.safeParse(body);
  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { job_id, article_plan, publish = true, tags: extraTags } = parseResult.data;
  const authorId = parseResult.data.author_id ?? process.env.DEFAULT_AUTHOR_ID;

  if (!authorId) {
    return createErrorResponse(
      "No author_id provided and DEFAULT_AUTHOR_ID is not configured.",
      400,
    );
  }

  const supabase = createAdminClient();

  // Fetch job to get keyword and verify it exists
  const { data: job, error: jobError } = await supabase
    .from("article_generations")
    .select("id, keyword, status")
    .eq("id", job_id)
    .single();

  if (jobError || !job) {
    return createErrorResponse("Generation job not found.", 404);
  }

  if (job.status !== "in_progress") {
    return createErrorResponse(
      `Job ${job_id} is in "${job.status}" status, expected "in_progress".`,
      409,
    );
  }

  const keyword = job.keyword;

  // Parse the article plan to extract metadata
  let plan: ReturnType<typeof articlePlanResponseSchema.parse>;
  try {
    const planData = JSON.parse(article_plan);
    plan = articlePlanResponseSchema.parse(planData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    return createErrorResponse(`Invalid article_plan: ${msg}`, 400);
  }

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`[ARTICLE GEN] Step 3: Writing article for "${keyword}"...`);

    const stepStart = Date.now();

    // Call Claude — outputs raw Markdown (no JSON parsing needed!)
    let markdownContent: string;

    try {
      const writeResponse = await callClaude(
        ARTICLE_WRITE_SYSTEM_PROMPT,
        ARTICLE_WRITE_USER_PROMPT(keyword, today, article_plan),
        12000,
        250_000, // 250s timeout
      );
      totalInputTokens += writeResponse.inputTokens;
      totalOutputTokens += writeResponse.outputTokens;

      markdownContent = writeResponse.text.trim();

      if (writeResponse.stopReason === "max_tokens") {
        console.warn(`[ARTICLE GEN] Article truncated at max_tokens. Using what we have.`);
      }
    } catch (firstError) {
      // Retry with shorter target if we have time
      const elapsed = Date.now() - stepStart;
      const remaining = 290_000 - elapsed;

      if (remaining < 40_000) {
        throw firstError;
      }

      const firstMsg = firstError instanceof Error ? firstError.message : "Unknown";
      console.warn(`[ARTICLE GEN] First attempt failed: ${firstMsg}. Retrying (${Math.round(remaining / 1000)}s remaining)...`);

      const retryResponse = await callClaude(
        ARTICLE_WRITE_SYSTEM_PROMPT,
        ARTICLE_WRITE_USER_PROMPT(keyword, today, article_plan) +
          "\n\nIMPORTANT: Keep the article under 1500 words. A complete shorter article is much better than no article.",
        6000,
        remaining - 15_000,
      );
      totalInputTokens += retryResponse.inputTokens;
      totalOutputTokens += retryResponse.outputTokens;

      markdownContent = retryResponse.text.trim();
    }

    // Strip markdown fences if Claude wrapped the whole response
    if (markdownContent.startsWith("```")) {
      markdownContent = markdownContent
        .replace(/^```(?:markdown|md)?\s*\n?/, "")
        .replace(/\n?\s*```$/, "");
    }

    // Validate we got meaningful content
    if (markdownContent.length < 500) {
      throw new Error("Claude returned an article that was too short (under 500 characters).");
    }

    // Convert Markdown to HTML
    const htmlContent = await markdownToHtml(markdownContent);

    // Extract metadata from the plan
    const title = sanitizeText(plan.title, 200);
    const excerpt = sanitizeText(plan.excerpt, 500);
    const metaTitle = sanitizeText(plan.meta_title, 200);
    const metaDescription = sanitizeText(plan.meta_description, 500);
    const slug = plan.slug ? sanitizeText(plan.slug, 200) : slugify(title);

    // Merge generated tags with extra tags
    const allTags = [
      ...new Set([
        ...plan.tags.map((t: string) => t.toLowerCase()),
        ...(extraTags ?? []).map((t) => t.toLowerCase()),
      ]),
    ];

    // Embed FAQ schema as a JSON-LD comment in content
    const faqSchemaJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: plan.faq_data.map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });

    const contentWithFaqMarker = `${htmlContent}\n<!-- FAQ_SCHEMA:${faqSchemaJson} -->`;

    // Insert article into database
    const { data: insertedArticle, error: insertError } = await supabase
      .from("articles")
      .insert({
        title,
        slug,
        content: contentWithFaqMarker,
        excerpt,
        meta_title: metaTitle,
        meta_description: metaDescription,
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        tags: allTags,
        author_id: authorId,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("Article insert error:", insertError.message);
      if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        throw new Error(`Article with slug "${slug}" already exists in the database.`);
      }
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    const tokensUsed = totalInputTokens + totalOutputTokens;

    // Log cost (Sonnet 4.5 pricing: $3/M input, $15/M output)
    const inputCost = totalInputTokens * 0.000003;
    const outputCost = totalOutputTokens * 0.000015;
    console.log(
      `[ARTICLE GEN] Step 3 complete: keyword="${keyword}" | slug="${insertedArticle.slug}" | ` +
        `model=${ARTICLE_MODEL} | tokens=${tokensUsed} | cost=$${(inputCost + outputCost).toFixed(4)}`,
    );

    // Update generation tracking with article_id
    await supabase
      .from("article_generations")
      .update({
        article_id: insertedArticle.id,
        model_used: ARTICLE_MODEL,
        tokens_used: tokensUsed,
      })
      .eq("id", job_id);

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

    return createSuccessResponse(
      {
        success: true,
        job_id,
        article: {
          id: insertedArticle.id,
          slug: insertedArticle.slug,
          url: `${siteUrl}/blog/${insertedArticle.slug}`,
        },
        image_prompt: plan.image_prompt || null,
        tokens_used: tokensUsed,
      },
      201,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ARTICLE GEN] Write failed: keyword="${keyword}" error="${errorMessage}"`);

    await supabase
      .from("article_generations")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return createErrorResponse(`Article writing failed: ${errorMessage}`, 500);
  }
}
