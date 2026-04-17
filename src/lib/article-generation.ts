// Shared utilities for the multi-step article generation pipeline.
// Used by /api/generate-article/research, /write, and /image endpoints.

import crypto from "crypto";
import { getAnthropicClient } from "@/lib/anthropic";

export const ARTICLE_MODEL = process.env.ARTICLE_GEN_MODEL || "claude-sonnet-4-5-20250929";

/** Timing-safe Bearer token verification. */
export function verifyToken(token: string, secret: string): boolean {
  const tokenBuffer = Buffer.from(token);
  const secretBuffer = Buffer.from(secret);
  if (tokenBuffer.length !== secretBuffer.length) return false;
  return crypto.timingSafeEqual(tokenBuffer, secretBuffer);
}

/** Extract Bearer token from Authorization header. */
export function extractBearerToken(authHeader: string | null): string | null {
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

/** Call Claude and return the text response. Aborts after timeoutMs (default 180s). */
export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  timeoutMs = 180_000,
): Promise<{ text: string; stopReason: string; inputTokens: number; outputTokens: number }> {
  const anthropic = getAnthropicClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const message = await anthropic.messages.create(
      {
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
      },
      { signal: controller.signal },
    );

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
  } finally {
    clearTimeout(timer);
  }
}

/** Try to extract valid JSON from Claude's response. Handles markdown fences and truncation. */
export function extractJson(rawText: string, stopReason: string): unknown {
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
