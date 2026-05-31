// Server-side only — NEVER import in client components.

import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable");
  }

  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Default timeout (ms) for interactive AI-tool generation calls. Kept below the
 * routes' `maxDuration` ceiling so a stalled request aborts cleanly and the
 * route's catch block returns a JSON error, instead of the platform killing the
 * function mid-flight (which surfaces in the browser as "Failed to fetch").
 */
export const AI_TOOL_TIMEOUT_MS = 55_000;

/**
 * Create a non-streaming message with an abort timeout. On timeout the SDK
 * rejects with an AbortError, which the calling route's existing try/catch
 * turns into a clean 500 JSON response.
 */
export async function createMessageWithTimeout(
  params: Anthropic.MessageCreateParamsNonStreaming,
  timeoutMs: number = AI_TOOL_TIMEOUT_MS,
): Promise<Anthropic.Message> {
  const anthropic = getAnthropicClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await anthropic.messages.create(params, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
