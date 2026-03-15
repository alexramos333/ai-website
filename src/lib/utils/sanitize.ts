/** Trim whitespace, remove null bytes, limit length */
export function sanitizeText(input: string, maxLength = 10_000): string {
  return input.replace(/\0/g, "").trim().slice(0, maxLength);
}

/** Normalize phone to digits only */
export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Safe truncation with ellipsis */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "\u2026";
}

/** URL-safe slug from title */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
