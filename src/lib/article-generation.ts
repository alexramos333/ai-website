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
  const callStart = Date.now();

  console.log(`[CLAUDE CALL] Starting: model=${ARTICLE_MODEL} | max_tokens=${maxTokens} | timeout=${Math.round(timeoutMs / 1000)}s | system_prompt=${systemPrompt.length} chars | user_message=${userMessage.length} chars`);

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

    const elapsed = ((Date.now() - callStart) / 1000).toFixed(1);
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude.");
    }

    const outputPct = ((message.usage.output_tokens / maxTokens) * 100).toFixed(1);
    console.log(
      `[CLAUDE CALL] Complete: ${elapsed}s | stop_reason=${message.stop_reason} | ` +
        `input=${message.usage.input_tokens} tokens | output=${message.usage.output_tokens}/${maxTokens} tokens (${outputPct}%) | ` +
        `response=${textBlock.text.length} chars`,
    );

    if (message.stop_reason === "max_tokens") {
      console.warn(`[CLAUDE CALL] ⚠ TRUNCATED — output hit max_tokens (${maxTokens}). Response ends with: "${textBlock.text.slice(-200)}"`);
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
    console.log("[JSON PARSE] Stripping markdown fences from response");
    text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  // Log what we're trying to parse
  console.log(`[JSON PARSE] Attempting parse: ${text.length} chars | stop_reason=${stopReason} | starts_with="${text.slice(0, 80)}..." | ends_with="...${text.slice(-80)}"`);

  // First try: parse as-is
  try {
    const result = JSON.parse(text);
    console.log("[JSON PARSE] Success on first attempt");
    return result;
  } catch (parseError) {
    const parseMsg = parseError instanceof Error ? parseError.message : "Unknown parse error";
    console.warn(`[JSON PARSE] First parse failed: ${parseMsg}`);

    // If truncated at max_tokens, try to repair the JSON
    if (stopReason === "max_tokens") {
      console.warn("[JSON PARSE] Response truncated at max_tokens, attempting JSON repair...");
      return repairTruncatedJson(text);
    }
    throw new Error(`Claude returned invalid JSON. Parse error: ${parseMsg}`);
  }
}

/** Attempt to repair truncated JSON by closing open structures. */
function repairTruncatedJson(text: string): unknown {
  let repaired = text.trim();

  // If we're inside a string value, close it
  const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
  const closedQuote = quoteCount % 2 !== 0;
  if (closedQuote) {
    repaired += '"';
  }

  // Track the nesting order of brackets/braces so we close them in reverse
  const stack: string[] = [];
  let inString = false;
  for (let i = 0; i < repaired.length; i++) {
    const ch = repaired[i];
    if (ch === '"' && (i === 0 || repaired[i - 1] !== "\\")) {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{" || ch === "[") {
      stack.push(ch);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
    }
  }

  console.log(
    `[JSON REPAIR] Repairs needed: closed_quote=${closedQuote} | unclosed_stack=[${stack.join("")}] (${stack.length} deep) | ` +
      `trailing_text="...${repaired.slice(-200)}"`,
  );

  // Remove any trailing comma or incomplete key-value pair before closing
  // This handles truncation mid-object like: "name": "value", "url
  repaired = repaired.replace(/,\s*"[^"]*"?\s*$/, "");
  repaired = repaired.replace(/,\s*$/, "");

  // Close open brackets/braces in reverse nesting order
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i] === "{" ? "}" : "]";
  }

  console.log(`[JSON REPAIR] After repair, final 200 chars: "...${repaired.slice(-200)}"`);

  try {
    const result = JSON.parse(repaired);
    console.log("[JSON REPAIR] Success — repaired JSON parsed successfully");
    return result;
  } catch (repairError) {
    const repairMsg = repairError instanceof Error ? repairError.message : "Unknown";
    console.error(`[JSON REPAIR] Failed — could not repair: ${repairMsg} | final 300 chars: "...${repaired.slice(-300)}"`);
    throw new Error(`Claude returned truncated JSON that could not be repaired. Repair error: ${repairMsg}`);
  }
}
