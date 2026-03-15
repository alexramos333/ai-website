import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { TransitionProvider } from "@/contexts/TransitionContext";
import LazyPageTransition from "@/components/effects/LazyPageTransition";
import "@/styles/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "900"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "AI Website",
    template: "%s | AI Website",
  },
  description:
    "AI-focused solutions for modern businesses. Transform your workflow with intelligent automation and cutting-edge technology.",
  openGraph: {
    title: "AI Website",
    description:
      "AI-focused solutions for modern businesses. Transform your workflow with intelligent automation and cutting-edge technology.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body className="min-h-screen bg-[#001138] font-sans text-white antialiased">
        <TransitionProvider>
          {children}
          <LazyPageTransition />
        </TransitionProvider>
      </body>
    </html>
  );
}
