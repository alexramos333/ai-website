import { type NextRequest } from "next/server";
import { createMessageWithTimeout } from "@/lib/anthropic";
import { tiktokShopSchema } from "@/lib/utils/validation";
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
  description?: string,
  salesAngles?: string[],
  selectedHook?: string,
): string {
  switch (step) {
    case 2:
      return `Generate exactly 30 TikTok Shop Ad headlines for the following product/service:

${productContext}

Use these proven high-converting TikTok Shop Ad headline frameworks:
- Curiosity gap headlines: make viewers need to know more ("You won't believe...", "The secret to...")
- Benefit-driven headlines: highlight the key transformation or outcome the product delivers
- Urgency/scarcity headlines: limited stock, selling fast, going viral, almost sold out
- Social proof headlines: "Over X sold", "Viral on TikTok", "TikTok made me buy it"
- Question headlines: ask something the audience deeply relates to
- Number-based headlines: specific results, percentages, timeframes ("In just 7 days...")
- Emotional trigger headlines: tap into desires, frustrations, or aspirations
- CTA-focused headlines: Shop Now, Get Yours, Try It Today, Add to Cart
- FOMO headlines: "Everyone's talking about this", "Don't miss out"
- Before/After headlines: contrast the problem state with the result state
- Trend-based headlines: "TikTok's #1", "The viral product that...", "POV: you finally found..."

CRITICAL RULES:
- Every headline MUST be 34 characters or fewer (TikTok Shop Ad headline character limit)
- Make headlines diverse — mix curiosity, benefits, urgency, social proof, and emotional approaches
- Write specifically for TikTok Shop's audience (younger, trend-aware, impulse buyers)
- Write for high click-through rate AND high conversion rate
- All headlines MUST comply with TikTok Shop Advertising Policies (no misleading claims, no prohibited content, no excessive capitalization)
- Number each headline 1-30
- Return ONLY the numbered list, no other text`;

    case 3:
      return `Write a fully SEO-optimized TikTok video description for the following product/service:

${productContext}

These are the headlines being used in the campaign:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Create a TikTok video description that:
- Opens with a compelling hook sentence that grabs attention
- Includes relevant keywords naturally for TikTok search discovery
- Highlights the key benefit or transformation
- Uses relevant trending hashtags (10-15 hashtags)
- Includes a clear call to action (e.g., "Tap the link in bio", "Check the yellow basket")
- Does NOT include any links (TikTok handles links separately)
- Uses line breaks for scannability
- Feels native to TikTok (casual, conversational, trend-aware tone)

CRITICAL RULES:
- Keep the description under 2,200 characters (TikTok's description limit)
- Front-load the most important keywords and hook in the first 2 lines (visible before "...more")
- Do NOT include any URLs or links
- All content MUST comply with TikTok Shop Advertising Policies
- Use a mix of niche-specific and broad trending hashtags
- Return ONLY the description text`;

    case 4:
      return `Generate exactly 10 different sales angles for TikTok Shop Ads for the following product/service:

${productContext}

Headlines being used:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Description being used:
${description}

Use the problem-solution framework for each sales angle:
- Each angle should identify a DIFFERENT specific problem that the target customer experiences
- Position the product/service as the direct solution to that specific problem
- Make each angle feel distinct — different pain points, different audiences, different scenarios

Sales angle frameworks to use:
1. The "I was struggling with X until I found this" angle
2. The "Why is nobody talking about this?" angle
3. The "I tried everything and nothing worked until..." angle
4. The "POV: you finally solve [problem]" angle
5. The "The reason you're still dealing with [problem]" angle
6. The "What I wish I knew sooner about [problem]" angle
7. The "Stop doing [wrong thing], do this instead" angle
8. The "My [friend/doctor/etc.] recommended this and..." angle
9. The "I was skeptical but then..." angle
10. The "If you struggle with [problem], you need this" angle

CRITICAL RULES:
- Each sales angle should be 1-2 sentences that set up the problem-solution narrative
- Make them feel authentic and native to TikTok (conversational, relatable, not salesy)
- All angles MUST comply with TikTok Shop Advertising Policies (no misleading health claims, no prohibited content, no exaggerated results)
- Each angle should target a different pain point or customer segment
- Number each angle 1-10
- Return ONLY the numbered list, no other text`;

    case 5:
      return `Generate exactly 10 different video hooks for a TikTok Shop Ad about the following product/service:

${productContext}

Sales angles being used:
${salesAngles?.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Headlines being used:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Each hook should use a different style designed to stop the scroll on TikTok:
1. Question hook — Ask a provocative question that makes them stop scrolling
2. Bold claim hook — Make a surprising statement that demands attention
3. Story hook — Start with "I" or a relatable mini-anecdote
4. Statistic hook — Use a compelling (realistic) number or result
5. Contrarian hook — Challenge what everyone else is doing wrong
6. Urgency hook — Create immediate FOMO or time pressure
7. Empathy hook — Show you deeply understand their struggle
8. Challenge hook — Dare the viewer to try something
9. POV hook — "POV: you finally found the solution to..."
10. Shock/curiosity hook — Open with something unexpected that demands they keep watching

CRITICAL RULES:
- Each hook should be 1-2 sentences max — designed for the first 3 seconds of a TikTok video
- Make them immediately attention-grabbing and scroll-stopping
- Write in a natural, conversational TikTok tone (not corporate or salesy)
- All hooks MUST comply with TikTok Shop Advertising Policies
- Number each hook 1-10
- Return ONLY the numbered list, no other text`;

    case 6:
      return `Write a 40-second TikTok Shop Ad video script for the following product/service:

${productContext}

Use this opening hook to start the video: "${selectedHook}"

Sales angles for context:
${salesAngles?.map((a, i) => `${i + 1}. ${a}`).join("\n")}

Headlines for context:
${headlines?.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Follow the problem-solution framework optimized for TikTok Shop:
1. HOOK (0-3s) — Use the provided hook above to stop the scroll immediately
2. PROBLEM (3-10s) — Agitate the viewer's pain point. Make them feel seen. (2-3 punchy sentences)
3. SOLUTION (10-25s) — Introduce the product as THE answer. Highlight 2-3 key benefits with specific details. Show why this product is different. (3-4 sentences)
4. SOCIAL PROOF (25-32s) — Reference results, reviews, viral status, or how many people are buying it. (1-2 sentences)
5. CTA (32-40s) — Strong, urgent call to action. Tell them exactly what to do: "Tap the yellow basket", "Get yours before it sells out", etc. (1-2 sentences)

CRITICAL RULES:
- Keep it conversational, authentic, and native to TikTok — this should sound like a real person talking to camera, NOT a corporate ad
- Aim for roughly 100-120 words total (40 seconds of natural speaking)
- Use short, punchy sentences. No long paragraphs.
- The script MUST be 100% compliant with TikTok Shop Advertising Policies:
  * No misleading or exaggerated claims about product results
  * No before/after claims that imply guaranteed results
  * No prohibited content categories
  * No personal attributes assumptions
  * No sensationalized or clickbait language that misleads
  * No unsubstantiated health, wellness, or medical claims
- Write for HIGH conversion rate — every sentence should move the viewer closer to clicking "Add to Cart"
- Return ONLY the script text, no labels or section headers`;

    default:
      return "";
  }
}

