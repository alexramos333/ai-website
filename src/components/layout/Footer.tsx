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
          <address className="mt-4 space-y-3 not-italic text-white/75">
            <p className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#5de6fc]" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href="tel:9106199205" className="transition-colors hover:text-white">
                910-619-9205
              </a>
            </p>
            <p className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#5de6fc]" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 4L12 13 2 4" />
              </svg>
              <a href="mailto:alexramos300@gmail.com" className="transition-colors hover:text-white">
                alexramos300@gmail.com
              </a>
            </p>
            <p>Wilmington, NC</p>
          </address>
        </div>

        {/* Social */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Social
          </h3>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="https://www.linkedin.com/in/alex-r-a330a7137/"
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

        {/* Info */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Info
          </h3>
          <div className="mt-4 space-y-2">
            <p className="text-white/75">
              &copy; {new Date().getFullYear()} AI Website. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
