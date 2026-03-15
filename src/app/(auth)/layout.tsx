export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-[100svh] items-center justify-center px-4">
      {children}
    </div>
  );
}
