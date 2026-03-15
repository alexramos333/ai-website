import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("slug, updated_at")
    .eq("published", true);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(
    (article) => ({
      url: `${SITE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })
  );

  return [...staticPages, ...articlePages];
}
