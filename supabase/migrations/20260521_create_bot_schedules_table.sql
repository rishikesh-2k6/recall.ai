-- supabase/migrations/20260521_create_bot_schedules_table.sql

CREATE TABLE IF NOT EXISTS public.bot_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_link   TEXT NOT NULL,
  scheduled_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  bot_name       TEXT NOT NULL DEFAULT 'Recall Note Taker',
  platform       TEXT NOT NULL DEFAULT 'custom' CHECK (platform IN ('google-meet', 'zoom', 'teams', 'custom')),
  settings       JSONB NOT NULL DEFAULT '{"diarize": true, "actions": true, "language": "en", "style": "detailed"}',
  status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'joining', 'recording', 'processing', 'completed', 'failed')),
  error_message  TEXT,
  meeting_id     UUID REFERENCES public.meetings(id) ON DELETE SET NULL, -- points to the resulting meeting once finished
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security: users can only see and manage their own bot schedules
ALTER TABLE public.bot_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bot schedules"
  ON public.bot_schedules FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (admin) can do everything (for API worker routes)
CREATE POLICY "Service role full access on bot schedules"
  ON public.bot_schedules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_bot_schedules_user_id ON public.bot_schedules(user_id);
CREATE INDEX idx_bot_schedules_scheduled_at ON public.bot_schedules(scheduled_at);
CREATE INDEX idx_bot_schedules_status ON public.bot_schedules(status);

-- Updated at trigger
CREATE TRIGGER update_bot_schedules_updated_at
  BEFORE UPDATE ON public.bot_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
