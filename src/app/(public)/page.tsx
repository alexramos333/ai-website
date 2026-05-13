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
  role: string;
  icon: React.ReactNode;
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 40,
  height: 40,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "mx-auto text-[#5de6fc]",
  "aria-hidden": true as const,
};

const teamMembers: TeamMember[] = [
  {
    role: "Full-Stack AI Software Developer",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M12 2a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3.5 5.5C16.5 14.5 18 16 18 18v2H6v-2c0-2 1.5-3.5 3.5-4.5C7.5 12.5 6 10.5 6 8a6 6 0 0 1 6-6z" />
        <path d="M9 8c0-1 .5-2 1.5-2.5M15 8c0-1-.5-2-1.5-2.5" />
        <path d="M8 22v-2M16 22v-2" />
      </svg>
    ),
  },
  {
    role: "AI Automation Expert",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <rect x="5" y="2" width="14" height="8" rx="2" />
        <circle cx="9" cy="6" r="1" fill="currentColor" />
        <circle cx="15" cy="6" r="1" fill="currentColor" />
        <path d="M9 10v2M15 10v2" />
        <rect x="7" y="14" width="10" height="6" rx="1" />
        <path d="M12 10v4M10 20v2M14 20v2" />
      </svg>
    ),
  },
  {
    role: "AI Agent Expert",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="5" />
        <path d="M12 3v0" />
        <path d="M9.5 6.5L10.5 7.5" />
        <path d="M14.5 6.5L13.5 7.5" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
        <path d="M7 13c-2 1-3 3-3 5v2h16v-2c0-2-1-4-3-5" />
        <path d="M8 8h-.5a1 1 0 0 1 0-2H8M16 8h.5a1 1 0 0 0 0-2H16" />
      </svg>
    ),
  },
  {
    role: "Full-Stack Web Developer",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    role: "Digital Marketer",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <polyline points="7 10 10 7 13 10 17 7" />
      </svg>
    ),
  },
  {
    role: "Sales Funnel Builder",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M4 4h16l-6 8v6l-4 2v-8z" />
        <circle cx="17" cy="7" r="3" />
        <path d="M17 6v2M16 7h2" />
      </svg>
    ),
  },
  {
    role: "Video Editor",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <rect x="2" y="5" width="14" height="14" rx="2" />
        <path d="M16 10l6-4v12l-6-4" />
      </svg>
    ),
  },
  {
    role: "Graphic Designer",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 15l-5-5L5 21" />
        <path d="M14 14l3-3 4 4" />
      </svg>
    ),
  },
  {
    role: "Email Marketer",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 4L12 13 2 4" />
      </svg>
    ),
  },
  {
    role: "Copywriter",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    role: "Project Manager",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    role: "SEO Expert",
    icon: (
      <svg {...iconProps} viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M7 8h10M7 12h6M7 16h8" />
        <path d="M17 17l4 4" />
        <circle cx="15" cy="15" r="2" />
      </svg>
    ),
  },
];

interface SkillCategory {
  title: string;
  skills: string[];
}

const skillCategories: SkillCategory[] = [
  {
    title: "AI Skills",
    skills: [
      "AI | Artificial Intelligence",
      "Python",
      "React",
      "Next JS",
      "AI Agents",
      "Voice Activated AI Agents",
      "AI Automations",
      "AI APIs",
      "REST APIs",
      "Claude AI",
      "ChatGPT",
      "Google Gemini",
      "Perplexity AI",
      "Lovable AI",
      "Supabase",
      "Open AI API / ChatGPT API",
      "Open AI Whisper API",
      "Anthropic API / Claude AI API",
      "Google Sheets API",
      "ChatGPT Automation",
      "Anthropic AI",
    ],
  },
  {
    title: "Coding Skills",
    skills: [
      "AI Software Development",
      "AI Software Engineering",
      "Enterprise Software Development",
      "Software Development",
      "Software Engineer",
      "SAAS Development",
      "Cybersecurity",
      "Defense In Depth Cybersecurity",
      "AWS",
      "Github",
      "Responsive Web Design",
      "UX Web Design",
      "UI Web Design",
      "Generative AI",
      "HTML5",
      "CSS | Cascading Style Sheets",
      "JavaScript",
      "Bootstrap",
      "Google Search Console",
      "Gamma AI",
      "Eleven Labs",
    ],
  },
  {
    title: "Marketing Skills",
    skills: [
      "Advertising",
      "Marketing",
      "Content Creation",
      "Social Media Marketing",
      "Direct Response Marketing",
      "Copywriting",
      "Script Writing",
      "Conversion Rate Optimization",
      "SEM | Search Engine Marketing",
      "SEO | Search Engine Optimization",
      "Keyword Research",
      "Offer Creation",
      "Management",
      "Project Management",
      "Amazon FBA",
      "Amazon Selling",
      "Video Production",
      "VSL Video Creation",
      "VSL Video Script Creation",
      "Graphic Design",
      "Digital Photography",
    ],
  },
  {
    title: "Creative Skills",
    skills: [
      "Sales",
      "E-commerce",
      "B2B Sales",
      "High-Ticket Sales",
      "High-Ticket Closing",
      "Email Marketing",
      "Google Analytics",
      "Business Strategy",
      "Business Analysis",
      "Business Development",
      "Sales Presentations",
      "Business Process Improvement",
      "Adobe Creative Suite",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Adobe Premiere Pro",
      "Adobe After Effects",
      "Adobe Audition",
      "Adobe InDesign",
      "Adobe Lightroom",
      "Adobe Express",
    ],
  },
  {
    title: "Digital Marketing",
    skills: [
      "Lead Generation",
      "Google PPC Ads",
      "Facebook Ads Manager",
      "TikTok Ads",
      "Amazon PPC",
      "Bing PPC Ads",
      "Sales Funnels",
      "Digital Marketing",
      "Appointment Funnels",
      "Booking Funnels",
      "GoHighLevel",
      "Clickfunnels",
      "WordPress",
      "Elementor",
      "Shopify",
      "Web Scraping",
      "Data Scraping",
      "Data Extraction",
      "AI Data Scraping",
      "AI Data Extraction",
      "Automated Data Extraction",
    ],
  },
  {
    title: "Other Skills",
    skills: [
      "Runway ML",
      "Canva",
      "Youtube",
      "VidIQ",
      "Communication",
      "Emotional Intelligence",
      "Creativity",
      "Adaptability",
      "Persuasion",
      "Collaboration",
      "Analytical Reasoning",
      "Critical Thinking",
      "Problem Solving",
      "Business Consulting",
      "Strong Work Ethic",
      "Data Entry",
      "Moz",
      "Yext",
      "Mailchimp",
      "Unbounce",
      "Constant Contact",
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
                  padding="md"
                  className="text-center"
                >
                  <div className="mb-3">{member.icon}</div>
                  <p className="text-base font-black leading-tight">{member.role}</p>
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
                  <h3 className="border-b border-[#5de6fc] pb-2 text-xl font-black">{category.title}</h3>
                  <ul className="mt-4 space-y-2">
                    {category.skills.map((skill) => (
                      <li key={skill} className="flex items-start gap-2 text-sm font-bold text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0 text-[#5de6fc]" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" opacity="0.25" />
                          <path d="M10 15.17l-3.59-3.58L5 13l5 5 9-9-1.41-1.42L10 15.17z" />
                        </svg>
                        {skill}
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
