// ============================================================
// ⚠️  TEMPORARILY HIDDEN — disabled 2026-05-31
// ============================================================
// The AI Video Agent project is not yet complete, so this page is hidden from
// the public site. This route now returns 404 (via notFound), and the
// "AI Video Agent" item has been commented out of the Portfolio nav in
// src/components/layout/Header.tsx. The full original implementation is
// preserved (commented out) below.
//
// TO RE-ENABLE: remove the notFound() stub below, uncomment the original
// implementation, and uncomment the nav line in Header.tsx. See TODO.md.
// ============================================================

import { notFound } from "next/navigation";

export default function AIVideoAgentPage() {
  notFound(); // Temporarily hidden — see header note + TODO.md
}

// ─────────────────────────────────────────────────────────────────────────
// ORIGINAL IMPLEMENTATION (restore when the project is ready):
// ─────────────────────────────────────────────────────────────────────────
// import type { Metadata } from "next";
// import Link from "next/link";
// import { createClient } from "@/lib/supabase/server";
// import Header from "@/components/layout/Header";
// import Footer from "@/components/layout/Footer";
// import SectionHeading from "@/components/ui/SectionHeading";
// import ArticleCard from "@/components/ui/ArticleCard";
//
// export const revalidate = 3600;
//
// export const metadata: Metadata = {
//   title:
//     "AI Video Agent | Automated Daily Video + Blog Content",
//   description:
//     "Fully autonomous AI agent that discovers trending topics, writes SEO blog articles, and produces short-form videos — published daily without human intervention.",
// };
//
// const STEPS = [
//   {
//     number: "01",
//     title: "Trend Discovery",
//     description:
//       "Scrapes TikTok trends via Apify and enriches them with Perplexity research to find today's most relevant AI/marketing topic.",
//   },
//   {
//     number: "02",
//     title: "Content Generation",
//     description:
//       "Claude Sonnet writes a 1,200-1,800 word SEO blog article and a 30-60 second video script with scene descriptions and captions.",
//   },
//   {
//     number: "03",
//     title: "Voiceover Synthesis",
//     description:
//       "ElevenLabs converts the video script to natural-sounding speech, uploaded to Cloudflare R2 for edge delivery.",
//   },
//   {
//     number: "04",
//     title: "Video Assembly",
//     description:
//       "Shotstack combines stock B-roll, AI-generated clips (Veo), voiceover audio, and karaoke-style captions into a vertical video.",
//   },
//   {
//     number: "05",
//     title: "Auto-Publish",
//     description:
//       "The finished article and video are published to the blog with full SEO metadata, VideoObject schema, and social sharing support.",
//   },
// ];
//
// const TECH_STACK = [
//   "Python 3.12",
//   "Claude Sonnet",
//   "ElevenLabs",
//   "Shotstack",
//   "Google Veo",
//   "Apify",
//   "Perplexity",
//   "Supabase",
//   "Cloudflare R2",
//   "GitHub Actions",
// ];
//
// export default async function AIVideoAgentPage() {
//   const supabase = await createClient();
//   const { data: videoArticles } = await supabase
//     .from("articles")
//     .select("id, title, slug, excerpt, tags, published_at, og_image")
//     .eq("published", true)
//     .not("video_url", "is", null)
//     .order("published_at", { ascending: false })
//     .limit(6);
//
//   return (
//     <>
//       <Header />
//       <main className="section-padding relative z-30 pt-28">
//         <div className="mx-auto max-w-5xl">
//           {/* Hero */}
//           <div className="text-center">
//             <SectionHeading subtitle="Fully autonomous content pipeline — zero human intervention">
//               AI Video Agent
//             </SectionHeading>
//             <p className="mx-auto mt-6 max-w-2xl text-white/75">
//               Every day, this agent wakes up, discovers what&apos;s trending in AI
//               and marketing, writes a full blog article, produces a short-form
//               video with voiceover and captions, and publishes everything to the
//               blog — completely on its own.
//             </p>
//           </div>
//
//           {/* How it works */}
//           <section className="mt-20">
//             <h2 className="text-center text-2xl font-black text-white">
//               How It Works
//             </h2>
//             <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
//               {STEPS.map((step) => (
//                 <div
//                   key={step.number}
//                   className="glass-card p-6"
//                 >
//                   <span className="text-3xl font-black text-[#67c3ff]">
//                     {step.number}
//                   </span>
//                   <h3 className="mt-3 text-lg font-bold text-white">
//                     {step.title}
//                   </h3>
//                   <p className="mt-2 text-sm text-white/75">
//                     {step.description}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           </section>
//
//           {/* Tech stack */}
//           <section className="mt-20 text-center">
//             <h2 className="text-2xl font-black text-white">Tech Stack</h2>
//             <div className="mt-6 flex flex-wrap justify-center gap-3">
//               {TECH_STACK.map((tech) => (
//                 <span
//                   key={tech}
//                   className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/75"
//                 >
//                   {tech}
//                 </span>
//               ))}
//             </div>
//           </section>
//
//           {/* Recent video articles */}
//           {videoArticles && videoArticles.length > 0 && (
//             <section className="mt-20">
//               <h2 className="text-center text-2xl font-black text-white">
//                 Recent Video Articles
//               </h2>
//               <p className="mt-2 text-center text-sm text-white/50">
//                 These were generated and published entirely by the agent.
//               </p>
//               <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//                 {videoArticles.map((article) => (
//                   <ArticleCard key={article.id} article={article} />
//                 ))}
//               </div>
//             </section>
//           )}
//
//           {/* CTA */}
//           <div className="mt-20 text-center">
//             <Link
//               href="/blog"
//               className="glass-card inline-block px-8 py-3 text-sm font-bold text-white transition-colors hover:text-[#67c3ff]"
//             >
//               View All Blog Articles &rarr;
//             </Link>
//           </div>
//         </div>
//       </main>
//       <Footer />
//     </>
//   );
// }
