import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const ANALYZE = process.env.ANALYZE;

const withBundleAnalyzer = bundleAnalyzer({
  enabled: ANALYZE === "true",
});

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "no-referrer-when-downgrade",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self'",
      `img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com ${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}`,
      `media-src 'self' blob: ${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}`,
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://videos.sproutvideo.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

// Derive Supabase storage hostname from the URL that's already guaranteed to be set
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : `${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ?? ""}.supabase.co`;

// Derive R2 public hostname for image optimization (if configured)
const r2Hostname = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  ? new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname
  : null;

const nextConfig: NextConfig = {
  reactCompiler: true,

  turbopack: {
    root: __dirname,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [320, 420, 768, 1024, 1200],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
      ...(r2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2Hostname,
            },
          ]
        : []),
    ],
  },

  serverExternalPackages: ["sharp"],

  experimental: {
    inlineCss: true,
  },

  compiler: {
    ...(process.env.NODE_ENV === "production" && {
      removeConsole: { exclude: ["error", "warn", "log"] },
    }),
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
