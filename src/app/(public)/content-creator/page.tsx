import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContentCreatorWizard from "@/components/content-creator/ContentCreatorWizard";

export const metadata: Metadata = {
  title: "AI Content Creator | Generate Video Headlines, Hooks & Scripts",
  description:
    "Free AI-powered content creation tool for video creators. Generate compelling headlines, hooks, scripts, and SEO descriptions in minutes.",
};

export default function ContentCreatorPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <ContentCreatorWizard />
      </main>
      <Footer />
    </>
  );
}
