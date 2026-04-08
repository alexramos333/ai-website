import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import TikTokShopWizard from "@/components/tiktok-shop/TikTokShopWizard";

export const metadata: Metadata = {
  title: "TikTok Shop Ads Generator | Create High-Converting Ad Copy & Video Scripts",
  description:
    "Free AI-powered TikTok Shop Ads tool for affiliates. Generate 30 headlines, SEO descriptions, 10 sales angles, scroll-stopping hooks, and a 40-second video script — all compliant with TikTok Shop Advertising Policies.",
};

export default function TikTokShopPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <TikTokShopWizard />
      </main>
      <Footer />
    </>
  );
}
