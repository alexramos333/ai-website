import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SceneWrapper from "@/components/effects/SceneWrapper";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedGlassCard from "@/components/ui/AnimatedGlassCard";
import CTALink from "@/components/ui/CTALink";
import SectionHeading from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Full-stack AI developer and digital marketer with 8+ years of experience helping businesses scale with cutting-edge automation and proven strategies.",
};

/* ─── Data ─── */

interface CaseStudy {
  stat: string;
  detail: string;
}

const caseStudies: CaseStudy[] = [
  { stat: "500% ROI", detail: "E-commerce revenue growth in 6 months" },
  { stat: "10x Leads", detail: "B2B lead generation via AI chatbots" },
  { stat: "3M+ Views", detail: "Viral social media campaign reach" },
  { stat: "$2M Saved", detail: "Automation replacing manual workflows" },
  { stat: "85% Open Rate", detail: "AI-optimized email marketing" },
  { stat: "40% Lower CAC", detail: "PPC optimization with machine learning" },
  { stat: "#1 Rankings", detail: "SEO dominance in competitive niches" },
  { stat: "200% Traffic", detail: "Content strategy powered by AI insights" },
  { stat: "98% Retention", detail: "Customer loyalty through personalization" },
];

interface PortfolioItem {
  title: string;
  description: string;
}

const portfolioItems: PortfolioItem[] = [
  {
    title: "AI Agent Software Automation",
    description: "Intelligent agent automating customer support workflows",
  },
  {
    title: "AI Agent Software Automation",
    description: "Predictive analytics dashboard for sales forecasting",
  },
  {
    title: "AI Agent Software Automation",
    description: "Automated content generation and publishing pipeline",
  },
  {
    title: "AI Agent Software Automation",
    description: "Smart inventory management with demand prediction",
  },
  {
    title: "AI Agent Software Automation",
    description: "AI-powered lead scoring and qualification system",
  },
  {
    title: "AI Agent Software Automation",
    description: "Real-time sentiment analysis for brand monitoring",
  },
];

interface TeamMember {
  emoji: string;
  role: string;
}

const teamMembers: TeamMember[] = [
  { emoji: "\u{1F468}\u200D\u{1F4BB}", role: "AI Engineer" },
  { emoji: "\u{1F3A8}", role: "UI/UX Designer" },
  { emoji: "\u{1F4CA}", role: "Data Scientist" },
  { emoji: "\u{1F527}", role: "Backend Dev" },
  { emoji: "\u{1F4F1}", role: "Mobile Dev" },
  { emoji: "\u{1F6E1}\uFE0F", role: "Security Expert" },
  { emoji: "\u2601\uFE0F", role: "Cloud Architect" },
  { emoji: "\u{1F916}", role: "ML Engineer" },
  { emoji: "\u{1F4C8}", role: "Growth Hacker" },
  { emoji: "\u270D\uFE0F", role: "Content Writer" },
  { emoji: "\u{1F3AF}", role: "SEO Specialist" },
  { emoji: "\u{1F4A1}", role: "Product Manager" },
];

interface SkillCategory {
  title: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    title: "Digital Marketing",
    skills: [
      "Search Engine Optimization (SEO)",
      "Pay-Per-Click Advertising (PPC)",
      "Social Media Marketing",
      "Email Marketing Automation",
      "Content Marketing Strategy",
      "Conversion Rate Optimization",
      "Analytics & Reporting",
      "Brand Strategy & Identity",
    ],
  },
  {
    title: "AI Skills",
    skills: [
      "Machine Learning Models",
      "Natural Language Processing",
      "Computer Vision",
      "AI Agent Development",
      "Prompt Engineering",
      "Predictive Analytics",
      "Recommendation Systems",
      "AI Workflow Automation",
    ],
  },
  {
    title: "Coding Skills",
    skills: [
      "TypeScript / JavaScript",
      "React / Next.js",
      "Python / FastAPI",
      "Node.js / Express",
      "PostgreSQL / Supabase",
      "Tailwind CSS",
      "Docker / DevOps",
      "REST & GraphQL APIs",
    ],
  },
];

