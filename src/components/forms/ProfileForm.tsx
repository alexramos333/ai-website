"use client";

import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import CTAButton from "@/components/ui/CTAButton";
import { createClient } from "@/lib/supabase/client";
import { profileUpdateSchema } from "@/lib/utils/validation";
import type { ProfileUpdateFormData } from "@/lib/utils/validation";

const inputClasses =
  "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#004be0] focus:outline-none focus:ring-1 focus:ring-[#004be0]";
const errorInputClasses =
  "w-full rounded-lg border border-red-400/50 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400";

interface ProfileFormProps {
  initialData: {
    full_name: string;
    website: string;
    bio: string;
  };
}

type FieldErrors = Partial<Record<keyof ProfileUpdateFormData, string>>;

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setStatus("idle");

    const result = profileUpdateSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ProfileUpdateFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setStatusMessage("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        website: formData.website,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setStatus("error");
      setStatusMessage(error.message);
    } else {
      setStatus("success");
      setStatusMessage("Profile updated successfully.");
    }

    setLoading(false);
  }

  return (
    <GlassCard className="mx-auto w-full max-w-2xl" padding="lg">
      <h1 className="mb-2 font-black text-white" style={{ fontSize: "clamp(1.4rem, 4vw, 2.5rem)" }}>Edit Profile</h1>
      <p className="mb-8 text-white/75">
        Update your personal information below.
      </p>

      {status === "success" && (
        <div className="mb-6 rounded-lg border border-green-400/30 bg-green-400/10 px-4 py-3 text-sm text-green-300">
          {statusMessage}
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-white/75">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            placeholder="John Doe"
            className={errors.full_name ? errorInputClasses : inputClasses}
            value={formData.full_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-400">{errors.full_name}</p>
          )}
        </div>

        <div>
          <label htmlFor="website" className="mb-1.5 block text-sm font-medium text-white/75">
            Website
          </label>
          <input
            id="website"
            type="url"
            placeholder="https://yoursite.com"
            className={errors.website ? errorInputClasses : inputClasses}
            value={formData.website}
            onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
          />
          {errors.website && (
            <p className="mt-1 text-sm text-red-400">{errors.website}</p>
          )}
        </div>

        <div>
          <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-white/75">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            placeholder="Tell us about yourself..."
            className={errors.bio ? errorInputClasses : inputClasses}
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
          />
          {errors.bio && (
            <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
          )}
        </div>

        <CTAButton
          type="submit"
          loading={loading}
          className="w-full"
          aria-label="Save profile changes"
        >
          Save Changes
        </CTAButton>
      </form>
    </GlassCard>
  );
}
