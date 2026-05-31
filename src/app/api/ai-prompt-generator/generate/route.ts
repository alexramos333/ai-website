// ============================================================
// ACTION REQUIRED BEFORE GOING TO PRODUCTION:
// Set a hard monthly + daily spend cap in your Anthropic Console at:
// https://platform.anthropic.com -> Billing -> Usage Limits
// Recommended: Set a daily cap of $5 and monthly cap appropriate
// for your expected traffic BEFORE launching this feature publicly.
// ============================================================

import { type NextRequest } from "next/server";
import { createMessageWithTimeout } from "@/lib/anthropic";
import { aiPromptGeneratorSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
} from "@/lib/utils/api";
import {
  SYSTEM_PROMPT,
  INJECTION_PATTERNS,
  MAX_INPUT_CHARS,
  MAX_INPUT_TOKENS,
  MAX_OUTPUT_TOKENS,
} from "@/components/ai-prompt-generator/constants";

// ─── Guardrail 6: Input Sanitization ───

function sanitizeInput(input: string): string {
  // Strip HTML tags
  let cleaned = input.replace(/<[^>]*>/g, "");
  // Trim whitespace
  cleaned = cleaned.trim();
  // Collapse multiple consecutive newlines to max 2
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  return cleaned;
}

// ─── Guardrail 6: Prompt Injection Detection ───

function detectInjection(input: string): boolean {
  const lower = input.toLowerCase();
  return INJECTION_PATTERNS.some((pattern) => {
    if (pattern.startsWith("\\b")) {
      // Regex pattern (word boundary)
      const regex = new RegExp(pattern, "i");
      return regex.test(lower);
    }
    return lower.includes(pattern);
  });
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // ─── Guardrail 3: Dual Rate Limiting (10/hr AND 50/day) ───
  const ip = getRateLimitKey(request);
  const hourlyKey = `ai-prompt:hourly:${ip}`;
  const dailyKey = `ai-prompt:daily:${ip}`;

  const { allowed: hourlyAllowed } = checkRateLimit(hourlyKey, 10, 3_600_000);
  if (!hourlyAllowed) {
    return createErrorResponse(
      "You've reached your request limit. Please try again later.",
      429,
    );
  }

  const { allowed: dailyAllowed } = checkRateLimit(dailyKey, 50, 86_400_000);
  if (!dailyAllowed) {
    return createErrorResponse(
      "You've reached your request limit. Please try again later.",
      429,
    );
  }

  try {
    const body: unknown = await request.json();
    const result = aiPromptGeneratorSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const rawPrompt = result.data.prompt;

    // ─── Guardrail 4: Backend Character Limit ───
    if (rawPrompt.length > MAX_INPUT_CHARS) {
      return createErrorResponse(
        "Your input is too long. Please shorten your prompt and try again.",
        400,
      );
    }

    // ─── Guardrail 6: Sanitize Input ───
    const sanitized = sanitizeInput(rawPrompt);

    // ─── Guardrail 6: Prompt Injection Detection ───
    if (detectInjection(sanitized)) {
      console.warn(
        `[INJECTION BLOCKED] ${new Date().toISOString()} | Input: ${sanitized.slice(0, 100)}...`,
      );
      return createErrorResponse(
        "Prompt rejected due to policy violation guidelines.",
        400,
      );
    }

    // ─── Guardrail 2: Input Token Pre-flight Check ───
    const estimatedTokens = sanitized.length / 4;
    if (estimatedTokens > MAX_INPUT_TOKENS) {
      return createErrorResponse(
        "Your input is too long. Please shorten your prompt and try again.",
        400,
      );
    }

    // ─── Guardrail 1 + 5 + 6: API Call with hard max_tokens and prompt caching ───
    const message = await createMessageWithTimeout({
      model: "claude-haiku-4-5-20251001",
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: sanitized }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("No response generated.", 500);
    }

    // ─── Guardrail 9: Per-Request Cost Logger ───
    const inputCost = message.usage.input_tokens * 0.000001;
    const outputCost = message.usage.output_tokens * 0.000005;
    const totalCost = inputCost + outputCost;

    console.log(
      `[COST LOG] $${totalCost.toFixed(6)} | Input: ${message.usage.input_tokens} tokens | Output: ${message.usage.output_tokens} tokens`,
    );

    if (totalCost > 0.1) {
      console.warn(
        "[COST WARNING] Request exceeded 50% of the $0.20 max threshold.",
      );
    }

    return createSuccessResponse({ result: textBlock.text });
  } catch (error) {
    // ─── Guardrail 10: Graceful Error Handling ───
    console.error("AI Prompt Generator error:", error);
    return createErrorResponse(
      "Something went wrong. Please try again in a moment.",
      500,
    );
  }
}
