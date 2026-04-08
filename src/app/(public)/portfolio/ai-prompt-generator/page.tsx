import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AIPromptGenerator from "@/components/ai-prompt-generator/AIPromptGenerator";

export const metadata: Metadata = {
  title: "AI Prompt Generator | Transform Any Prompt Into an Optimized, High-Quality Prompt",
  description:
    "Free AI-powered prompt optimizer. Paste any simple or rough prompt and instantly get a fully optimized, high-quality prompt using the CO-STAR + RACE framework — ready to use with ChatGPT, Claude, Gemini, Grok, or any AI model.",
};

export default function AIPromptGeneratorPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <AIPromptGenerator />
      </main>
      <Footer />
    </>
  );
}
