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

  try {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`[ARTICLE GEN] Step 2: Planning article for "${keyword}"...`);

    const planResponse = await callClaude(
      ARTICLE_PLAN_SYSTEM_PROMPT,
      ARTICLE_PLAN_USER_PROMPT(keyword, today, research_data),
      4096,
      100_000, // 100s timeout — plan is a small JSON response
    );

    const parsed = extractJson(planResponse.text, planResponse.stopReason);
    const planResult = articlePlanResponseSchema.safeParse(parsed);

    if (!planResult.success) {
      const issues = planResult.error.issues.map((i) => i.message).join(", ");
      console.error("Plan response failed validation:", issues);
      throw new Error(`Plan validation failed: ${issues}`);
    }

    const tokensUsed = planResponse.inputTokens + planResponse.outputTokens;

    // Log cost
    const inputCost = planResponse.inputTokens * 0.000003;
    const outputCost = planResponse.outputTokens * 0.000015;
    console.log(
      `[ARTICLE GEN] Step 2 complete: keyword="${keyword}" | ` +
        `model=${ARTICLE_MODEL} | tokens=${tokensUsed} | cost=$${(inputCost + outputCost).toFixed(4)}`,
    );

    // Return the full plan JSON as a string for the write step
    const planJson = JSON.stringify(planResult.data);

    return createSuccessResponse({
      success: true,
      job_id,
      keyword,
      article_plan: planJson,
      image_prompt: planResult.data.image_prompt || null,
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
