"use client";

import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";
import { forgotPasswordSchema } from "@/lib/utils/validation";

const inputClasses =
  "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#004be0] focus:outline-none focus:ring-1 focus:ring-[#004be0]";
const errorInputClasses =
  "w-full rounded-lg border border-red-400/50 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEmailError("");
    setServerError("");

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setServerError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <GlassCard className="w-full max-w-md" padding="lg">
        <h1 className="mb-2 text-center font-black text-white" style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}>
          Check Your Email
        </h1>
        <p className="mb-6 text-center text-white/75">
          We&apos;ve sent a password reset link to{" "}
          <span className="font-medium text-white">{email}</span>.
          Click the link to reset your password.
        </p>
        <p className="text-center text-sm text-white/60">
          <Link href="/login" className="text-white underline underline-offset-4 hover:text-white/90">
            Back to sign in
          </Link>
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md" padding="lg">
      <h1 className="mb-2 text-center font-black text-white" style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}>
        Forgot Password
      </h1>
      <p className="mb-8 text-center text-white/75">
        Enter your email and we&apos;ll send you a reset link
      </p>

      {serverError && (
        <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/75">
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
          aria-label="Send password reset link"
        >
          Send Reset Link
        </CTAButton>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Remember your password?{" "}
        <Link href="/login" className="text-white underline underline-offset-4 hover:text-white/90">
          Sign in
        </Link>
      </p>
    </GlassCard>
  );
}
