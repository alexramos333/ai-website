import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/utils/validation";
import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  getRateLimitKey,
  checkRateLimit,
} from "@/lib/utils/api";
import { sanitizeText, formatPhone } from "@/lib/utils/sanitize";

export async function POST(request: NextRequest) {
  const { allowed } = checkRateLimit(getRateLimitKey(request));
  if (!allowed) {
    return createErrorResponse("Too many requests. Please try again later.", 429);
  }

  try {
    const body: unknown = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return createValidationErrorResponse(result.error);
    }

    const name = sanitizeText(result.data.name);
    const message = sanitizeText(result.data.message);
    const phone = result.data.phone ? formatPhone(result.data.phone) : undefined;

    const supabase = await createClient();
    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email: result.data.email,
      phone,
      message,
      source: "website",
    });

    if (error) {
      console.error("Contact submission error:", error.message);
      return createErrorResponse("Failed to submit message. Please try again.", 500);
    }

    return createSuccessResponse(
      { success: true, message: "Thank you for your message!" },
      201
    );
  } catch {
    return createErrorResponse("Invalid request body.", 400);
  }
}
