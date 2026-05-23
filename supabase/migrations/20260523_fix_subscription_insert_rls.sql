-- ============================================================================
-- FIX 1: Subscription Insert RLS Bypass (CRITICAL)
-- ============================================================================
-- The original INSERT policy allowed any authenticated user to insert any tier,
-- including 'pro'. This migration locks client inserts to 'free' only.
-- Server-side upgrade route uses service_role which bypasses RLS entirely.
-- ============================================================================

-- Drop the insecure insert policy
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;

-- Recreate with tier locked to 'free' on client inserts
CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND tier = 'free');

-- Additionally, create a database trigger to auto-create a free subscription
-- when a new user signs up. This eliminates the need for client-side inserts entirely.
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();
