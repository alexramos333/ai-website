import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeArticleSchema, generatedArticleResponseSchema } from "@/lib/utils/validation";
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
  extractJson,
} from "@/lib/article-generation";
import {
  BLOG_ARTICLE_SYSTEM_PROMPT,
  BLOG_ARTICLE_USER_PROMPT,
} from "@/lib/prompts/blog-article";

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

  const { job_id, research_data, publish = true, tags: extraTags } = parseResult.data;
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
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`[ARTICLE GEN] Step 2: Writing article for "${keyword}"...`);

    const stepStart = Date.now();
    let parsed: unknown;
    let articleResult: ReturnType<typeof generatedArticleResponseSchema.safeParse>;

    // First attempt — 250s timeout (this step has a full 300s budget)
    try {
      const articleResponse = await callClaude(
        BLOG_ARTICLE_SYSTEM_PROMPT,
        BLOG_ARTICLE_USER_PROMPT(keyword, today, research_data),
        16384,
        250_000,
      );
      totalInputTokens += articleResponse.inputTokens;
      totalOutputTokens += articleResponse.outputTokens;

      if (articleResponse.stopReason === "max_tokens") {
        console.warn(`[ARTICLE GEN] Article response truncated (max_tokens). Attempting repair...`);
      }

      parsed = extractJson(articleResponse.text, articleResponse.stopReason);
      articleResult = generatedArticleResponseSchema.safeParse(parsed);

      if (!articleResult.success) {
        const issues = articleResult.error.issues.map((i) => i.message).join(", ");
        throw new Error(`Schema validation failed: ${issues}`);
      }
    } catch (firstError) {
      // Only retry if we have enough time remaining (at least 40s)
      const elapsed = Date.now() - stepStart;
      const remaining = 290_000 - elapsed;

      if (remaining < 40_000) {
        throw firstError; // No time for retry — let Apps Script retry the step
      }

      const firstMsg = firstError instanceof Error ? firstError.message : "Unknown";
      console.warn(`[ARTICLE GEN] First attempt failed: ${firstMsg}. Retrying with shorter target (${Math.round(remaining / 1000)}s remaining)...`);

      const retryResponse = await callClaude(
        BLOG_ARTICLE_SYSTEM_PROMPT,
        BLOG_ARTICLE_USER_PROMPT(keyword, today, research_data) +
          "\n\nIMPORTANT: Keep the article under 1500 words to ensure the JSON fits within output limits. A complete shorter article is much better than a truncated one.",
        8192,
        remaining - 15_000, // Leave 15s for DB operations
      );
      totalInputTokens += retryResponse.inputTokens;
      totalOutputTokens += retryResponse.outputTokens;

      parsed = extractJson(retryResponse.text, retryResponse.stopReason);
      articleResult = generatedArticleResponseSchema.safeParse(parsed);

      if (!articleResult.success) {
        console.error("Claude response failed validation after retry:", articleResult.error.issues);
        throw new Error(`Article generation failed after retry. First: ${firstMsg}`);
      }
    }

    const article = articleResult.data;

    // Sanitize all text fields
    const title = sanitizeText(article.title, 200);
    const content = sanitizeText(article.content, 100_000);
    const excerpt = sanitizeText(article.excerpt, 500);
    const metaTitle = sanitizeText(article.meta_title, 200);
    const metaDescription = sanitizeText(article.meta_description, 500);
    const slug = article.slug ? sanitizeText(article.slug, 200) : slugify(title);

    // Merge generated tags with extra tags
    const allTags = [
      ...new Set([
        ...article.tags.map((t: string) => t.toLowerCase()),
        ...(extraTags ?? []).map((t) => t.toLowerCase()),
      ]),
    ];

    // Embed FAQ schema as a JSON-LD comment in content
    const faqSchemaJson = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faq_data.map((faq: { question: string; answer: string }) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });

    const contentWithFaqMarker = `${content}\n<!-- FAQ_SCHEMA:${faqSchemaJson} -->`;

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
      `[ARTICLE GEN] Step 2 complete: keyword="${keyword}" | slug="${insertedArticle.slug}" | ` +
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
        image_prompt: article.image_prompt || null,
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
