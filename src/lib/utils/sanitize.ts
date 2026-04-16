import sanitize from "sanitize-html";

/** Trim whitespace, remove null bytes, limit length */
export function sanitizeText(input: string, maxLength = 10_000): string {
  return input.replace(/\0/g, "").trim().slice(0, maxLength);
}

/** Sanitize HTML content — strips dangerous tags/attributes while preserving
 *  safe formatting elements for rendered article content. */
export function sanitizeHtml(html: string): string {
  return sanitize(html, {
    allowedTags: [
      "p", "br", "strong", "em", "b", "i", "u", "s",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "img",
      "blockquote", "pre", "code",
      "table", "thead", "tbody", "tr", "th", "td",
      "hr", "div", "span",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
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
