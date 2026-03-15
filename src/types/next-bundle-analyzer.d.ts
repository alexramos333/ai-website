declare module "@next/bundle-analyzer" {
  import type { NextConfig } from "next";

  interface BundleAnalyzerOptions {
    enabled: boolean;
    openAnalyzer?: boolean;
  }

  export default function withBundleAnalyzer(
    options: BundleAnalyzerOptions
  ): (config: NextConfig) => NextConfig;
}
