# ai-website

AI-focused business website with glassmorphic design, 3D animated effects, and a full content management backend.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Styling:** Tailwind CSS 4
- **Database & Auth:** Supabase (PostgreSQL + Row Level Security + Auth)
- **Animation:** Framer Motion (lazy-loaded)
- **Validation:** Zod
- **Language:** TypeScript (strict mode)
- **Deployment:** Vercel

## Setup

### 1. Clone and install

```bash
git clone https://github.com/muchohombre/ai-website.git
cd ai-website
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in the values in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `AI_WEBHOOK_SECRET` | Bearer token for the AI article webhook |
| `NEXT_PUBLIC_SITE_URL` | Your production domain (e.g. `https://yourdomain.com`) |

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel Dashboard](https://vercel.com/new)
3. Vercel auto-detects Next.js — no build settings changes needed
4. Add all environment variables from `.env.local.example` in **Settings > Environment Variables**
5. Deploy

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack (localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (core-web-vitals + TypeScript) |
| `npm run type-check` | TypeScript strict check (`tsc --noEmit`) |
| `npm run analyze` | Bundle analysis (interactive report) |
| `npm run db:types` | Generate Supabase TypeScript types |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/articles` | List published articles | Public |
| `POST` | `/api/articles` | Create a new article | Admin (service role) |
| `POST` | `/api/articles/publish` | Publish or unpublish an article | Admin (service role) |
| `POST` | `/api/contact` | Submit contact form | Public (rate-limited) |
| `POST` | `/api/webhooks/ai-article` | AI-generated article webhook | Bearer token |
| `GET` | `/api/health` | Health check | Public |

### Example: AI Article Webhook

```bash
curl -X POST https://yourdomain.com/api/webhooks/ai-article \
  -H "Authorization: Bearer YOUR_AI_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How AI Is Transforming Business",
    "slug": "how-ai-is-transforming-business",
    "excerpt": "A look at the latest AI trends.",
    "content": "Full markdown article content here...",
    "category": "AI Trends"
  }'
```

## Project Structure

```
src/
├── app/
│   ├── (public)/        # Home, blog, portfolio pages
│   ├── (auth)/          # Login, signup, callback
│   ├── (protected)/     # Dashboard, profile
│   └── api/             # API routes
├── components/
│   ├── ui/              # GlassCard, CTAButton, SectionHeading
│   ├── layout/          # Header, Footer
│   └── effects/         # SceneWrapper
├── contexts/            # TransitionContext
├── lib/
│   ├── supabase/        # Client, server, admin Supabase wrappers
│   └── utils/           # API helpers, SEO, validation, sanitization
├── styles/              # Global CSS
└── middleware.ts        # Auth middleware (JWT refresh + route protection)
```
