import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SectionHeading from "@/components/ui/SectionHeading";
import ArticleCard from "@/components/ui/ArticleCard";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const revalidate = 3600;

const ARTICLES_PER_PAGE = 9;

export const metadata: Metadata = {
  title: "AI & Marketing Insights",
  description:
    "Expert articles on AI automation, digital marketing strategies, and modern web development. Stay ahead with actionable insights.",
  openGraph: {
    title: "AI & Marketing Insights",
    description:
      "Expert articles on AI automation, digital marketing strategies, and modern web development.",
  },
};

interface BlogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  const offset = (page - 1) * ARTICLES_PER_PAGE;

  const supabase = await createClient();

  let query = supabase
    .from("articles")
    .select("id, title, slug, excerpt, tags, published_at", {
      count: "exact",
    })
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data: articles, count } = await query.range(
    offset,
    offset + ARTICLES_PER_PAGE - 1
  );

  const totalPages = Math.ceil((count ?? 0) / ARTICLES_PER_PAGE);

  return (
    <>
      <Header />
      <main className="section-padding relative z-30 pt-28">
        <div className="mx-auto max-w-7xl">
          <SectionHeading subtitle="Expert articles on AI, marketing, and web development">
            AI &amp; Marketing Insights
          </SectionHeading>

          {tag && (
            <div className="mt-6 text-center">
              <span className="text-white/75">
                Filtered by:{" "}
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-sm text-white">
                  {tag}
                </span>
              </span>
              <Link
                href="/blog"
                className="ml-3 text-sm text-[#67c3ff] hover:underline"
              >
                Clear filter
              </Link>
            </div>
          )}

          {articles && articles.length > 0 ? (
            <>
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="mt-12 flex items-center justify-center gap-4"
                  aria-label="Blog pagination"
                >
                  {page > 1 && (
                    <Link
                      href={`/blog?page=${page - 1}${tag ? `&tag=${tag}` : ""}`}
                      className="glass-card px-4 py-2 text-sm text-white transition-colors hover:text-[#67c3ff]"
                    >
                      &larr; Previous
                    </Link>
                  )}
                  <span className="text-sm text-white/50">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={`/blog?page=${page + 1}${tag ? `&tag=${tag}` : ""}`}
                      className="glass-card px-4 py-2 text-sm text-white transition-colors hover:text-[#67c3ff]"
                    >
                      Next &rarr;
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <p className="mt-12 text-center text-white/50">
              No articles published yet.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
