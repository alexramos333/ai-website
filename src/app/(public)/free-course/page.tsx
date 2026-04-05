"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";
import { magicLinkSchema } from "@/lib/utils/validation";

const inputClasses =
  "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#004be0] focus:outline-none focus:ring-1 focus:ring-[#004be0]";
const errorInputClasses =
  "w-full rounded-lg border border-red-400/50 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400";

const benefits = [
  "Understand what AI is and how it applies to your business",
  "Discover the best AI tools available today",
  "Learn prompt engineering to get better results",
  "Automate repetitive tasks and save hours every week",
  "Build a practical AI strategy you can implement immediately",
];

export default function FreeCoursePage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setServerError("");

    const result = magicLinkSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?next=/course`,
      },
    });

    if (error) {
      console.error("Magic link failed:", error.message);
      setServerError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="section-padding relative z-30">
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading subtitle="Master AI tools and strategies in 6 short lessons — completely free.">
              Free AI Course
            </SectionHeading>
          </div>
        </section>

        {/* Benefits */}
        <section className="relative z-30 px-4 pb-12 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <GlassCard padding="lg">
              <h2
                className="mb-6 font-black text-white"
                style={{ fontSize: "clamp(1.1rem, 3vw, 1.25rem)" }}
              >
                What You&apos;ll Learn
              </h2>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-white/75"
                  >
                    <span className="mt-1 block h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-[#FF9B60] to-[#f2295b]" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </div>
        </section>

        {/* Magic Link Form */}
        <section className="relative z-30 px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-md">
            {success ? (
              <GlassCard className="w-full" padding="lg">
                <h2
                  className="mb-2 text-center font-black text-white"
                  style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
                >
                  Check Your Email
                </h2>
                <p className="mb-6 text-center text-white/75">
                  We&apos;ve sent an access link to{" "}
                  <span className="font-medium text-white">{email}</span>. Click
                  the link to start the course instantly.
                </p>
                <p className="text-center text-sm text-white/60">
                  <Link
                    href="/login"
                    className="text-white underline underline-offset-4 hover:text-white/90"
                  >
                    Already have an account? Sign in
                  </Link>
                </p>
              </GlassCard>
            ) : (
              <GlassCard className="w-full" padding="lg">
                <h2
                  className="mb-2 text-center font-black text-white"
                  style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}
                >
                  Get Instant Access
                </h2>
                <p className="mb-8 text-center text-white/75">
                  Enter your email and we&apos;ll send you a magic link — no
                  password needed
                </p>

                {serverError && (
                  <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                    {serverError}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium text-white/75"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className={emailError ? errorInputClasses : inputClasses}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-400">{emailError}</p>
                    )}
                  </div>

                  <CTAButton
                    type="submit"
                    loading={loading}
                    className="w-full"
                    aria-label="Get instant access to the free AI course"
                  >
                    Get Instant Access
                  </CTAButton>
                </form>

                <p className="mt-6 text-center text-sm text-white/60">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-white underline underline-offset-4 hover:text-white/90"
                  >
                    Sign in
                  </Link>
                </p>
              </GlassCard>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
