-- supabase/migrations/20260521_optimize_rag_search.sql

-- Upgraded vector similarity search function that joins the meetings table
-- and applies optional filters for date range, category, and single meeting ID.
CREATE OR REPLACE FUNCTION match_meeting_embeddings_v2(
  query_embedding      vector(384),
  match_user_id        UUID,
  match_threshold      FLOAT DEFAULT 0.6,
  match_count          INT   DEFAULT 10,
  filter_meeting_id    UUID  DEFAULT NULL,
  filter_meeting_type  TEXT  DEFAULT NULL,
  filter_start_date    TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  filter_end_date      TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  meeting_id           UUID,
  meeting_name         TEXT,
  meeting_created_at   TIMESTAMP WITH TIME ZONE,
  meeting_type         TEXT,
  chunk_text           TEXT,
  similarity           FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    me.meeting_id,
    m.name AS meeting_name,
    m.created_at AS meeting_created_at,
    COALESCE(m.insights->>'meetingType', 'General Discussion') AS meeting_type,
    me.chunk_text,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM public.meeting_embeddings me
  JOIN public.meetings m ON me.meeting_id = m.id
  WHERE me.user_id = match_user_id
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
    AND (filter_meeting_id IS NULL OR me.meeting_id = filter_meeting_id)
    AND (filter_meeting_type IS NULL OR m.insights->>'meetingType' = filter_meeting_type)
    AND (filter_start_date IS NULL OR m.created_at >= filter_start_date)
    AND (filter_end_date IS NULL OR m.created_at <= filter_end_date)
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
