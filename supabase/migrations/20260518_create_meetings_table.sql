-- supabase/migrations/20260518_create_meetings_table.sql

CREATE TABLE IF NOT EXISTS public.meetings (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Untitled Meeting',
  duration     INTEGER NOT NULL DEFAULT 0,          -- seconds
  transcript   JSONB NOT NULL DEFAULT '[]',         -- TranscriptLine[]
  tldr         TEXT,
  key_quote    TEXT,
  action_items JSONB NOT NULL DEFAULT '[]',         -- ActionItem[]
  speakers     JSONB NOT NULL DEFAULT '[]',         -- Speaker[]
  insights     JSONB,                               -- Insights object
  audio_url    TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security: users can only see their own meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meetings"
  ON public.meetings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (admin) can do everything (for the API routes)
CREATE POLICY "Service role full access"
  ON public.meetings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_created_at ON public.meetings(created_at DESC);
