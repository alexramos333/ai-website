import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/queries";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import CTALink from "@/components/ui/CTALink";
import { lessons } from "@/lib/course/lessons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Free AI Course",
};

export default async function CoursePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="section-padding mx-auto max-w-5xl">
      <SectionHeading subtitle="6 lessons to help you master AI for your business">
        Free AI Course
      </SectionHeading>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <GlassCard key={lesson.slug} padding="lg">
            <span className="text-sm font-medium text-white/50">
              Lesson {lesson.order}
            </span>
            <h2
              className="mt-1 font-black text-white"
              style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}
            >
              {lesson.title}
            </h2>
            <p className="mt-2 text-sm text-white/75">{lesson.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-white/50">{lesson.duration}</span>
              <CTALink
                href={`/course/${lesson.slug}`}
                size="sm"
                aria-label={`Watch ${lesson.title}`}
              >
                Watch
              </CTALink>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
