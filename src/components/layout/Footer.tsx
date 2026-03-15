import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto">
      {/* Top separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-2 md:grid-cols-3">
        {/* Contact */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Contact
          </h3>
          <address className="mt-4 space-y-2 not-italic text-white/75">
            <p>
              <a
                href="mailto:hello@aiwebsite.com"
                className="transition-colors hover:text-white"
              >
                hello@aiwebsite.com
              </a>
            </p>
            <p>San Francisco, CA</p>
          </address>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Social
          </h3>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 transition-colors hover:text-white"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 transition-colors hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/75 transition-colors hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Legal
          </h3>
          <div className="mt-4 space-y-2">
            <p className="text-white/75">
              &copy; {new Date().getFullYear()} AI Website. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="text-white/75 transition-colors hover:text-white"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-white/75 transition-colors hover:text-white"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
