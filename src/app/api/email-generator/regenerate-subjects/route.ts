import { type NextRequest } from "next/server";
import { createMessageWithTimeout } from "@/lib/anthropic";
import { emailRegenerateSubjectsSchema } from "@/lib/utils/validation";
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

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimitKey = `email-subj:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = emailRegenerateSubjectsSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { sequenceType, emailNumber, emailName, emailGoal, previousSubjects } = result.data;
    const systemPrompt = SYSTEM_PROMPTS[sequenceType as SequenceType];
    const typeInfo = SEQUENCE_TYPES[sequenceType as SequenceType];

    const message = await createMessageWithTimeout({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
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
          content: `Regenerate ONLY the 3 subject lines for Email ${emailNumber} — "${emailName}" in a ${typeInfo.name}.

The email's goal is: ${emailGoal}

The previous subject lines were:
${previousSubjects.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Generate 3 completely different subject lines. Do not repeat similar patterns or angles.

Return ONLY a valid JSON object: { "subjectLines": ["line1", "line2", "line3"] }
No markdown fences. No explanation.`,
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
    console.error("Subject line regeneration error:", error);
    return createErrorResponse("Failed to regenerate subject lines. Please try again.", 500);
  }
}
