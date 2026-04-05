"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";
import { loginSchema } from "@/lib/utils/validation";
import type { LoginFormData } from "@/lib/utils/validation";

const inputClasses =
  "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#004be0] focus:outline-none focus:ring-1 focus:ring-[#004be0]";
const errorInputClasses =
  "w-full rounded-lg border border-red-400/50 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");
  const callbackError = searchParams.get("error");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [serverError, setServerError] = useState(callbackError === "auth_callback_failed" ? "Authentication failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      setServerError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const safeRedirect =
      redirectedFrom &&
      redirectedFrom.startsWith("/") &&
      !redirectedFrom.startsWith("//")
        ? redirectedFrom
        : "/dashboard";
    router.push(safeRedirect);
  }

  return (
    <GlassCard className="w-full max-w-md" padding="lg">
      <h1 className="mb-2 text-center font-black text-white" style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}>
        Welcome Back
      </h1>
      <p className="mb-8 text-center text-white/75">
        Sign in to your account
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
            className={errors.email ? errorInputClasses : inputClasses}
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/75">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={errors.password ? errorInputClasses : inputClasses}
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50 hover:text-white/75"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-400">{errors.password}</p>
          )}
          <div className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-sm text-white/50 underline underline-offset-4 hover:text-white/75">
              Forgot password?
            </Link>
          </div>
        </div>

        <CTAButton
          type="submit"
          loading={loading}
          className="w-full"
          aria-label="Sign in to your account"
        >
          Sign In
        </CTAButton>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-white underline underline-offset-4 hover:text-white/90">
          Sign up
        </Link>
      </p>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
