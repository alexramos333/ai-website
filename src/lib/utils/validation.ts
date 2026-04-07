import { z } from "zod";

// ─── Login ───
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Sign Up ───
export const signUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

// ─── Profile Update ───
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// ─── Contact ───
export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ─── Article ───
export const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type ArticleFormData = z.infer<typeof articleSchema>;

// ─── Magic Link ───
export const magicLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

// ─── Forgot Password ───
export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

// ─── Reset / Change Password ───
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ─── Content Creator Wizard ───
export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const contentCreatorSchema = z
  .object({
    step: z.number().int().min(2).max(5),
    topic: z.string().min(3, "Topic must be at least 3 characters").max(200, "Topic must be 200 characters or less"),
    headlines: z.array(z.string()).optional(),
    selectedHook: z.string().optional(),
    script: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.step >= 3 && (!data.headlines || data.headlines.length === 0)) return false;
      return true;
    },
    { message: "Headlines are required for this step", path: ["headlines"] },
  )
  .refine(
    (data) => {
      if (data.step >= 4 && !data.selectedHook) return false;
      return true;
    },
    { message: "A selected hook is required for this step", path: ["selectedHook"] },
  )
  .refine(
    (data) => {
      if (data.step === 5 && !data.script) return false;
      return true;
    },
    { message: "A script is required for this step", path: ["script"] },
  );

export type ContentCreatorFormData = z.infer<typeof contentCreatorSchema>;

// ─── Google Ads RSA Wizard ───
export type GoogleAdsStep = 1 | 2 | 3 | 4;

export const googleAdsSchema = z
  .object({
    step: z.number().int().min(2).max(3),
    keywords: z.string().min(3, "Keywords must be at least 3 characters").max(2000, "Keywords must be 2000 characters or less"),
    headlines: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.step === 3 && (!data.headlines || data.headlines.length === 0)) return false;
      return true;
    },
    { message: "Headlines are required for this step", path: ["headlines"] },
  );

export type GoogleAdsFormData = z.infer<typeof googleAdsSchema>;
