import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SceneWrapper from "@/components/effects/SceneWrapper";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";
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
  { emoji: "👨‍💻", role: "AI Engineer" },
  { emoji: "🎨", role: "UI/UX Designer" },
  { emoji: "📊", role: "Data Scientist" },
  { emoji: "🔧", role: "Backend Dev" },
  { emoji: "📱", role: "Mobile Dev" },
  { emoji: "🛡️", role: "Security Expert" },
  { emoji: "☁️", role: "Cloud Architect" },
  { emoji: "🤖", role: "ML Engineer" },
  { emoji: "📈", role: "Growth Hacker" },
  { emoji: "✍️", role: "Content Writer" },
  { emoji: "🎯", role: "SEO Specialist" },
  { emoji: "💡", role: "Product Manager" },
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
                <CTAButton href="/contact" className="w-full sm:w-auto" aria-label="Book a free strategy call">
                  Book Free Strategy Call
                </CTAButton>
                <CTAButton
                  href="/portfolio"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  aria-label="View portfolio"
                >
                  View Portfolio
                </CTAButton>
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
                <GlassCard key={study.stat} animated>
                  <p className="text-sm text-[#3399FF]">Case Study</p>
                  <p className="mt-2 text-xl font-black">{study.stat}</p>
                  <p className="mt-1 text-white/75">{study.detail}</p>
                </GlassCard>
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
                <GlassCard key={i} animated>
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
                </GlassCard>
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
                <GlassCard
                  key={member.role}
                  padding="sm"
                  animated
                  className="text-center"
                >
                  <p className="text-4xl">{member.emoji}</p>
                  <p className="mt-2 text-sm font-black">{member.role}</p>
                </GlassCard>
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
                <GlassCard key={category.title} animated>
                  <h3 className="text-xl font-black">{category.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {category.skills.map((skill) => (
                      <li key={skill} className="text-sm text-white/75">
                        &bull; {skill}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
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
                <p className="text-4xl">📞</p>
                <p className="mt-2 font-black">Phone</p>
                <p className="mt-1 text-white/75">910-619-9205</p>
                <div className="mt-4">
                  <CTAButton href="tel:9106199205" size="sm" aria-label="Call now">
                    Call Now
                  </CTAButton>
                </div>
              </GlassCard>

              <GlassCard className="text-center">
                <p className="text-4xl">✉️</p>
                <p className="mt-2 font-black">Email</p>
                <p className="mt-1 text-white/75">Get In Touch</p>
                <div className="mt-4">
                  <CTAButton
                    href="/contact"
                    size="sm"
                    aria-label="Send email"
                  >
                    Send Email
                  </CTAButton>
                </div>
              </GlassCard>

              <GlassCard className="text-center">
                <p className="text-4xl">💼</p>
                <p className="mt-2 font-black">LinkedIn</p>
                <p className="mt-1 text-white/75">Connect With Me</p>
                <div className="mt-4">
                  <CTAButton
                    href="#"
                    size="sm"
                    aria-label="View LinkedIn profile"
                  >
                    Connect
                  </CTAButton>
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