/* ─── Page Component ─── */

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* ════ HERO ════ */}
        <SceneWrapper>
          <section className="flex min-h-[100svh] flex-col items-center justify-center px-4 pt-20">
            <GlassCard padding="lg" className="max-w-3xl text-center">
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/75">
                AI-Powered Solutions for Modern Business
              </span>
              <h1
                className="mt-6 font-black text-3d"
                style={{ fontSize: "clamp(1.75rem, 5vw, 3.5rem)" }}
              >
                Build Smarter.
                <br />
                Scale Faster.
              </h1>
              <p
                className="mx-auto mt-4 max-w-xl text-white/75"
                style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)" }}
              >
                Full-stack AI developer and digital marketer with 8+ years of
                experience helping businesses scale with cutting-edge automation
                and proven strategies.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <CTALink href="/contact" className="w-full sm:w-auto" aria-label="Book a free strategy call">
                  Book Free Strategy Call
                </CTALink>
                <CTALink
                  href="/portfolio"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  aria-label="View portfolio"
                >
                  View Portfolio
                </CTALink>
              </div>
            </GlassCard>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 animate-bounce text-white/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </section>
        </SceneWrapper>

        {/* ════ CASE STUDIES ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="Real results from real campaigns">
              DIGITAL MARKETING CASE STUDIES
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {caseStudies.map((study) => (
                <AnimatedGlassCard key={study.stat}>
                  <p className="text-sm text-[#3399FF]">Case Study</p>
                  <p className="mt-2 text-xl font-black">{study.stat}</p>
                  <p className="mt-1 text-white/75">{study.detail}</p>
                </AnimatedGlassCard>
              ))}
            </div>
          </div>
        </section>

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
                  <p className="mt-1 text-sm text-white/75">
                    {item.description}
                  </p>
                  {/* Video placeholder */}
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
                  <p className="mt-3 text-sm text-[#3399FF]">
                    View Full Screen &rarr;
                  </p>
                </AnimatedGlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ════ WHO WE ARE ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="A diverse team of specialists">
              WHO WE ARE
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <AnimatedGlassCard
                  key={member.role}
                  padding="sm"
                  className="text-center"
                >
                  <p className="text-4xl">{member.emoji}</p>
                  <p className="mt-2 text-sm font-black">{member.role}</p>
                </AnimatedGlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ════ SKILLS ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="Full-stack expertise across marketing, AI, and engineering">
              WHAT WE DO
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {skillCategories.map((category) => (
                <AnimatedGlassCard key={category.title}>
                  <h3 className="text-xl font-black">{category.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {category.skills.map((skill) => (
                      <li key={skill} className="text-sm text-white/75">
                        &bull; {skill}
                      </li>
                    ))}
                  </ul>
                </AnimatedGlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ════ CONTACT ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="Let&apos;s build something amazing together">
              HOW TO CONTACT US
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard className="text-center">
                <p className="text-4xl">{"\u{1F4DE}"}</p>
                <p className="mt-2 font-black">Phone</p>
                <p className="mt-1 text-white/75">910-619-9205</p>
                <div className="mt-4">
                  <CTALink href="tel:9106199205" size="sm" aria-label="Call now">
                    Call Now
                  </CTALink>
                </div>
              </GlassCard>

              <GlassCard className="text-center">
                <p className="text-4xl">{"\u2709\uFE0F"}</p>
                <p className="mt-2 font-black">Email</p>
                <p className="mt-1 text-white/75">Get In Touch</p>
                <div className="mt-4">
                  <CTALink
                    href="/contact"
                    size="sm"
                    aria-label="Send email"
                  >
                    Send Email
                  </CTALink>
                </div>
              </GlassCard>

              <GlassCard className="text-center">
                <p className="text-4xl">{"\u{1F4BC}"}</p>
                <p className="mt-2 font-black">LinkedIn</p>
                <p className="mt-1 text-white/75">Connect With Me</p>
                <div className="mt-4">
                  <CTALink
                    href="#"
                    size="sm"
                    aria-label="View LinkedIn profile"
                  >
                    Connect
                  </CTALink>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
