import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "@/styles/globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "900"],
  display: "optional",
  variable: "--font-montserrat",
  adjustFontFallback: true,
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
      <head>
        <link rel="preconnect" href={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`} />
      </head>
      <body className="min-h-[100dvh] bg-[#001138] font-sans text-white antialiased">
        {children}
      </body>
    </html>
  );
}
