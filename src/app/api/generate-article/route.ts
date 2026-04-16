import { type NextRequest } from "next/server";
import crypto from "crypto";
import { getAnthropicClient } from "@/lib/anthropic";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateArticleSchema, generatedArticleResponseSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
  slugify,
} from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";
import {
  BLOG_ARTICLE_SYSTEM_PROMPT,
  BLOG_ARTICLE_USER_PROMPT,
} from "@/lib/prompts/blog-article";

function verifyToken(token: string, secret: string): boolean {
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);
  if (tokenBuffer.length !== secretBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

export const maxDuration = 120; // Allow up to 120s on Vercel Pro

export async function POST(request: NextRequest) {
  // Rate limit: 2 per minute to prevent accidental rapid-fire
  const rateLimitKey = `gen-article:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 2, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please wait before generating another article.", 429);
  }

  // Verify bearer token
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

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }

  const parseResult = generateArticleSchema.safeParse(body);
  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { keyword, publish = true, tags: extraTags } = parseResult.data;
  const authorId = parseResult.data.author_id ?? process.env.DEFAULT_AUTHOR_ID;

  if (!authorId) {
    return createErrorResponse(
      "No author_id provided and DEFAULT_AUTHOR_ID is not configured.",
      400,
    );
  }

  const supabase = createAdminClient();
  const startTime = Date.now();

  // Check for duplicate keyword (already completed or in progress)
  const { data: existing } = await supabase
    .from("article_generations")
    .select("id, status, article_id")
    .eq("keyword", keyword.toLowerCase().trim())
    .in("status", ["completed", "in_progress"])
    .limit(1);

  if (existing && existing.length > 0) {
    const entry = existing[0];
    if (entry.status === "in_progress") {
      return createErrorResponse(
        `Article generation for "${keyword}" is already in progress.`,
        409,
      );
    }
    return createErrorResponse(
      `Article for "${keyword}" already exists (generation ${entry.id}).`,
      409,
    );
  }

  // Create tracking row
  const { data: job, error: jobError } = await supabase
    .from("article_generations")
    .insert({ keyword: keyword.toLowerCase().trim(), status: "pending" })
    .select("id")
    .single();

  if (jobError || !job) {
    console.error("Failed to create generation job:", jobError?.message);
    return createErrorResponse("Failed to start generation.", 500);
  }

  // Mark as in_progress
  await supabase
    .from("article_generations")
    .update({ status: "in_progress" })
    .eq("id", job.id);

  try {
    // Generate the article with Claude
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20241022",
      max_tokens: 16000,
      system: [
        {
          type: "text",
          text: BLOG_ARTICLE_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        { role: "user", content: BLOG_ARTICLE_USER_PROMPT(keyword, today) },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude.");
    }

    // Parse and validate the JSON response
    let rawJson: string = textBlock.text.trim();

    // Strip markdown fences if Claude wrapped the response
    if (rawJson.startsWith("```")) {
      rawJson = rawJson.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      console.error("Failed to parse Claude response as JSON. Raw:", rawJson.slice(0, 500));
      throw new Error("Claude returned invalid JSON.");
    }

    const articleResult = generatedArticleResponseSchema.safeParse(parsed);
    if (!articleResult.success) {
      console.error("Claude response failed validation:", articleResult.error.issues);
      throw new Error("Claude response did not match expected schema.");
    }

    const article = articleResult.data;

    // Sanitize all text fields
    const title = sanitizeText(article.title, 200);
    const content = sanitizeText(article.content, 100_000);
    const excerpt = sanitizeText(article.excerpt, 500);
    const metaTitle = sanitizeText(article.meta_title, 200);
    const metaDescription = sanitizeText(article.meta_description, 500);
    const slug = article.slug ? sanitizeText(article.slug, 200) : slugify(title);

    // Merge generated tags with any extra tags from the request
    const allTags = [
      ...new Set([
        ...article.tags.map((t: string) => t.toLowerCase()),
        ...(extraTags ?? []).map((t) => t.toLowerCase()),
      ]),
    ];

    // Embed FAQ schema as a JSON-LD comment in content for the blog page to extract
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

    // Insert the article into Supabase
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

      // Handle duplicate slug
      if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        throw new Error(`Article with slug "${slug}" already exists in the database.`);
      }
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    const generationTimeMs = Date.now() - startTime;
    const tokensUsed = message.usage.input_tokens + message.usage.output_tokens;

    // Log cost
    const inputCost = message.usage.input_tokens * 0.000003;
    const outputCost = message.usage.output_tokens * 0.000015;
    console.log(
      `[ARTICLE GEN] keyword="${keyword}" | slug="${insertedArticle.slug}" | ` +
      `tokens=${tokensUsed} | cost=$${(inputCost + outputCost).toFixed(4)} | ` +
      `time=${generationTimeMs}ms`,
    );

    // Update generation tracking
    await supabase
      .from("article_generations")
      .update({
        status: "completed",
        article_id: insertedArticle.id,
        model_used: "claude-sonnet-4-5-20241022",
        tokens_used: tokensUsed,
        generation_time_ms: generationTimeMs,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

    return createSuccessResponse(
      {
        success: true,
        article: {
          id: insertedArticle.id,
          slug: insertedArticle.slug,
          url: `${siteUrl}/blog/${insertedArticle.slug}`,
        },
        generation: {
          keyword,
          tokens_used: tokensUsed,
          generation_time_ms: generationTimeMs,
        },
      },
      201,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ARTICLE GEN FAILED] keyword="${keyword}" | error="${errorMessage}"`);

    // Mark job as failed
    await supabase
      .from("article_generations")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return createErrorResponse(`Article generation failed: ${errorMessage}`, 500);
  }
}
