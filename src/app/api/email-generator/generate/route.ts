import { type NextRequest } from "next/server";
import { createMessageWithTimeout } from "@/lib/anthropic";
import { emailGenerateSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
} from "@/lib/utils/api";
import { SYSTEM_PROMPTS, SEQUENCE_TYPES } from "@/components/email-generator/constants";
import type { SequenceType } from "@/components/email-generator/constants";

function parseJsonResponse(text: string): unknown {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned);
}

export const runtime = "nodejs";
// Full multi-email sequence generation (8192 tokens) takes ~35-40s; give it
// article-tier headroom rather than the 60s default used by the lighter tools.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const rateLimitKey = `email-gen:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = emailGenerateSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { sequenceType } = result.data;
    const typeInfo = SEQUENCE_TYPES[sequenceType as SequenceType];
    const systemPrompt = SYSTEM_PROMPTS[sequenceType as SequenceType];

    const message = await createMessageWithTimeout({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system: [
        {
          type: "text",
          text: systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Generate a complete ${typeInfo.name} with exactly ${typeInfo.emailCount} emails. Follow every blueprint and rule exactly as specified. Return ONLY valid JSON.`,
        },
      ],
    }, 115_000);

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("No response generated.", 500);
    }

    const parsed = parseJsonResponse(textBlock.text);

    return createSuccessResponse(parsed);
  } catch (error) {
    console.error("Email generator error:", error);
    return createErrorResponse("Failed to generate email sequence. Please try again.", 500);
  }
}
