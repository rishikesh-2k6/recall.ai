import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Client } from "@notionhq/client"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { meetingId } = await req.json()

  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  // Fetch the meeting
  const { data: meeting } = await supabase
    .from("meetings").select("*").eq("id", meetingId).single()

  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
  }

  // Create a Notion page
  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID! },
    properties: {
      Name: { title: [{ text: { content: meeting.name } }] },
      Date: { date: { start: meeting.created_at } },
    },
    children: [
      { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "Summary" } }] } },
      { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: meeting.tldr || "" } }] } },
      { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: "Action Items" } }] } },
      ...(meeting.action_items || []).map((item: any) => ({
        object: "block" as const,
        type: "to_do" as const,
        to_do: { rich_text: [{ text: { content: item.text } }], checked: item.done },
      })),
    ],
  })

  return NextResponse.json({ url: (page as any).url })
}
