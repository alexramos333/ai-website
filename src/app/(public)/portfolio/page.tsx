import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import AnimatedGlassCard from "@/components/ui/AnimatedGlassCard";

export const metadata: Metadata = {
  title: "Portfolio | AI Software Demos",
  description:
    "Explore AI-powered software demos — content creation, Google & Facebook ads, TikTok Shop, prompt and email generators.",
};

interface PortfolioItem {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  image?: string;
}

const portfolioItems: PortfolioItem[] = [
  {
    title: "Content Creation Software",
    subtitle: "AI Software Demo",
    description: "Generate scroll-stopping social media posts, captions, and scripts in seconds with AI-powered content tools.",
    href: "/content-creator",
    image: "/images/content-creation-software.webp",
  },
  {
    title: "Google Ads Software",
    subtitle: "AI Software Demo",
    description: "Build high-converting Google Ads campaigns with AI-optimized headlines, descriptions, and keyword targeting.",
    href: "/google-ads",
    image: "/images/google-ads-software.webp",
  },
  {
    title: "Facebook Ads Software",
    subtitle: "AI Software Demo",
    description: "Create ready-to-launch Facebook ad copy and audience targeting strategies powered by AI in minutes.",
    href: "/facebook-ads",
    image: "/images/facebook-ads-software.webp",
  },
  {
    title: "TikTok Shop Software",
    subtitle: "AI Software Demo",
    description: "Generate TikTok Shop product listings and viral ad scripts designed to maximize conversions and sales.",
    href: "/tiktok-shop",
    image: "/images/tiktok-shop-software.webp",
  },
  {
    title: "AI Prompt Generator Software",
    subtitle: "AI Software Demo",
    description: "Craft precision-engineered prompts for any AI model to get better, more consistent results every time.",
    href: "/portfolio/ai-prompt-generator",
    image: "/images/ai-prompt-generator-software.webp",
  },
  {
    title: "AI Email Generator Software",
    subtitle: "AI Software Demo",
    description: "Build complete email sequences and campaigns with AI-written subject lines, body copy, and CTAs.",
    href: "/portfolio/ai-email-generator",
    image: "/images/ai-email-generator-software.webp",
  },
];

export default function PortfolioPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-28">
        {/* ════ PORTFOLIO ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="AI-powered tools built for real businesses">
              VIEW MY PORTFOLIO
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item, i) => (
                <AnimatedGlassCard key={i}>
                  <p className="text-lg font-black">{item.title}</p>
                  <p className="mt-1 text-sm font-bold text-[#5de6fc]">{item.subtitle}</p>
                  <p className="mt-2 text-sm text-white">
                    {item.description}
                  </p>
                  {/* Thumbnail */}
                  {item.image ? (
                    <div className="relative mt-4 aspect-video overflow-hidden rounded-lg">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="relative mt-4 flex aspect-video items-center justify-center rounded-lg bg-white/10">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="text-white/60"
                        aria-hidden="true"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="mt-3">
                    <Link href={item.href} className="cta-btn-static inline-block">
                      <span className="cta-btn-inside block px-3 py-1.5 text-sm">View Software Demo</span>
                    </Link>
                  </div>
                </AnimatedGlassCard>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
