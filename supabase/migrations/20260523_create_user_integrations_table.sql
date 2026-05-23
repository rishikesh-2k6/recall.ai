-- ============================================================================
-- FIX 7: Server-Side OAuth Token Storage (HIGH)
-- ============================================================================
-- Instead of passing raw OAuth tokens in API request bodies (exposable via
-- proxies, logs, and mobile memory dumps), store them encrypted on the server.
-- Only accessible via service_role — never exposed to client-side RLS.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL CHECK (provider IN ('google', 'notion', 'slack')),
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  token_type    TEXT DEFAULT 'Bearer',
  scope         TEXT,
  expires_at    TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Only service_role can access tokens. Never expose to client.
CREATE POLICY "Service role only on integrations"
  ON public.user_integrations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can only check if they HAVE a linked integration (not read the token)
CREATE POLICY "Users can view own integration existence"
  ON public.user_integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_user_integrations_user_provider
  ON public.user_integrations(user_id, provider);

-- Auto-update updated_at column
CREATE TRIGGER update_user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
