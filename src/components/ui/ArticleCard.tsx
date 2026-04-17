import Image from "next/image";
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
    content?: string;
    og_image?: string;
  };
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const readTime = article.content ? calculateReadTime(article.content) : null;
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
      <GlassCard padding="none" className="h-full overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
        {article.og_image && (
          <Image
            src={article.og_image}
            alt={article.title}
            width={600}
            height={315}
            loading="lazy"
            className="w-full h-auto"
          />
        )}
        <div className="p-4 sm:p-5">
          <h3 className="font-black text-xl text-white transition-colors duration-300 group-hover:text-[#67c3ff]">
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-white/75">{article.excerpt}</p>
          <div className="mt-4 flex items-center gap-3 text-sm text-white/50">
            {formattedDate && <span>{formattedDate}</span>}
            {formattedDate && readTime && <span aria-hidden="true">&middot;</span>}
            {readTime && <span>{readTime}</span>}
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
        </div>
      </GlassCard>
    </Link>
  );
}
