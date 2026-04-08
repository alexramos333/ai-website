"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CTAButton from "@/components/ui/CTAButton";

interface NavChild {
  label: string;
  href: string;
}

interface NavLink {
  label: string;
  href: string;
  children?: NavChild[];
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Free Course", href: "/free-course" },
  {
    label: "Portfolio",
    href: "/portfolio",
    children: [
      { label: "Content Creation Software", href: "/content-creator" },
      { label: "Google Ads Software", href: "/google-ads" },
      { label: "Facebook Ads Software", href: "/facebook-ads" },
      { label: "TikTok Shop Software", href: "/tiktok-shop" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

interface HeaderProps {
  user?: { fullName: string } | null;
}

export default function Header({ user = null }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-white/10 bg-[#001138]/95"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="font-black text-white" style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}>
          AI Website
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) =>
            link.children ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setOpenDropdown(link.href)}
                onMouseLeave={closeDropdown}
              >
                <Link
                  href={link.href}
                  className="text-sm font-medium text-white/75 transition-colors hover:text-white"
                >
                  {link.label}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-1 inline-block"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </Link>
                {openDropdown === link.href && (
                  <div className="absolute left-0 top-full pt-2">
                    <div className="min-w-[220px] rounded-lg border border-white/15 bg-[#001138]/95 py-2 shadow-lg backdrop-blur-sm">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                          onClick={closeDropdown}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/75 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ),
          )}
          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white/75 transition-colors hover:text-white"
              >
                {user.fullName}
              </Link>
              <form action="/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <CTAButton href="/login" size="sm" aria-label="Log in to your account">
              Login
            </CTAButton>
          )}
        </div>

        {/* Hamburger */}
        <button
          type="button"
          className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              isMenuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-0.5 w-6 bg-white transition-all duration-300 ${
              isMenuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          isMenuOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="border-t border-white/10 bg-[#001138]/95 px-6 py-4">
          {navLinks.map((link) => (
            <div key={link.href}>
              <Link
                href={link.href}
                className="block py-3 text-white/75 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
              {link.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block py-2 pl-4 text-sm text-white/60 transition-colors hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="pt-3">
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-white/75 transition-colors hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user.fullName}
                </Link>
                <form action="/logout" method="POST">
                  <button
                    type="submit"
                    className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Logout
                  </button>
                </form>
              </div>
            ) : (
              <CTAButton href="/login" size="sm" aria-label="Log in to your account">
                Login
              </CTAButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
