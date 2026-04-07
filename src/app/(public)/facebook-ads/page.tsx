import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FacebookAdsWizard from "@/components/facebook-ads/FacebookAdsWizard";

export const metadata: Metadata = {
  title: "Facebook Ads Generator | Create High-Converting Ad Copy & Video Scripts",
  description:
    "Free AI-powered Facebook Ads tool. Generate 30 headlines, 30 descriptions, 10 primary text variations, and a 60-second video script — all compliant with Facebook Advertising Policies.",
};

export default function FacebookAdsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <FacebookAdsWizard />
      </main>
      <Footer />
    </>
  );
}
