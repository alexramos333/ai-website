-- ============================================================
-- 001_initial_schema.sql
-- Complete database schema for AI Website
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- 1. HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Check if the current authenticated user has admin role
-- Used by RLS policies. SECURITY DEFINER so it can read profiles
-- regardless of the caller's RLS context.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$;

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ----- profiles -----
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT NOT NULL DEFAULT '',
  website     TEXT NOT NULL DEFAULT '',
  bio         TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ----- articles -----
CREATE TABLE articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  content          TEXT NOT NULL DEFAULT '',
  excerpt          TEXT NOT NULL DEFAULT '',
  meta_title       TEXT NOT NULL DEFAULT '',
  meta_description TEXT NOT NULL DEFAULT '',
  og_image         TEXT NOT NULL DEFAULT '',
  published        BOOLEAN NOT NULL DEFAULT FALSE,
  published_at     TIMESTAMPTZ,
  author_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tags             TEXT[] NOT NULL DEFAULT '{}',
  view_count       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ----- contact_submissions -----
CREATE TABLE contact_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT '',
  read       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- ----- portfolio_items -----
CREATE TABLE portfolio_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  video_url     TEXT NOT NULL DEFAULT '',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT '',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  published     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_articles_slug ON articles (slug);
CREATE INDEX idx_articles_published ON articles (published, published_at DESC);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- ----- profiles policies -----
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----- articles policies -----
CREATE POLICY "Published articles are viewable by everyone"
  ON articles FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Admins can view all articles"
  ON articles FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert articles"
  ON articles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update articles"
  ON articles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  USING (is_admin());

-- ----- contact_submissions policies -----
CREATE POLICY "Anyone can submit a contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view contact submissions"
  ON contact_submissions FOR SELECT
  USING (is_admin());

-- ----- portfolio_items policies -----
CREATE POLICY "Published portfolio items are viewable by everyone"
  ON portfolio_items FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Admins can view all portfolio items"
  ON portfolio_items FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert portfolio items"
  ON portfolio_items FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update portfolio items"
  ON portfolio_items FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete portfolio items"
  ON portfolio_items FOR DELETE
  USING (is_admin());
