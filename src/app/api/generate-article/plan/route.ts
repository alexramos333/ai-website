import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { planArticleSchema, articlePlanResponseSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
} from "@/lib/utils/api";
import {
  ARTICLE_MODEL,
  verifyToken,
  extractBearerToken,
  callClaude,
  extractJson,
} from "@/lib/article-generation";
import {
  ARTICLE_PLAN_SYSTEM_PROMPT,
  ARTICLE_PLAN_USER_PROMPT,
} from "@/lib/prompts/blog-article";

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

  const parseResult = planArticleSchema.safeParse(body);
  if (!parseResult.success) {
    return createValidationErrorResponse(parseResult.error);
  }

  const { job_id, research_data } = parseResult.data;
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

    console.log(`[ARTICLE GEN] Step 2: Planning article for "${keyword}" | research_data=${research_data.length} chars`);

    const stepStart = Date.now();
    let parsed: unknown;
    let planResult: ReturnType<typeof articlePlanResponseSchema.safeParse>;

    // First attempt — max_tokens=4096, 100s timeout (maxDuration=120s)
    try {
      const planResponse = await callClaude(
        ARTICLE_PLAN_SYSTEM_PROMPT,
        ARTICLE_PLAN_USER_PROMPT(keyword, today, research_data),
        4096,
        100_000,
      );
      totalInputTokens += planResponse.inputTokens;
      totalOutputTokens += planResponse.outputTokens;

      parsed = extractJson(planResponse.text, planResponse.stopReason);
      planResult = articlePlanResponseSchema.safeParse(parsed);

      if (!planResult.success) {
        const issues = planResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ");
        console.error(`[ARTICLE GEN] Plan validation failed: ${issues}`);
        throw new Error(`Plan validation failed: ${issues}`);
      }
    } catch (firstError) {
      // Retry with compact instructions if we have time
      const elapsed = Date.now() - stepStart;
      const remaining = 100_000 - elapsed; // 100s budget (maxDuration=120)

      if (remaining < 30_000) {
        throw firstError;
      }

      const firstMsg = firstError instanceof Error ? firstError.message : "Unknown";
      console.warn(`[ARTICLE GEN] Plan first attempt failed: ${firstMsg}. Retrying with compact prompt (${Math.round(remaining / 1000)}s remaining)...`);

      const retryResponse = await callClaude(
        ARTICLE_PLAN_SYSTEM_PROMPT,
        ARTICLE_PLAN_USER_PROMPT(keyword, today, research_data) +
          "\n\nIMPORTANT: Keep key_points to 5 words max each. Limit outline to 8 sections. Keep FAQ answers to 1-2 sentences. Produce compact JSON.",
        4096,
        remaining - 10_000,
      );
      totalInputTokens += retryResponse.inputTokens;
      totalOutputTokens += retryResponse.outputTokens;

      parsed = extractJson(retryResponse.text, retryResponse.stopReason);
      planResult = articlePlanResponseSchema.safeParse(parsed);

      if (!planResult.success) {
        const issues = planResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" | ");
        console.error(`[ARTICLE GEN] Plan validation failed after retry: ${issues}`);
        throw new Error(`Plan failed after retry. First: ${firstMsg}`);
      }
    }

    const plan = planResult.data;
    const tokensUsed = totalInputTokens + totalOutputTokens;

    // Log plan details
    const inputCost = totalInputTokens * 0.000003;
    const outputCost = totalOutputTokens * 0.000015;
    console.log(
      `[ARTICLE GEN] Step 2 complete: keyword="${keyword}" | ` +
        `outline_sections=${plan.outline.length} | faq_items=${plan.faq_data.length} | ` +
        `model=${ARTICLE_MODEL} | tokens=${tokensUsed} | cost=$${(inputCost + outputCost).toFixed(4)}`,
    );

    // Return the full plan JSON as a string for the write step
    const planJson = JSON.stringify(plan);
    console.log(`[ARTICLE GEN] Plan JSON size: ${planJson.length} chars`);

    return createSuccessResponse({
      success: true,
      job_id,
      keyword,
      article_plan: planJson,
      image_prompt: plan.image_prompt || null,
      tokens_used: tokensUsed,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[ARTICLE GEN] Plan failed: keyword="${keyword}" error="${errorMessage}"`);

    await supabase
      .from("article_generations")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job_id);

    return createErrorResponse(`Article planning failed: ${errorMessage}`, 500);
  }
}
