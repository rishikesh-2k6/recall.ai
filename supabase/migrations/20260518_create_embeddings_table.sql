-- supabase/migrations/20260518_create_embeddings_table.sql

-- Enable pgvector extension first (do this in Supabase Dashboard → Extensions)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.meeting_embeddings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_text  TEXT NOT NULL,
  embedding   vector(384),   -- HuggingFace all-MiniLM-L6-v2 dimensions
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meeting_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own embeddings"
  ON public.meeting_embeddings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Vector similarity search function (used by Vault AI Search API)
CREATE OR REPLACE FUNCTION match_meeting_embeddings(
  query_embedding vector(384),
  match_user_id   UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count     INT   DEFAULT 5
)
RETURNS TABLE (
  meeting_id  UUID,
  chunk_text  TEXT,
  similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.meeting_id,
    me.chunk_text,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM public.meeting_embeddings me
  WHERE me.user_id = match_user_id
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
