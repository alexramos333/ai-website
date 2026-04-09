import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EmailGeneratorWizard from "@/components/email-generator/EmailGeneratorWizard";

export const metadata: Metadata = {
  title: "AI Email Sequence Generator | Create High-Converting Email Sequences Instantly",
  description:
    "Free AI-powered email sequence generator. Choose from Welcome, Lead Nurture, Sales, Abandoned Cart, or Re-Engagement sequences — each built using proven copywriting frameworks like AIDA, PAS, and BAB.",
};

export default function AIEmailGeneratorPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <EmailGeneratorWizard />
      </main>
      <Footer />
    </>
  );
}
