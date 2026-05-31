import { type NextRequest } from "next/server";
import { createMessageWithTimeout } from "@/lib/anthropic";
import { googleAdsSchema } from "@/lib/utils/validation";
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
  keywords: string,
  headlines?: string[],
): string {
  switch (step) {
    case 2:
      return `Generate exactly 30 Google Responsive Search Ad headlines for a Google Ads campaign targeting these keywords:

"${keywords}"

Use these proven high-CTR, high-converting Google Ads headline frameworks:
- Include target keywords naturally and prominently for maximum Quality Score and ad relevance
- Call-to-action headlines: Get, Try, Start, Save, Book, Claim, Discover, Learn
- Benefit-focused headlines: highlight what the customer gains
- Urgency/scarcity headlines: Limited Time, Today Only, Act Now, Don't Miss Out
- Number/statistic headlines: specific percentages, prices, timeframes
- Trust/authority headlines: Trusted, Certified, Award-Winning, #1 Rated
- Pain-point headlines: address the problem the searcher is trying to solve
- Question headlines: engage the searcher directly
- USP headlines: what makes this offer unique vs competitors
- Social proof headlines: Reviews, Ratings, Customers Served

CRITICAL RULES:
- Every headline MUST be 30 characters or fewer (this is Google's hard character limit — count carefully)
- Include the primary keywords in at least 10 of the 30 headlines for Quality Score
- Make headlines diverse — mix CTAs, benefits, urgency, trust, and keyword variations
- Write for high click-through rate AND high conversion rate
- Number each headline 1-30
- Return ONLY the numbered list, no other text`;

    case 3:
      return `Generate exactly 30 Google Responsive Search Ad descriptions for a Google Ads campaign targeting these keywords:

"${keywords}"

These are the headlines being used in the campaign:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Use these proven high-CTR, high-converting Google Ads description frameworks:
- Include primary keywords naturally for maximum Quality Score and ad relevance
- Strong call-to-action descriptions: Tell the user exactly what to do next
- Benefit-expansion descriptions: elaborate on the value proposition from the headlines
- Trust signal descriptions: guarantees, reviews, years in business, certifications
- Urgency/scarcity descriptions: limited availability, deadlines, special pricing
- Objection-handling descriptions: free shipping, no commitment, easy cancellation
- Social proof descriptions: customer counts, ratings, testimonials
- Feature-benefit descriptions: specific features tied to customer outcomes
- Differentiator descriptions: what sets this apart from competitors
- Problem-solution descriptions: acknowledge the pain and present the fix

CRITICAL RULES:
- Every description MUST be 90 characters or fewer (this is Google's hard character limit — count carefully)
- Include the primary keywords in at least 15 of the 30 descriptions for Quality Score
- Complement and expand on the headlines — don't just repeat them
- Write for high click-through rate AND high conversion rate
- Number each description 1-30
- Return ONLY the numbered list, no other text`;

    default:
      return "";
  }
}

function parseResponse(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimitKey = `google-ads:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = googleAdsSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { step, headlines } = result.data;
    const keywords = sanitizeText(result.data.keywords, 2000);

    const prompt = getPrompt(step, keywords, headlines);
    if (!prompt) {
      return createErrorResponse("Invalid step.", 400);
    }

    const message = await createMessageWithTimeout({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return createErrorResponse("No response generated.", 500);
    }

    const parsed = parseResponse(textBlock.text);

    return createSuccessResponse({ result: parsed });
  } catch (error) {
    console.error("Google Ads generation error:", error);
    return createErrorResponse("Failed to generate content. Please try again.", 500);
  }
}
