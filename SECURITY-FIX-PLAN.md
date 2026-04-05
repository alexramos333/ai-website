# Security Fix Plan for AI Website

Step-by-step instructions for Claude Code to fix all security vulnerabilities,
build warnings, and code quality issues found during the audit.

Run verification after EVERY step: `npm run type-check && npm run lint && npm run build`

---

## Step 1: Fix Vulnerable Dependencies (5 CVEs)

**Problem:** `npm audit` reports 4 vulnerable packages including 5 moderate CVEs
in Next.js 16.1.6 (HTTP request smuggling, CSRF bypass, DoS), plus high-severity
issues in `flatted` (prototype pollution) and `picomatch` (ReDoS).

**Files to modify:** `package.json`

**Instructions:**

1. Run `npm audit fix` to patch `flatted`, `picomatch`, and `brace-expansion`
2. Run `npm audit fix --force` to upgrade Next.js from 16.1.6 to 16.2.2+
3. If `--force` causes conflicts, manually update `package.json`:
   - Change `"next": "16.1.6"` to `"next": "^16.2.2"`
   - Change `"eslint-config-next": "16.1.6"` to `"eslint-config-next": "^16.2.2"`
   - Change `"@next/bundle-analyzer": "^16.1.6"` to `"@next/bundle-analyzer": "^16.2.2"`
   - Run `npm install`
4. Run `npm audit` again — should show 0 vulnerabilities
5. Run `npm run build` — fix any breaking changes from the Next.js upgrade
6. The build currently shows a deprecation warning: `The "middleware" file convention
   is deprecated. Please use "proxy" instead.` — If the new Next.js version requires
   migration from middleware to proxy, follow the migration guide at
   https://nextjs.org/docs/messages/middleware-to-proxy. If it still works as a
   warning only, note it but don't migrate yet (separate task).

**Verification:** `npm audit` shows 0 vulnerabilities. Build succeeds.

---

## Step 2: Fix XSS — Sanitize Article HTML Content

**Problem:** `src/app/(public)/blog/[slug]/page.tsx` line 161 renders article
content as raw HTML via `dangerouslySetInnerHTML={{ __html: article.content }}`.
The existing `sanitizeText()` in `src/lib/utils/sanitize.ts` only strips null
bytes — it does NOT remove HTML/JavaScript tags. A compromised admin account or
malicious webhook payload could inject scripts into every reader's browser.

**Files to modify:**
- `package.json` (add `isomorphic-dompurify`)
- `src/lib/utils/sanitize.ts` (add `sanitizeHtml` function)
- `src/app/(public)/blog/[slug]/page.tsx` (use `sanitizeHtml` before rendering)

**Instructions:**

1. Install DOMPurify: `npm install isomorphic-dompurify` and
   `npm install -D @types/dompurify`
2. In `src/lib/utils/sanitize.ts`, add a new `sanitizeHtml` function:
   ```ts
   import DOMPurify from "isomorphic-dompurify";

   /** Sanitize HTML content — strips all dangerous tags/attributes while
    *  preserving safe formatting (p, h1-h6, a, ul, ol, li, strong, em,
    *  code, pre, blockquote, img with src/alt only). */
   export function sanitizeHtml(html: string): string {
     return DOMPurify.sanitize(html, {
       ALLOWED_TAGS: [
         "p", "br", "strong", "em", "b", "i", "u", "s",
         "h1", "h2", "h3", "h4", "h5", "h6",
         "ul", "ol", "li",
         "a", "img",
         "blockquote", "pre", "code",
         "table", "thead", "tbody", "tr", "th", "td",
         "hr", "div", "span",
       ],
       ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class"],
       ALLOW_DATA_ATTR: false,
     });
   }
   ```
3. In `src/app/(public)/blog/[slug]/page.tsx`, import `sanitizeHtml` and use it:
   ```ts
   import { sanitizeHtml } from "@/lib/utils/sanitize";
   ```
   Change line 161 from:
   ```tsx
   dangerouslySetInnerHTML={{ __html: article.content }}
   ```
   to:
   ```tsx
   dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
   ```

**Verification:** Build succeeds. Article pages still render formatted content
but script tags and event handlers are stripped.

---

