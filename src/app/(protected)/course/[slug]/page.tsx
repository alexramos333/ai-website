import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getUser } from "@/lib/supabase/queries";
import { lessons, getLessonBySlug } from "@/lib/course/lessons";
import GlassCard from "@/components/ui/GlassCard";
import CTALink from "@/components/ui/CTALink";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);
  return {
    title: lesson ? lesson.title : "Lesson Not Found",
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const prevLesson = lessons.find((l) => l.order === lesson.order - 1);
  const nextLesson = lessons.find((l) => l.order === lesson.order + 1);

  return (
    <div className="section-padding mx-auto max-w-4xl">
      <Link
        href="/course"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back to Course
      </Link>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium text-white/50">
          Lesson {lesson.order} of {lessons.length}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs text-white/60">
          {lesson.duration}
        </span>
      </div>

      <h1
        className="mb-8 font-black text-white"
        style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)" }}
      >
        {lesson.title}
      </h1>

      {/* Video */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-white/10">
        <iframe
          className="aspect-video w-full"
          src={`https://www.youtube.com/embed/${lesson.videoId}`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Description */}
      <GlassCard padding="lg">
        <h2
          className="mb-3 font-black text-white"
          style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}
        >
          About This Lesson
        </h2>
        <p className="text-white/75">{lesson.description}</p>
      </GlassCard>

      {/* Prev / Next Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {prevLesson ? (
          <CTALink
            href={`/course/${prevLesson.slug}`}
            size="sm"
            variant="secondary"
            aria-label={`Previous lesson: ${prevLesson.title}`}
          >
            Previous
          </CTALink>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <CTALink
            href={`/course/${nextLesson.slug}`}
            size="sm"
            aria-label={`Next lesson: ${nextLesson.title}`}
          >
            Next Lesson
          </CTALink>
        ) : (
          <CTALink
            href="/course"
            size="sm"
            aria-label="Back to course overview"
          >
            Finish Course
          </CTALink>
        )}
      </div>
    </div>
  );
}
