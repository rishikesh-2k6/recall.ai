import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
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
    stats: data.stats || {
      duration: data.duration,
      speakerCount: data.speakers?.length || 1,
      wordCount: 0,
      actionItemCount: data.action_items?.length || 0,
    },
    speakers: data.speakers,
    transcript: data.transcript,
    actionItems: data.action_items,
    insights: data.insights,
    audioUrl: data.audio_url,
    created_at: data.created_at,
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch the existing meeting first
  const { data: existing, error: fetchError } = await supabase
    .from("meetings")
    .select("insights, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    const { name, insights } = body

    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name
    }
    if (insights !== undefined) {
      updateData.insights = {
        ...(existing.insights || {}),
        ...insights,
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("meetings")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      tldr: data.tldr,
      keyQuote: data.key_quote,
      stats: data.stats || {
        duration: data.duration,
        speakerCount: data.speakers?.length || 1,
        wordCount: 0,
        actionItemCount: data.action_items?.length || 0,
      },
      speakers: data.speakers,
      transcript: data.transcript,
      actionItems: data.action_items,
      insights: data.insights,
      audioUrl: data.audio_url,
      created_at: data.created_at,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}


