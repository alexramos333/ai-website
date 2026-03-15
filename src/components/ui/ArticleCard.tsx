import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import { calculateReadTime } from "@/lib/utils/seo";

interface ArticleCardProps {
  article: {
    title: string;
    slug: string;
    excerpt: string;
    published_at: string | null;
    tags: string[];
    content: string;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const readTime = calculateReadTime(article.content);
  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const displayTags = article.tags.slice(0, 3);

  return (
    <Link href={`/blog/${article.slug}`} className="group block">
      <GlassCard className="h-full transition-transform duration-300 group-hover:scale-[1.02]">
        <h3 className="font-black text-xl text-white transition-colors duration-300 group-hover:text-[#67c3ff]">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-white/75">{article.excerpt}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-white/50">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && <span aria-hidden="true">&middot;</span>}
          <span>{readTime}</span>
        </div>
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {displayTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-0.5 text-xs text-white/75"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </GlassCard>
    </Link>
  );
}
