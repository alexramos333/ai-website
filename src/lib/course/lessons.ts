export interface Lesson {
  slug: string;
  title: string;
  description: string;
  videoId: string;
  duration: string;
  order: number;
}

export const lessons: Lesson[] = [
  {
    slug: "what-is-ai",
    title: "What Is AI?",
    description:
      "An accessible introduction to artificial intelligence — what it is, how it works, and why it matters for your business.",
    videoId: "dQw4w9WgXcQ",
    duration: "12:45",
    order: 1,
  },
  {
    slug: "ai-tools-overview",
    title: "AI Tools Overview",
    description:
      "A tour of the most impactful AI tools available today and how to choose the right ones for your workflow.",
    videoId: "dQw4w9WgXcQ",
    duration: "15:30",
    order: 2,
  },
  {
    slug: "prompt-engineering-basics",
    title: "Prompt Engineering Basics",
    description:
      "Learn the fundamentals of writing effective prompts to get consistent, high-quality results from AI models.",
    videoId: "dQw4w9WgXcQ",
    duration: "18:20",
    order: 3,
  },
  {
    slug: "ai-for-content-creation",
    title: "AI for Content Creation",
    description:
      "How to use AI to draft blog posts, social media content, and marketing copy — without losing your brand voice.",
    videoId: "dQw4w9WgXcQ",
    duration: "14:10",
    order: 4,
  },
  {
    slug: "automating-workflows",
    title: "Automating Workflows with AI",
    description:
      "Discover how to connect AI tools to your existing systems and automate repetitive tasks.",
    videoId: "dQw4w9WgXcQ",
    duration: "16:55",
    order: 5,
  },
  {
    slug: "ai-strategy-next-steps",
    title: "Building Your AI Strategy",
    description:
      "Putting it all together — how to create a practical AI adoption plan for your business.",
    videoId: "dQw4w9WgXcQ",
    duration: "20:00",
    order: 6,
  },
];

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}
