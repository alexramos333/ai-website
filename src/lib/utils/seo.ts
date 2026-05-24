import type { Metadata } from "next";
import type { Database } from "@/lib/database.types";
export { slugify as generateSlug } from "@/lib/utils/api";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com"
).replace(/\/+$/, "");

export function calculateReadTime(content: string): string {
  const text = content.replace(/<[^>]*>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function countWords(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  return text.split(/\s+/).filter(Boolean).length;
}

export function generateArticleMetadata(article: ArticleRow): Metadata {
  const title = article.meta_title || article.title;
  const description = article.meta_description || article.excerpt;
  const url = `${SITE_URL}/blog/${article.slug}`;
  const images = article.og_image
    ? [{ url: article.og_image }]
    : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      url,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: article.og_image ? [article.og_image] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateArticleJsonLd(
  article: ArticleRow
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.meta_description || article.excerpt,
    image: article.og_image || undefined,
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at,
    wordCount: countWords(article.content),
    keywords: article.tags.join(", "),
    author: {
      "@type": "Person",
      name: "Ramos",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Website",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

/**
 * Generate VideoObject JSON-LD for articles that have a video.
 * Only call when article.video_url is non-null.
 */
export function generateVideoJsonLd(
  article: ArticleRow
): Record<string, unknown> | null {
  if (!article.video_url) return null;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: article.title,
    description: article.meta_description || article.excerpt,
    thumbnailUrl: article.video_thumbnail_url || article.og_image || undefined,
    uploadDate: article.published_at ?? article.created_at,
    contentUrl: article.video_url,
    ...(article.video_duration
      ? { duration: `PT${article.video_duration}S` }
      : {}),
    author: {
      "@type": "Person",
      name: "Ramos",
    },
    publisher: {
      "@type": "Organization",
      name: "AI Website",
    },
  };
}

/** Extract FAQ schema JSON from the article content HTML comment marker. */
export function extractFaqSchema(
  content: string
): Record<string, unknown> | null {
  const match = content.match(/<!-- FAQ_SCHEMA:([\s\S]*?) -->/);
  if (!match?.[1]) return null;

  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Strip the FAQ_SCHEMA HTML comment from content before rendering. */
export function stripFaqMarker(content: string): string {
  return content.replace(/\n?<!-- FAQ_SCHEMA:[\s\S]*? -->/, "");
}

/** Extract headings from HTML content for table of contents. */
export interface TocEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

export function extractTableOfContents(content: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const regex = /<h([23])\s+id="([^"]+)"[^>]*>(.*?)<\/h[23]>/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    const level = parseInt(match[1], 10) as 2 | 3;
    const id = match[2];
    // Strip HTML tags from heading text
    const text = match[3].replace(/<[^>]*>/g, "");
    entries.push({ id, text, level });
  }

  return entries;
}
