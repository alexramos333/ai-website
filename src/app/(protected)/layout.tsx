import AuthHeader from "@/components/layout/AuthHeader";
import Footer from "@/components/layout/Footer";

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AuthHeader />
      <main className="min-h-screen pt-20">{children}</main>
      <Footer />
    </>
  );
}
