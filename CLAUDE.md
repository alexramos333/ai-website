# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-focused business website built with Next.js 16 (App Router), planned Supabase
backend, deployed on Vercel. Visual style: deep navy blue base (#001138),
glassmorphic cards, 3D animated tunnel effects, Montserrat typography, animated
CTA buttons.

**Current state:** Infrastructure layer complete. Core dependencies installed
(Next.js 16.1.6, React 19.2.3, Tailwind CSS 4, Supabase SSR, Framer Motion, Zod).
Security headers configured in `next.config.ts` and middleware. Supabase client/server/admin
wrappers in `src/lib/supabase/`. Auth middleware protects `/dashboard`, `/profile`,
`/api/protected` routes. No UI components or pages built yet.

## Commands

```bash
npm run dev        # Dev server with Turbopack (localhost:3000)
npm run build      # Production build — run after every major feature
npm run lint       # ESLint (core-web-vitals + typescript configs)
npm run start      # Serve production build
npm run type-check # TypeScript strict check (tsc --noEmit)
npm run analyze    # Bundle analysis (opens interactive report)
npm run db:types   # Generate Supabase TypeScript types
```

No test runner is configured yet.

## Architecture

- **Framework:** Next.js 16 App Router with React Compiler enabled (`next.config.ts`)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/postcss`
- **TypeScript:** Strict mode, path alias `@/*` → `./src/*`
- **Fonts:** Currently Geist (default scaffold) — switch to Montserrat (next/font/google, weights 400 + 900) per design spec
- **ESLint:** Flat config (`eslint.config.mjs`) with `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`

### Folder structure

```
src/
├── app/
│   ├── (public)/           # Public routes: home, blog, portfolio (to be built)
│   ├── (auth)/             # Auth routes: login, signup, callback (to be built)
│   ├── (protected)/        # Protected routes: dashboard, profile (to be built)
│   ├── api/                # API routes (to be built)
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # GlassCard, CTAButton, SectionHeading (to be built)
│   ├── layout/             # Header, Footer (to be built)
│   └── effects/            # SceneWrapper
├── contexts/               # TransitionContext (to be built)
├── lib/
│   ├── supabase/           # ✅ client.ts, server.ts, admin.ts
│   ├── database.types.ts   # Generated via `npm run db:types`
│   └── utils/              # api.ts, seo.ts, validation.ts, sanitize.ts (to be built)
├── styles/
│   └── globals.css
├── types/
│   └── next-bundle-analyzer.d.ts  # ✅ Type declarations
└── middleware.ts            # ✅ Auth middleware (JWT refresh + route protection)
```

### Installed tech

- **Database/Auth/API:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`) — clients configured, no DB tables yet
- **Animation:** Framer Motion — installed, not yet used in components
- **Validation:** Zod — installed, not yet used in API routes
- **Bundle analysis:** `@next/bundle-analyzer` — run with `npm run analyze`

## Coding Rules — MUST FOLLOW

- Zero `any` types. TypeScript strict mode everywhere.
- Functional components with hooks only. No class components.
- Prefer Server Components by default. Only add `'use client'` when needed.
- ES modules only (`import`/`export`). Never `require()`.
- Tailwind utilities first. Custom CSS only for complex animations.
- Always use `next/image` (never raw `<img>`), `next/font/google` (never CDN links).
- All Supabase queries via server-side API routes or Server Components.
- NEVER expose `service_role` key client-side.
- ALL Supabase tables must have RLS enabled.
- Validate ALL API route inputs with Zod.
- NEVER use ISR (`revalidate`) on authenticated or session-handling routes — use
  `export const dynamic = 'force-dynamic'` instead. ISR on auth routes causes
  session token cache poisoning (one user gets another's session).
- Always use `supabase.auth.getUser()` server-side, never `getSession()` or
  `getClaims()` alone — only `getUser()` verifies with the auth server.

## Design Tokens

| Token | Value |
|---|---|
| Page background | `#001138` |
| Glass card | `bg: transparent`, `bg-image: linear-gradient(300deg, #004BE0, transparent)`, `border: 1px solid rgba(255,255,255,0.15)`, `border-radius: 16px` |
| CTA outer | gradient `#FF9B60 → #f2295b`, `box-shadow: 5px 5px 0 0 #aa1b3f`, `drop-shadow(6px 6px 6px #000)`, `border-radius: 10px`, `animation: cta-hover 1s ease-in-out infinite alternate` |
| CTA inner | `linear-gradient(135deg, #cb5610, #232d37)`, `background-size: 400%`, `animation: ColorChange 2s ease infinite`, `border-radius: 5px`, `font-weight: 900` |
| Headline font | Montserrat 900 |
| Body font | Montserrat 400 |
| Text primary | `#ffffff` |
| Text secondary | `rgba(255,255,255,0.75)` |

## Performance Rules

- Every page MUST stay under 500KB total transfer size.
- ISR only on public content pages (blog listing, articles).

## Security Rules

- `.env*` is in `.gitignore` (exception: `.env.local.example` template) — verify before every commit.
- CSP, HSTS, X-Frame-Options headers configured in `next.config.ts` and `src/middleware.ts`.
- CORS restricted to own domain in API routes.
- Rate limiting on all public POST endpoints.
- HTTP-only cookies for auth sessions (never localStorage).
