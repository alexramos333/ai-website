import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateArticleMetadata,
  generateArticleJsonLd,
  calculateReadTime,
  countWords,
  extractFaqSchema,
  stripFaqMarker,
  extractTableOfContents,
} from "@/lib/utils/seo";
import { sanitizeHtml } from "@/lib/utils/sanitize";
import SectionHeading from "@/components/ui/SectionHeading";
import ArticleCard from "@/components/ui/ArticleCard";
import ViewTracker from "@/components/blog/ViewTracker";
import ReadingProgress from "@/components/blog/ReadingProgress";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const revalidate = 3600;

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const getArticle = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();
  return data;
});

export async function generateStaticParams() {
  const supabase = createAdminClient();
  const { data: articles } = await supabase
    .from("articles")
    .select("slug")
    .eq("published", true);

  return (articles ?? []).map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return { title: "Article Not Found" };
  }

  return generateArticleMetadata(article);
}

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com"
).replace(/\/+$/, "");

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  // Extract FAQ schema and clean content
  const faqSchema = extractFaqSchema(article.content);
  const cleanContent = stripFaqMarker(article.content);

  const readTime = calculateReadTime(cleanContent);
  const wordCount = countWords(cleanContent);
  const toc = extractTableOfContents(cleanContent);

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const lastUpdated = new Date(article.updated_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Replace <!-- TOC --> marker with empty string (we render ToC separately)
  const contentHtml = sanitizeHtml(cleanContent.replace(/<!-- TOC -->/g, ""));

  // Fetch related articles if the current article has tags
  interface RelatedArticle {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    tags: string[];
    published_at: string | null;
    og_image: string;
  }

  let relatedArticles: RelatedArticle[] = [];
  if (article.tags.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("articles")
      .select("id, title, slug, excerpt, tags, published_at, og_image")
      .eq("published", true)
      .overlaps("tags", article.tags)
      .neq("id", article.id)
      .limit(3);

    relatedArticles = data ?? [];
  }

  const articleUrl = `${SITE_URL}/blog/${article.slug}`;
  const shareText = encodeURIComponent(article.title);
  const shareUrl = encodeURIComponent(articleUrl);

  return (
    <>
      <ReadingProgress />
      <Header />
      <main className="section-padding relative z-30 pt-28">
        {/* BlogPosting JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateArticleJsonLd(article)),
          }}
        />

        {/* FAQPage JSON-LD (if present) */}
        {faqSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(faqSchema),
            }}
          />
        )}

        <ViewTracker slug={slug} />

        <article className="mx-auto max-w-3xl">
          <Link
            href="/blog"
            className="inline-block text-sm text-[#67c3ff] transition-colors hover:text-white"
          >
            &larr; Back to Blog
          </Link>

          <header className="mt-6">
            <h1
              className="font-black text-glow"
              style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
            >
              {article.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/50">
              {formattedDate && <span>{formattedDate}</span>}
              {formattedDate && <span aria-hidden="true">&middot;</span>}
              <span>{readTime}</span>
              <span aria-hidden="true">&middot;</span>
              <span>{wordCount.toLocaleString()} words</span>
              <span aria-hidden="true">&middot;</span>
              <span>
                {article.view_count} {article.view_count === 1 ? "view" : "views"}
              </span>
            </div>

            {/* Last updated date — GEO freshness signal */}
            {article.updated_at !== article.created_at && (
              <p className="mt-2 text-xs text-white/40">
                Last updated: {lastUpdated}
              </p>
            )}

            {article.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs text-white/75 transition-colors hover:bg-white/20"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* Hero image */}
          {article.og_image && (
            <figure className="mt-8 -mx-4 sm:mx-0 overflow-hidden rounded-lg">
              <Image
                src={article.og_image}
                alt={article.title}
                width={1200}
                height={630}
                priority
                className="w-full h-auto"
              />
            </figure>
          )}

          {/* Table of Contents (for long articles) */}
          {toc.length > 3 && (
            <nav
              className="glass-card mt-8 p-6"
              aria-label="Table of contents"
            >
              <p className="mb-3 text-sm font-black text-white/75">
                Table of Contents
              </p>
              <ul className="space-y-1.5 text-sm">
                {toc.map((entry) => (
                  <li
                    key={entry.id}
                    className={entry.level === 3 ? "ml-4" : ""}
                  >
                    <a
                      href={`#${entry.id}`}
                      className="text-[#67c3ff] transition-colors hover:text-white"
                    >
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div
            className="prose-invert mt-10"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Share */}
          <div className="mt-12 border-t border-white/10 pt-8">
            <p className="text-sm font-black text-white/75">Share this article</p>
            <div className="mt-3 flex gap-4">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card px-4 py-2 text-sm text-white transition-colors hover:text-[#67c3ff]"
              >
                Twitter / X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card px-4 py-2 text-sm text-white transition-colors hover:text-[#67c3ff]"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mx-auto mt-16 max-w-7xl">
            <SectionHeading>Related Articles</SectionHeading>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
