import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // Shape to match MeetingResult
  return NextResponse.json({
    id: data.id,
    name: data.name,
    tldr: data.tldr,
    keyQuote: data.key_quote,
    stats: data.stats || { duration: data.duration, speakerCount: data.speakers?.length || 1, wordCount: 0, actionItemCount: data.action_items?.length || 0 },
    speakers: data.speakers,
    transcript: data.transcript,
    actionItems: data.action_items,
    insights: data.insights,
    audioUrl: data.audio_url,
    created_at: data.created_at,
  })
}
