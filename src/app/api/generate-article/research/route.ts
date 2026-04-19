import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateArticleSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
} from "@/lib/utils/api";
import { verifyToken, extractBearerToken, callClaude, extractJson } from "@/lib/article-generation";
import {
  KEYWORD_RESEARCH_SYSTEM_PROMPT,
  KEYWORD_RESEARCH_USER_PROMPT,
} from "@/lib/prompts/blog-article";

export const maxDuration = 120;

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

  const parseResult = generateArticleSchema.safeParse(body);
  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { keyword } = parseResult.data;
  const supabase = createAdminClient();

  // Check for duplicate keyword (already completed or actively in progress)
  const { data: existing } = await supabase
    .from("article_generations")
    .select("id, status, article_id, created_at")
    .eq("keyword", keyword.toLowerCase().trim())
    .in("status", ["completed", "in_progress"])
    .limit(1);

  if (existing && existing.length > 0) {
    const entry = existing[0];
    if (entry.status === "in_progress") {
      // If the job has been "in_progress" for over 10 minutes, it's stale — auto-fail it
      const ageMs = Date.now() - new Date(entry.created_at).getTime();
      if (ageMs > 10 * 60 * 1000) {
        console.warn(`[ARTICLE GEN] Stale job ${entry.id} for "${keyword}" (${Math.round(ageMs / 60_000)}min old). Marking as failed.`);
        await supabase
          .from("article_generations")
          .update({ status: "failed", error_message: "Stale: timed out", completed_at: new Date().toISOString() })
          .eq("id", entry.id);
        // Fall through to create a new job
      } else {
        return createErrorResponse(
          `Article generation for "${keyword}" is already in progress.`,
          409,
        );
      }
    } else {
      return createErrorResponse(
        `Article for "${keyword}" already exists (generation ${entry.id}).`,
        409,
      );
    }
  }

  // Create tracking row
  const { data: job, error: jobError } = await supabase
    .from("article_generations")
    .insert({ keyword: keyword.toLowerCase().trim(), status: "in_progress" })
    .select("id")
    .single();

  if (jobError || !job) {
    console.error("Failed to create generation job:", jobError?.message);
    return createErrorResponse("Failed to start generation.", 500);
  }

  try {
    console.log(`[ARTICLE GEN] Step 1: Researching keyword "${keyword}"...`);

    const researchResponse = await callClaude(
      KEYWORD_RESEARCH_SYSTEM_PROMPT,
      KEYWORD_RESEARCH_USER_PROMPT(keyword),
      4096,
    );

    let researchData: string;
    try {
      // Validate it's valid JSON, then pass as string
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

    const tokensUsed = researchResponse.inputTokens + researchResponse.outputTokens;
    console.log(`[ARTICLE GEN] Step 1 complete. Research: ${researchResponse.outputTokens} output tokens.`);

    return createSuccessResponse({
      success: true,
      job_id: job.id,
      keyword: keyword.toLowerCase().trim(),
      research_data: researchData,
      tokens_used: tokensUsed,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ARTICLE GEN] Research failed: keyword="${keyword}" error="${errorMessage}"`);

    await supabase
      .from("article_generations")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return createErrorResponse(`Research failed: ${errorMessage}`, 500);
  }
}
