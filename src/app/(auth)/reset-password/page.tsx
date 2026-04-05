"use client";

import { useState } from "react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";
import { resetPasswordSchema } from "@/lib/utils/validation";
import type { ResetPasswordFormData } from "@/lib/utils/validation";

const inputClasses =
  "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#004be0] focus:outline-none focus:ring-1 focus:ring-[#004be0]";
const errorInputClasses =
  "w-full rounded-lg border border-red-400/50 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400";

type FieldErrors = Partial<Record<keyof ResetPasswordFormData, string>>;

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError("");

    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ResetPasswordFormData;
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
    const { error } = await supabase.auth.updateUser({
      password: result.data.password,
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
          Password Updated
        </h1>
        <p className="mb-6 text-center text-white/75">
          Your password has been reset successfully.
        </p>
        <p className="text-center text-sm text-white/60">
          <Link href="/login" className="text-white underline underline-offset-4 hover:text-white/90">
            Sign in with your new password
          </Link>
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="w-full max-w-md" padding="lg">
      <h1 className="mb-2 text-center font-black text-white" style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}>
        Reset Password
      </h1>
      <p className="mb-8 text-center text-white/75">
        Enter your new password below
      </p>

      {serverError && (
        <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/75">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters with a number"
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
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-white/75">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Re-enter your new password"
            className={errors.confirmPassword ? errorInputClasses : inputClasses}
            value={formData.confirmPassword}
            onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
          )}
        </div>

        <CTAButton
          type="submit"
          loading={loading}
          className="w-full"
          aria-label="Reset your password"
        >
          Reset Password
        </CTAButton>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        <Link href="/login" className="text-white underline underline-offset-4 hover:text-white/90">
          Back to sign in
        </Link>
      </p>
    </GlassCard>
  );
}