function parseResponse(step: number, text: string): string[] | string {
  if (step === 2 || step === 4 || step === 5) {
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
  const rateLimitKey = `tiktok-shop:${getRateLimitKey(request)}`;
  const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again in a minute.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = tiktokShopSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const { step, headlines, description, salesAngles, selectedHook } = result.data;

    const productContext = buildProductContext({
      productName: result.data.productName ? sanitizeText(result.data.productName, 200) : undefined,
      productLink: result.data.productLink ? sanitizeText(result.data.productLink, 500) : undefined,
      productDescription: result.data.productDescription ? sanitizeText(result.data.productDescription, 2000) : undefined,
      mainProblem: result.data.mainProblem ? sanitizeText(result.data.mainProblem, 2000) : undefined,
      mainResult: result.data.mainResult ? sanitizeText(result.data.mainResult, 2000) : undefined,
      benefits: result.data.benefits ? sanitizeText(result.data.benefits, 2000) : undefined,
      differentiators: result.data.differentiators ? sanitizeText(result.data.differentiators, 2000) : undefined,
    });

    const prompt = getPrompt(step, productContext, headlines, description, salesAngles, selectedHook);
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
    console.error("TikTok Shop generation error:", error);
    return createErrorResponse("Failed to generate content. Please try again.", 500);
  }
}
