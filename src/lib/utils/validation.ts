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
