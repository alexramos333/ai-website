-- Track AI article generation jobs for duplicate prevention and debugging
CREATE TABLE IF NOT EXISTS public.article_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  error_message TEXT,
  model_used TEXT,
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Indexes for duplicate detection and status queries
CREATE INDEX idx_article_generations_keyword ON public.article_generations(keyword);
CREATE INDEX idx_article_generations_status ON public.article_generations(status);

-- RLS: service role bypasses; authenticated admins can read
ALTER TABLE public.article_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view article_generations"
  ON public.article_generations
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage article_generations"
  ON public.article_generations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Auto-update updated_at (reuse existing trigger function)
CREATE TRIGGER handle_article_generations_updated_at
  BEFORE UPDATE ON public.article_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
