import { type NextRequest } from "next/server";
import { getAnthropicClient } from "@/lib/anthropic";
import { contentCreatorSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
} from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";

function getPrompt(
  step: number,
  topic: string,
  selectedHook?: string,
  script?: string,
): string {
  switch (step) {
    case 2:
      return `Generate exactly 10 compelling headlines for video content about: "${topic}"

Use a mix of these proven frameworks:
- AIDA (Attention, Interest, Desire, Action)
- PAS (Problem, Agitate, Solution)
- Curiosity gap
- Power words (shocking, secret, proven, ultimate, etc.)

Rules:
- Each headline should be under 80 characters
- Make them click-worthy but not clickbait
- Number each headline 1-10
- Return ONLY the numbered list, no other text`;

    case 3:
      return `Generate exactly 10 different opening hooks for a video about: "${topic}"

Each hook should use a different style:
1. Question hook - Ask a provocative question
2. Bold claim - Make a surprising statement
3. Story hook - Start with "I" or a mini-anecdote
4. Statistic hook - Use a compelling (realistic) number
5. Contrarian hook - Challenge conventional wisdom
6. Urgency hook - Create time pressure
7. Empathy hook - Show you understand their pain
8. Challenge hook - Dare the viewer
9. Metaphor hook - Use a vivid comparison
10. Shock hook - Open with something unexpected

Rules:
- Each hook should be 1-2 sentences max
- Make them immediately attention-grabbing
- Number each hook 1-10
- Return ONLY the numbered list, no other text`;

    case 4:
      return `Write a 30-second video script about: "${topic}"

Use this opening hook to start: "${selectedHook}"

Follow the problem-solution framework:
1. HOOK (use the provided hook above)
2. AGITATE - Expand on the problem (2-3 sentences)
3. SOLVE - Present the solution clearly (2-3 sentences)
4. CTA - End with a strong call to action (1 sentence)

Rules:
- Keep it conversational and natural
- Aim for roughly 75-90 words total (30 seconds of speaking)
- Use short, punchy sentences
- Return ONLY the script text, no labels or headers`;

    case 5:
      return `Write an SEO-optimized video description for a video about: "${topic}"

The video script is:
"${script}"

Include:
1. A compelling 2-3 sentence summary at the top
2. Key timestamps or sections mentioned
3. A call to action (like, subscribe, comment)
4. 10-15 relevant hashtags at the end

Rules:
- Keep the description under 300 words
- Front-load important keywords
- Make it scannable with line breaks
- Return ONLY the description text`;

    default:
      return "";
  }
}

function parseResponse(step: number, text: string): string[] | string {
  if (step === 2 || step === 3) {
    const lines = text
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0);
    return lines;
  }
  return text.trim();
}

export async function POST(request: NextRequest) {
  const rateLimitKey = `content-creator:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 5, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = contentCreatorSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { step, selectedHook, script } = result.data;
    const topic = sanitizeText(result.data.topic, 200);

    const prompt = getPrompt(step, topic, selectedHook, script);
    if (!prompt) {
      return createErrorResponse("Invalid step.", 400);
    }

    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("No response generated.", 500);
    }

    const parsed = parseResponse(step, textBlock.text);

    return createSuccessResponse({ result: parsed });
  } catch (error) {
    console.error("Content creator generation error:", error);
    return createErrorResponse("Failed to generate content. Please try again.", 500);
  }
}
