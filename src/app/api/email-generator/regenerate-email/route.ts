import { type NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { emailRegenerateSchema } from "@/lib/utils/validation";
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
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  const rateLimitKey = `email-regen:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = emailRegenerateSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { sequenceType, emailNumber, emailName, previousBody } = result.data;
    const systemPrompt = SYSTEM_PROMPTS[sequenceType as SequenceType];
    const typeInfo = SEQUENCE_TYPES[sequenceType as SequenceType];

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
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
          content: `Regenerate ONLY Email ${emailNumber} — "${emailName}" for a ${typeInfo.name}.

Generate a completely different version of this email. Do not repeat the same opening line, story, or angle. Take a different approach while keeping the same framework and goal.

The previous version of this email body was:
"${previousBody.slice(0, 2000)}"

Generate a fresh version that is distinctly different. Return ONLY a valid JSON object for this single email matching this schema:
{
  "emailNumber": ${emailNumber},
  "name": "${emailName}",
  "sendTiming": "when to send",
  "framework": "framework used",
  "goal": "goal of this email",
  "subjectLines": ["subject 1", "subject 2", "subject 3"],
  "previewText": "preview text",
  "openingLine": "opening line",
  "body": "full email body",
  "cta": "call to action text",
  "psLine": "P.S. line"
}

Return ONLY the JSON object. No markdown fences. No explanation.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("No response generated.", 500);
    }

    const parsed = parseJsonResponse(textBlock.text);

    return createSuccessResponse(parsed);
  } catch (error) {
    console.error("Email regeneration error:", error);
    return createErrorResponse("Failed to regenerate email. Please try again.", 500);
  }
}
