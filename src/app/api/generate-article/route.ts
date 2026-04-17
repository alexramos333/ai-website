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
  KEYWORD_RESEARCH_SYSTEM_PROMPT,
  KEYWORD_RESEARCH_USER_PROMPT,
  BLOG_ARTICLE_SYSTEM_PROMPT,
  BLOG_ARTICLE_USER_PROMPT,
} from "@/lib/prompts/blog-article";

const ARTICLE_MODEL = process.env.ARTICLE_GEN_MODEL || "claude-sonnet-4-5-20250929";

function verifyToken(token: string, secret: string): boolean {
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);
  if (tokenBuffer.length !== secretBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

/** Call Claude and return the text response. */
async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
): Promise<{ text: string; stopReason: string; inputTokens: number; outputTokens: number }> {
  const anthropic = getAnthropicClient();
  const message = await anthropic.messages.create({
    model: ARTICLE_MODEL,
    max_tokens: maxTokens,
    system: [
      {
        type: "text",
        text: systemPrompt,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude.");
  }

  return {
    text: textBlock.text,
    stopReason: message.stop_reason ?? "unknown",
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
  };
}

/** Try to extract valid JSON from Claude's response. Handles markdown fences and truncation. */
function extractJson(rawText: string, stopReason: string): unknown {
  let text = rawText.trim();

  // Strip markdown fences
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  // First try: parse as-is
  try {
    return JSON.parse(text);
  } catch {
    // If truncated at max_tokens, try to repair the JSON
    if (stopReason === "max_tokens") {
      console.warn("[ARTICLE GEN] Response truncated at max_tokens, attempting JSON repair...");
      return repairTruncatedJson(text);
    }
    throw new Error("Claude returned invalid JSON.");
  }
}

/** Attempt to repair truncated JSON by closing open structures. */
function repairTruncatedJson(text: string): unknown {
  let repaired = text.trim();

  // If we're inside a string value, close it
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }

  // Close any open arrays and objects by counting brackets
  const opens = { "{": 0, "[": 0 };
  let inString = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (ch === '"' && (i === 0 || repaired[i - 1] !== "\\")) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") opens["{"]++;
    if (ch === "}") opens["{"]--;
    if (ch === "[") opens["["]++;
    if (ch === "]") opens["["]--;
  }

  // Remove any trailing comma before closing
  repaired = repaired.replace(/,\s*$/, "");

  // Close open brackets
  for (let i = 0; i < opens["["]; i++) repaired += "]";
  for (let i = 0; i < opens["{"]; i++) repaired += "}";

  try {
    return JSON.parse(repaired);
  } catch {
    throw new Error("Claude returned truncated JSON that could not be repaired.");
  }
}

export const maxDuration = 120; // Allow up to 120s on Vercel Pro

export async function POST(request: NextRequest) {
  // Rate limit: 5 per 10 minutes
  const rateLimitKey = `gen-article:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 5, 600_000);
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

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ── Phase 1: Research the keyword ──
    console.log(`[ARTICLE GEN] Phase 1: Researching keyword "${keyword}"...`);

    const researchResponse = await callClaude(
      KEYWORD_RESEARCH_SYSTEM_PROMPT,
      KEYWORD_RESEARCH_USER_PROMPT(keyword),
      4096,
    );
    totalInputTokens += researchResponse.inputTokens;
    totalOutputTokens += researchResponse.outputTokens;

    let researchData: string;
    try {
      // Validate it's valid JSON, then pass as string to phase 2
      extractJson(researchResponse.text, researchResponse.stopReason);
      researchData = researchResponse.text.trim();
      // Strip markdown fences for clean embedding
      if (researchData.startsWith("```")) {
        researchData = researchData.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
    } catch {
      // If research JSON is invalid, use the raw text as context anyway
      console.warn("[ARTICLE GEN] Research phase returned non-JSON, using as raw context.");
      researchData = researchResponse.text.trim();
    }

    console.log(`[ARTICLE GEN] Phase 1 complete. Research: ${researchResponse.outputTokens} tokens.`);

    // ── Phase 2: Generate the article using research data ──
    console.log(`[ARTICLE GEN] Phase 2: Generating article for "${keyword}"...`);

    const articleResponse = await callClaude(
      BLOG_ARTICLE_SYSTEM_PROMPT,
      BLOG_ARTICLE_USER_PROMPT(keyword, today, researchData),
      16384,
    );
    totalInputTokens += articleResponse.inputTokens;
    totalOutputTokens += articleResponse.outputTokens;

    if (articleResponse.stopReason === "max_tokens") {
      console.warn(`[ARTICLE GEN] Article response was truncated (max_tokens). Attempting repair...`);
    }

    // Parse and validate the article JSON (with truncation repair if needed)
    let parsed: unknown;
    try {
      parsed = extractJson(articleResponse.text, articleResponse.stopReason);
    } catch (parseError) {
      // Retry once: ask Claude to produce a shorter article
      console.warn(`[ARTICLE GEN] First attempt failed JSON parse. Retrying with shorter target...`);

      const retryResponse = await callClaude(
        BLOG_ARTICLE_SYSTEM_PROMPT,
        BLOG_ARTICLE_USER_PROMPT(keyword, today, researchData) +
          "\n\nIMPORTANT: Keep the article under 1500 words to ensure the JSON fits within output limits. A complete shorter article is much better than a truncated one.",
        16384,
      );
      totalInputTokens += retryResponse.inputTokens;
      totalOutputTokens += retryResponse.outputTokens;

      try {
        parsed = extractJson(retryResponse.text, retryResponse.stopReason);
      } catch {
        const firstErr = parseError instanceof Error ? parseError.message : "Unknown";
        throw new Error(`JSON parse failed after retry. First attempt: ${firstErr}`);
      }
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

      if (insertError.message.includes("duplicate") || insertError.message.includes("unique")) {
        throw new Error(`Article with slug "${slug}" already exists in the database.`);
      }
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    const generationTimeMs = Date.now() - startTime;
    const tokensUsed = totalInputTokens + totalOutputTokens;

    // Log cost (Sonnet 4.5 pricing: $3/M input, $15/M output)
    const inputCost = totalInputTokens * 0.000003;
    const outputCost = totalOutputTokens * 0.000015;
    console.log(
      `[ARTICLE GEN] keyword="${keyword}" | slug="${insertedArticle.slug}" | ` +
      `model=${ARTICLE_MODEL} | tokens=${tokensUsed} | cost=$${(inputCost + outputCost).toFixed(4)} | ` +
      `time=${generationTimeMs}ms`,
    );

    // Update generation tracking
    await supabase
      .from("article_generations")
      .update({
        status: "completed",
        article_id: insertedArticle.id,
        model_used: ARTICLE_MODEL,
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
          model: ARTICLE_MODEL,
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
