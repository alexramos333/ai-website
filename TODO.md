# TODO / Reminders

## Re-enable the AI Video Agent portfolio page

**Status:** Temporarily hidden — **disabled 2026-05-31**
**Reason:** The AI Video Agent project is not yet complete and isn't ready to show publicly.

The page at `/portfolio/ai-video-agent` is hidden from the site (returns 404) and removed
from the Portfolio nav dropdown. **No code was deleted** — the full original page
implementation is preserved (commented out) in the page file.

### What was changed
- `src/app/(public)/portfolio/ai-video-agent/page.tsx` — active export replaced with a
  `notFound()` stub; original implementation kept below it as line comments.
- `src/components/layout/Header.tsx` — the `{ label: "AI Video Agent", ... }` nav child
  is commented out (removes it from both desktop dropdown and mobile menu).

### How to re-enable (when the project is ready)
1. In `page.tsx`: delete the `notFound()` stub + the import, then uncomment the original
   implementation (the block under "ORIGINAL IMPLEMENTATION").
2. In `Header.tsx`: uncomment the `{ label: "AI Video Agent", href: "/portfolio/ai-video-agent" }`
   nav line.
3. Run `npm run build` and verify `/portfolio/ai-video-agent` renders and appears in the
   Portfolio dropdown again.

### Not affected
- The Python `agent/` video pipeline and all backend code are unchanged — only the public
  marketing page is hidden.
- `sitemap.ts` and the `/portfolio` listing page never referenced this page.
