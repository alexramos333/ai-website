import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
  { stat: "$0 - $50,000 In Sales In 60 Days With 10X ROI", detail: "" },
  { stat: "345% Increase In Total Leads In 30 Days", detail: "" },
  { stat: "77% Decrease In Cost Per Lead In 30 Days", detail: "" },
  { stat: "32% Decrease In Average Cost Per Lead Over 8 Months Across 40+ Locations", detail: "" },
  { stat: "280% Increase In Total Leads In 30 Days", detail: "" },
  { stat: "92% Decrease In Cost Per Lead In 30 Days", detail: "" },
  { stat: "100% Increase In Annual Sales For Local Business", detail: "" },
  { stat: "20% Increase In Annual Sales For Large Car Dealership", detail: "" },
  { stat: "3.57X ROI In 30 Days For Ecommerce Brand", detail: "" },
];

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

interface TeamMember {
  role: string;
  icon: React.ReactNode;
}

const iconProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 60,
  height: 60,
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
        {/* Terminal window */}
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M2 7h20" />
        {/* Code brackets */}
        <path d="M6 11l-2 2.5L6 16" />
        <path d="M18 11l2 2.5L18 16" />
        {/* AI brain circuit in center */}
        <circle cx="12" cy="13.5" r="2.5" />
        <path d="M12 11v-1M12 16v1M9.5 13.5H8.5M15.5 13.5h-1" />
        <circle cx="12" cy="13.5" r="0.75" fill="currentColor" />
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
        {/* Robot head */}
        <rect x="5" y="6" width="14" height="11" rx="3" />
        {/* Eyes */}
        <circle cx="9.5" cy="11" r="1.5" />
        <circle cx="14.5" cy="11" r="1.5" />
        <circle cx="9.5" cy="11" r="0.5" fill="currentColor" />
        <circle cx="14.5" cy="11" r="0.5" fill="currentColor" />
        {/* Mouth */}
        <path d="M9 14.5h6" />
        {/* Antenna */}
        <path d="M12 6V3" />
        <circle cx="12" cy="2" r="1" fill="currentColor" />
        {/* Signal waves */}
        <path d="M8 3.5C9 2.5 10.5 2 12 2s3 .5 4 1.5" />
        {/* Ears */}
        <path d="M5 10H3v3h2M19 10h2v3h-2" />
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
          <section className="px-4 pt-12 md:pt-16" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <GlassCard padding="md" className="max-w-4xl text-center md:p-10">
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/75">
                AI Engineer | Data Engineer | Full-Stack Software Developer
              </span>
              <h1
                className="mx-auto mt-[10px] md:mt-[10px] max-w-3xl font-black text-3d"
                style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.75rem)", lineHeight: 1.3 }}
              >
                Full-Stack Software Developer That Specializes In Building AI Powered Software Applications
              </h1>
              {/* Video */}
              <div className="mx-auto mt-[10px] md:mt-[10px] w-full max-w-3xl rounded-xl border-2 border-[#5de6fc] overflow-hidden">
                <div className="relative h-0" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    className="absolute left-0 top-0 h-full w-full"
                    src="https://videos.sproutvideo.com/embed/489bdeb41b10eec3c2/2858162633803e3d"
                    frameBorder="0"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Video Player"
                  />
                </div>
              </div>
              <p
                className="mx-auto mt-[5px] md:mt-[10px] max-w-3xl font-bold text-white"
                style={{ fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)" }}
              >
                Whether you&apos;re looking for an AI Engineer, Data Engineer, or Full-Stack Software Developer, you came to the right place. I specialize in helping businesses use AI to Create Custom AI Software, Data Analytics Software, Data Pipelines, AI Automations, and a whole lot more. <span className="text-[#5de6fc] font-bold">Click Below To Learn More Or Call 910-619-9205.</span>
              </p>
              <div className="mt-[10px] md:mt-[10px] flex flex-col items-center justify-center gap-4 sm:flex-row">
                <CTALink href="tel:9106199205" className="w-full sm:w-auto" aria-label="Call now">
                  Call Now
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
            <div className="mt-6 animate-bounce text-white/50">
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

        {/* ════ PORTFOLIO ════ */}
        <section className="section-padding relative z-30 max-md:!pt-0">
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

        {/* ════ CASE STUDIES ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="Real results from real campaigns">
              DIGITAL MARKETING CASE STUDIES
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {caseStudies.map((study) => (
                <AnimatedGlassCard key={study.stat}>
                  <p className="text-lg font-black">Case Study</p>
                  <div className="mt-2 border-b-[2px] border-[#5de6fc] rounded-full" />
                  <p className="mt-4 text-2xl font-black">{study.stat}</p>
                </AnimatedGlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* ════ WHO AM I? ════ */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="A diverse team of specialists">
              WHO AM I?
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
              SKILLS
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {skillCategories.map((category) => (
                <AnimatedGlassCard key={category.title}>
                  <h3 className="pb-2 text-xl font-black">{category.title}</h3>
                  <div className="mt-0 border-b-[2px] border-[#5de6fc]" />
                  <ul className="mt-4 space-y-2">
                    {category.skills.map((skill) => (
                      <li key={skill} className="flex items-start gap-2 text-sm font-bold text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" className="mt-0.5 shrink-0" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" fill="#5de6fc" />
                          <path d="M10 15.17l-3.59-3.58L5 13l5 5 9-9-1.41-1.42L10 15.17z" fill="#001138" />
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
        <section id="contact" className="scroll-mt-20 section-padding relative z-30">
          <div className="mx-auto max-w-7xl">
            <SectionHeading subtitle="Let&apos;s build something amazing together">
              HOW TO CONTACT US
            </SectionHeading>
            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <GlassCard>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5de6fc]" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <h3 className="text-xl font-black">Phone Number</h3>
                </div>
                <div className="mt-2 border-b-[2px] border-[#5de6fc] rounded-full" />
                <p className="mt-4 text-4xl font-black">910-619-9205</p>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#5de6fc]" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 4L12 13 2 4" />
                  </svg>
                  <h3 className="text-xl font-black">Email Address</h3>
                </div>
                <div className="mt-2 border-b-[2px] border-[#5de6fc] rounded-full" />
                <a href="mailto:alexramos300@gmail.com" className="mt-4 block text-xl font-black sm:text-2xl hover:text-[#5de6fc] transition-colors">alexramos300@gmail.com</a>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-[#5de6fc]" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                  <h3 className="text-xl font-black">Linkedin</h3>
                </div>
                <div className="mt-2 border-b-[2px] border-[#5de6fc] rounded-full" />
                <div className="mt-4">
                  <CTALink href="https://www.linkedin.com/in/alex-r-a330a7137/" size="sm" target="_blank" rel="noopener noreferrer" aria-label="View LinkedIn profile">
                    VIEW NOW
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