## Step 3: Strengthen Content Security Policy (CSP)

**Problem:** `next.config.ts` lines 39-40 set `script-src 'self' 'unsafe-inline'
'unsafe-eval'` and `style-src 'self' 'unsafe-inline'`. This effectively disables
CSP protection against XSS — any injected inline script will execute.

**Files to modify:** `next.config.ts`

**Instructions:**

1. Remove `'unsafe-eval'` from `script-src`. This is rarely needed in production
   Next.js apps (it's mainly for dev mode sourcemaps).
2. Keep `'unsafe-inline'` for now in BOTH `script-src` and `style-src`. Reason:
   Next.js injects inline scripts for hydration and Tailwind CSS uses inline styles.
   Removing these requires nonce-based CSP which is a larger migration. Document
   this as a future improvement.
3. Update the CSP in `next.config.ts` to:
   ```ts
   {
     key: "Content-Security-Policy",
     value: [
       "default-src 'self'",
       "script-src 'self' 'unsafe-inline'",
       "style-src 'self' 'unsafe-inline'",
       "font-src 'self'",
       "img-src 'self' data: blob: https://*.supabase.co https://img.youtube.com",
       "media-src 'self' blob:",
       "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
       "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
       "frame-ancestors 'none'",
     ].join("; "),
   },
   ```
   The only change is removing `'unsafe-eval'` from `script-src`.
4. Run `npm run dev` and verify the site loads without console CSP errors.
   If anything breaks because of the removed `'unsafe-eval'`, add a comment
   explaining why it's needed and restore it only for that specific case.

**Verification:** Build succeeds. No runtime CSP errors in the browser console
when navigating the site.

---

## Step 4: Remove Hardcoded Supabase Project ID

**Problem:** The Supabase project ID `dmuoleakkfmkjjtkynig` is hardcoded in
multiple files and committed to git. While not a secret key, it's sensitive
infrastructure info that should come from environment variables.

**Files to modify:**
- `.env.local.example` (add new variable)
- `next.config.ts` (use env variable for remotePatterns hostname)
- `src/app/layout.tsx` (use env variable for preconnect href)
- `package.json` (use env variable in db:types script)

**Instructions:**

1. Add to `.env.local.example`:
   ```
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=your-project-id
   ```
2. Add to your actual `.env.local` (do NOT commit):
   ```
   NEXT_PUBLIC_SUPABASE_PROJECT_ID=dmuoleakkfmkjjtkynig
   ```
3. In `next.config.ts`, change the `remotePatterns` hostname:
   ```ts
   hostname: `${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`,
   ```
   Note: `next.config.ts` runs at build time so this will be inlined.
4. In `src/app/layout.tsx`, change the preconnect link:
   ```tsx
   <link
     rel="preconnect"
     href={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`}
   />
   ```
5. In `package.json`, update the `db:types` script:
   ```json
   "db:types": "npx supabase gen types typescript --project-id $NEXT_PUBLIC_SUPABASE_PROJECT_ID > src/lib/database.types.ts"
   ```
   Or keep it hardcoded in the script since it only runs locally (developer
   convenience). Either approach is acceptable — just be consistent.

**Verification:** Build succeeds. Images from Supabase storage still load.

---

## Step 5: Add Rate Limiting to Webhook Endpoint

**Problem:** `src/app/api/webhooks/ai-article/route.ts` has no rate limiting.
It uses `createAdminClient()` which bypasses RLS, so an attacker who discovers
the endpoint could spam article creation if they brute-force the token.

**Files to modify:** `src/app/api/webhooks/ai-article/route.ts`

**Instructions:**

1. Import the rate limiting utilities at the top of the file:
   ```ts
   import { getRateLimitKey, checkRateLimit } from "@/lib/utils/api";
   ```
2. Add rate limiting as the FIRST check in the POST handler, before token
   verification (to prevent brute-force attempts on the token):
   ```ts
   export async function POST(request: NextRequest) {
     // Rate limit: 5 requests per 60 seconds per IP
     const rateLimitKey = `webhook:${getRateLimitKey(request)}`;
     const { allowed } = checkRateLimit(rateLimitKey, 5, 60_000);
     if (!allowed) {
       return createErrorResponse("Too many requests.", 429);
     }

     // ... existing token verification code ...
   }
   ```
3. This uses the existing in-memory rate limiter. For production, the TODO to
   migrate to Redis/Vercel KV applies here too (see Step 8).

**Verification:** Build succeeds. Webhook still accepts valid requests.

---

## Step 6: Use Generic Error Messages for Users

**Problem:** Multiple components display raw Supabase error messages to users
via `error.message`. These can leak database schema details (e.g. "duplicate key
value violates unique constraint 'profiles_email_key'").

**Files to modify:**
- `src/components/forms/ProfileForm.tsx` (lines 86 and 122)
- `src/app/(auth)/login/page.tsx` (line 59)
- `src/app/(auth)/forgot-password/page.tsx` (line 41)
- `src/app/(auth)/reset-password/page.tsx` (check for same pattern)
- `src/app/(public)/free-course/page.tsx` (line 55)
- `src/app/(auth)/signup/page.tsx` (check for same pattern)

**Instructions:**

For each file, find every instance where a Supabase `error.message` is shown
to the user and replace it with a generic message. Log the real error for
debugging.

Pattern to find:
```ts
if (error) {
  setSomeError(error.message);  // BAD: exposes internal details
}
```

Replace with:
```ts
if (error) {
  console.error("Context:", error.message);  // Logged for debugging
  setSomeError("Something went wrong. Please try again.");  // Generic for user
}
```

Specific changes:

1. **`ProfileForm.tsx` line 84-86** — profile update error:
   ```ts
   if (error) {
     console.error("Profile update failed:", error.message);
     setStatus("error");
     setStatusMessage("Failed to update profile. Please try again.");
   }
   ```

2. **`ProfileForm.tsx` line 120-122** — password change error:
   ```ts
   if (error) {
     console.error("Password update failed:", error.message);
     setPasswordStatus("error");
     setPasswordStatusMessage("Failed to update password. Please try again.");
   }
   ```

3. **`login/page.tsx` line 58-59** — login error:
   For login specifically, keep a slightly more helpful message since users
   need to know if credentials are wrong:
   ```ts
   if (error) {
     console.error("Login failed:", error.message);
     setServerError("Invalid email or password.");
   }
   ```

4. **`forgot-password/page.tsx` line 40-41** — already safe (Supabase returns
   success even if email doesn't exist to prevent enumeration). But sanitize
   just in case:
   ```ts
   if (error) {
     console.error("Password reset request failed:", error.message);
     setServerError("Something went wrong. Please try again.");
   }
   ```

5. **`free-course/page.tsx` line 53-55** — magic link error:
   ```ts
   if (error) {
     console.error("Magic link failed:", error.message);
     setServerError("Something went wrong. Please try again.");
   }
   ```

6. **Check `signup/page.tsx` and `reset-password/page.tsx`** for the same
   pattern and apply the same fix.

**Verification:** Build succeeds. Error messages shown to users are generic.

---

## Step 7: Add Rate Limiting to View Count Endpoint

**Problem:** `src/app/api/articles/[slug]/view/route.ts` is a public POST
endpoint with no rate limiting and no slug validation. It uses `createAdminClient()`
which bypasses RLS.

**Files to modify:** `src/app/api/articles/[slug]/view/route.ts`

**Instructions:**

1. Add rate limiting (10 requests per 60 seconds per IP):
   ```ts
   import { getRateLimitKey, checkRateLimit, createErrorResponse, createSuccessResponse } from "@/lib/utils/api";

   export async function POST(
     request: NextRequest,
     { params }: { params: Promise<{ slug: string }> }
   ) {
     const rateLimitKey = `view:${getRateLimitKey(request)}`;
     const { allowed } = checkRateLimit(rateLimitKey, 10, 60_000);
     if (!allowed) {
       return createErrorResponse("Too many requests.", 429);
     }

     // ... rest of existing code ...
   }
   ```

2. Add basic slug format validation before the database query:
   ```ts
   const { slug } = await params;

   // Basic slug validation
   if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/.test(slug)) {
     return createErrorResponse("Invalid slug.", 400);
   }
   ```

**Verification:** Build succeeds.

---

## Step 8: Document In-Memory Rate Limiting Limitation

**Problem:** The rate limiter in `src/lib/utils/api.ts` uses an in-memory
`Map`. On Vercel serverless, each function invocation gets its own memory space,
so rate limiting resets per instance — it's effectively useless in production.

**Files to modify:** `src/lib/utils/api.ts`

**Instructions:**

This is NOT a code fix — it's a documentation/awareness step. The in-memory
rate limiter works fine for development and single-instance deployments. For
Vercel production:

1. Add a more prominent comment at the top of the rate limiting section:
   ```ts
   // ─── Rate Limiting ───
   // WARNING: In-memory store. Works for single-instance deployments only.
   // On Vercel serverless, each invocation has its own memory — this rate
   // limiter will NOT work across instances. For production, replace with:
   //   - Upstash Redis (@upstash/ratelimit): https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
   //   - Vercel KV: https://vercel.com/docs/storage/vercel-kv
   // This is a known limitation tracked for future implementation.
   ```

2. Do NOT implement Redis/KV now — that requires adding a new service
   dependency (Upstash account, environment variables, billing). Flag this
   as a pre-launch TODO.

**Verification:** Build succeeds.

---

## Step 9: Validate Redirect in Login Page

**Problem:** `src/app/(auth)/login/page.tsx` line 64 does
`router.push(redirectedFrom || "/dashboard")` where `redirectedFrom` comes from
`searchParams.get("redirectedFrom")`. While the middleware only sets this to
`pathname` (which is safe), an attacker could craft a URL like
`/login?redirectedFrom=https://evil.com` to redirect after login.

