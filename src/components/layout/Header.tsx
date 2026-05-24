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
  external?: boolean;
  hidden?: boolean;
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/alex-r-a330a7137/", external: true },
  { label: "Free Course", href: "/free-course", hidden: true },
  {
    label: "Portfolio",
    href: "/portfolio",
    children: [
      { label: "Content Creation Software", href: "/content-creator" },
      { label: "Google Ads Software", href: "/google-ads" },
      { label: "Facebook Ads Software", href: "/facebook-ads" },
      { label: "TikTok Shop Software", href: "/tiktok-shop" },
      { label: "AI Prompt Generator", href: "/portfolio/ai-prompt-generator" },
      { label: "AI Email Generator", href: "/portfolio/ai-email-generator" },
      { label: "AI Video Agent", href: "/portfolio/ai-video-agent" },
    ],
  },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
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
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-0 pb-[10px] md:py-4">
        {/* Logo */}
        <Link href="/" className="font-black text-white" style={{ fontSize: "clamp(1rem, 3vw, 1.25rem)" }}>
          AI Website
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.filter((l) => !l.hidden).map((link) =>
            link.children ? (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => setOpenDropdown(link.href)}
                onMouseLeave={closeDropdown}
              >
                <Link
                  href={link.href}
                  className="text-sm font-medium text-white/75 transition-colors hover:text-[#5de6fc]"
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
                          className="block px-4 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-[#5de6fc]"
                          onClick={closeDropdown}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-white/75 transition-colors hover:text-[#5de6fc]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/75 transition-colors hover:text-[#5de6fc]"
              >
                {link.label}
              </Link>
            ),
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
        className={`overflow-y-auto transition-all duration-300 md:hidden ${
          isMenuOpen ? "max-h-[80vh]" : "max-h-0"
        }`}
      >
        <div className="border-t border-white/10 bg-[#001138]/95 px-6 py-4">
          {navLinks.filter((l) => !l.hidden).map((link) => (
            <div key={link.href}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-3 text-white/75 transition-colors hover:text-[#5de6fc]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="block py-3 text-white/75 transition-colors hover:text-[#5de6fc]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              )}
              {link.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="block py-2 pl-4 text-sm text-white/60 transition-colors hover:text-[#5de6fc]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
