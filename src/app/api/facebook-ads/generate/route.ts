import { type NextRequest } from "next/server";
import { createMessageWithTimeout } from "@/lib/anthropic";
import { facebookAdsSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
} from "@/lib/utils/api";
import { sanitizeText } from "@/lib/utils/sanitize";

function buildProductContext(fields: {
  productName?: string;
  productLink?: string;
  productDescription?: string;
  mainProblem?: string;
  mainResult?: string;
  benefits?: string;
  differentiators?: string;
}): string {
  const parts: string[] = [];
  if (fields.productName) parts.push(`Product/Service Name: ${fields.productName}`);
  if (fields.productLink) parts.push(`Product Link: ${fields.productLink}`);
  if (fields.productDescription) parts.push(`Description: ${fields.productDescription}`);
  if (fields.mainProblem) parts.push(`Main Problem It Solves: ${fields.mainProblem}`);
  if (fields.mainResult) parts.push(`Main Result/Outcome: ${fields.mainResult}`);
  if (fields.benefits) parts.push(`Key Benefits: ${fields.benefits}`);
  if (fields.differentiators) parts.push(`Differentiators: ${fields.differentiators}`);
  return parts.join("\n");
}

function getPrompt(
  step: number,
  productContext: string,
  headlines?: string[],
  descriptions?: string[],
  primaryTexts?: string[],
): string {
  switch (step) {
    case 2:
      return `Generate exactly 30 Facebook Ad headlines for the following product/service:

${productContext}

Use these proven high-converting Facebook Ad headline frameworks:
- Benefit-driven headlines: highlight the key transformation or outcome
- Curiosity gap headlines: make them want to learn more
- Social proof headlines: leverage numbers, reviews, results
- Urgency/scarcity headlines: limited time, limited spots, act now
- Question headlines: ask something the audience relates to
- Number-based headlines: specific stats, percentages, timeframes
- Emotional trigger headlines: tap into desires, fears, aspirations
- CTA-focused headlines: direct action words (Get, Try, Discover, Claim)
- Exclusivity headlines: make the audience feel special
- FOMO headlines: fear of missing out on results others are getting

CRITICAL RULES:
- Every headline MUST be 40 characters or fewer (Facebook's headline character limit)
- Make headlines diverse — mix benefit, curiosity, urgency, social proof, and emotional approaches
- Write for high click-through rate AND high conversion rate
- All headlines MUST comply with Facebook Advertising Policies (no misleading claims, no prohibited content, no excessive capitalization)
- Number each headline 1-30
- Return ONLY the numbered list, no other text`;

    case 3:
      return `Generate exactly 30 Facebook Ad descriptions for the following product/service:

${productContext}

These are the headlines being used in the campaign:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Use these proven high-converting Facebook Ad description frameworks:
- Benefit expansion: elaborate on the value proposition from the headlines
- Feature-benefit: specific features tied to customer outcomes
- Social proof: customer counts, ratings, testimonials, case studies
- Objection handling: free trial, money-back guarantee, no commitment
- Urgency/scarcity: limited availability, deadlines, special pricing
- Differentiator: what sets this apart from competitors
- Problem-solution: acknowledge the pain and present the fix
- Trust signal: certifications, awards, years in business, guarantees
- CTA-focused: tell the user exactly what to do next
- Emotional appeal: connect with the audience on a personal level

CRITICAL RULES:
- Every description MUST be 30 characters or fewer (Facebook's description character limit)
- Complement and expand on the headlines — don't just repeat them
- Write for high click-through rate AND high conversion rate
- All descriptions MUST comply with Facebook Advertising Policies
- Number each description 1-30
- Return ONLY the numbered list, no other text`;

    case 4:
      return `Generate exactly 10 Facebook Primary Ad Text variations for the following product/service:

${productContext}

These are the headlines being used:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

These are the descriptions being used:
${descriptions?.map((d, i) => `${i + 1}. ${d}`).join("\n")}

Use these proven high-converting Facebook Primary Text frameworks:
1. Storytelling — open with a relatable mini-story
2. Problem-Agitate-Solve — identify pain, amplify it, present the solution
3. Testimonial-style — write as if a happy customer is speaking
4. Listicle — bullet key benefits or features
5. Question-Answer — ask a question the audience relates to, then answer it
6. Educational — teach something valuable, then tie to the product
7. Emotional — connect deeply with desires or frustrations
8. Contrarian — challenge conventional wisdom in the industry
9. Direct response — get straight to the offer and CTA
10. Community-building — make them feel part of something bigger

CRITICAL RULES:
- Each primary text should be 125 characters or fewer (this is the text visible before "See More" on Facebook)
- Make each variation feel distinct — different angles, tones, and frameworks
- Write for high engagement AND conversion
- All text MUST comply with Facebook Advertising Policies (no misleading claims, no prohibited content, no excessive capitalization, no sensationalized language)
- Number each variation 1-10
- Return ONLY the numbered list, no other text`;

    case 5:
      return `Write a 60-second Facebook Ad video script for the following product/service:

${productContext}

Context from the campaign — headlines:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Primary text examples:
${primaryTexts?.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Follow the problem-solution framework:
1. HOOK (0-5s) — Open with an attention-grabbing statement or question that stops the scroll
2. PROBLEM (5-15s) — Identify and agitate the viewer's pain point (2-3 sentences)
3. SOLUTION (15-35s) — Present the product/service as the answer, highlight key benefits (3-4 sentences)
4. SOCIAL PROOF (35-45s) — Include a reference to results, testimonials, or trust signals (1-2 sentences)
5. CTA (45-60s) — Strong, clear call to action telling them exactly what to do next (1-2 sentences)

CRITICAL RULES:
- Keep it conversational and natural — this is spoken to camera
- Aim for roughly 150-180 words total (60 seconds of speaking)
- Use short, punchy sentences optimized for video
- The script MUST comply with Facebook Advertising Policies:
  * No misleading or exaggerated claims
  * No before/after implications that set unrealistic expectations
  * No prohibited content (tobacco, adult, etc.)
  * No personal attributes assumptions ("Are you overweight?" etc.)
  * No sensationalized or clickbait language
- Return ONLY the script text, no labels or section headers`;

    default:
      return "";
  }
}

function parseResponse(step: number, text: string): string[] | string {
  if (step >= 2 && step <= 4) {
    return text
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 0);
  }
  return text.trim();
}

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const rateLimitKey = `facebook-ads:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = facebookAdsSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { step, headlines, descriptions, primaryTexts } = result.data;

    const productContext = buildProductContext({
      productName: result.data.productName ? sanitizeText(result.data.productName, 200) : undefined,
      productLink: result.data.productLink ? sanitizeText(result.data.productLink, 500) : undefined,
      productDescription: result.data.productDescription ? sanitizeText(result.data.productDescription, 2000) : undefined,
      mainProblem: result.data.mainProblem ? sanitizeText(result.data.mainProblem, 2000) : undefined,
      mainResult: result.data.mainResult ? sanitizeText(result.data.mainResult, 2000) : undefined,
      benefits: result.data.benefits ? sanitizeText(result.data.benefits, 2000) : undefined,
      differentiators: result.data.differentiators ? sanitizeText(result.data.differentiators, 2000) : undefined,
    });

    const prompt = getPrompt(step, productContext, headlines, descriptions, primaryTexts);
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

    const parsed = parseResponse(step, textBlock.text);

    return createSuccessResponse({ result: parsed });
  } catch (error) {
    console.error("Facebook Ads generation error:", error);
    return createErrorResponse("Failed to generate content. Please try again.", 500);
  }
}