**Files to modify:** `src/app/(auth)/login/page.tsx`

**Instructions:**

Add the same validation used in the callback route:
```ts
// Before router.push, validate the redirect target
const safeRedirect =
  redirectedFrom &&
  redirectedFrom.startsWith("/") &&
  !redirectedFrom.startsWith("//")
    ? redirectedFrom
    : "/dashboard";

router.push(safeRedirect);
```

**Verification:** Build succeeds. Login still redirects to the correct page
after authentication.

---

## Step 10: Final Verification

**Instructions:**

1. Run all checks:
   ```bash
   npm audit            # Should show 0 vulnerabilities
   npm run type-check   # Should show 0 errors
   npm run lint         # Should show 0 errors
   npm run build        # Should succeed with no errors
   ```

2. Note any remaining warnings from the build output (like the middleware
   deprecation warning) and list them as non-blocking future TODOs.

3. Do a final `git diff` to review all changes before committing.

---

## Summary Table

| Step | Severity | Issue | Files |
|------|----------|-------|-------|
| 1 | CRITICAL | Vulnerable dependencies (5 CVEs) | `package.json` |
| 2 | CRITICAL | XSS in article HTML rendering | `sanitize.ts`, `blog/[slug]/page.tsx` |
| 3 | CRITICAL | CSP allows `unsafe-eval` | `next.config.ts` |
| 4 | HIGH | Hardcoded Supabase project ID | `next.config.ts`, `layout.tsx`, `.env.local.example` |
| 5 | HIGH | No rate limit on webhook | `webhooks/ai-article/route.ts` |
| 6 | MEDIUM | Raw error messages exposed | `ProfileForm.tsx`, `login/page.tsx`, + others |
| 7 | MEDIUM | No rate limit on view count | `articles/[slug]/view/route.ts` |
| 8 | MEDIUM | In-memory rate limiter docs | `api.ts` |
| 9 | MEDIUM | Open redirect in login | `login/page.tsx` |
| 10 | — | Final verification | All |

---

## Future Improvements (Not in This Plan)

These are tracked but intentionally deferred:

- **Nonce-based CSP:** Remove `'unsafe-inline'` from script-src/style-src using
  Next.js CSP nonce generation. Requires deeper integration work.
- **Production rate limiting:** Replace in-memory `Map` with Upstash Redis or
  Vercel KV. Requires new service account + env variables.
- **Middleware to Proxy migration:** Next.js 16.2+ deprecates middleware in favor
  of proxy. Migrate when the API stabilizes.
- **CSRF tokens on forms:** Add explicit CSRF tokens to the logout form and any
  other `method="POST"` forms that submit to route handlers.
