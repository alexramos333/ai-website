import type { Metadata } from "next";
import type { Database } from "@/lib/database.types";
export { slugify as generateSlug } from "@/lib/utils/api";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

export function calculateReadTime(content: string): string {
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
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
    "@type": "Article",
    headline: article.title,
    description: article.meta_description || article.excerpt,
    image: article.og_image || undefined,
    datePublished: article.published_at ?? article.created_at,
    dateModified: article.updated_at,
    author: {
      "@type": "Organization",
      name: "AI Website",
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
