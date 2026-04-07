import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GoogleAdsWizard from "@/components/google-ads/GoogleAdsWizard";

export const metadata: Metadata = {
  title: "Google Ads RSA Generator | Create High-Converting Ad Headlines & Descriptions",
  description:
    "Free AI-powered Google Ads tool. Generate 30 high-converting RSA headlines and descriptions based on proven frameworks for higher CTR, Quality Score, and conversions.",
};

export default function GoogleAdsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <GoogleAdsWizard />
      </main>
      <Footer />
    </>
  );
}
