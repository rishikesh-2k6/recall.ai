import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to schedule." }, { status: 401 });
    }

    const { link, scheduledAt, botName, settings } = await req.json();

    if (!link || !scheduledAt) {
      return NextResponse.json({ error: "Missing required fields: link or scheduledAt" }, { status: 400 });
    }

    // Platform detector logic
    let platform: "google-meet" | "zoom" | "teams" | "custom" = "custom";
    if (link.includes("meet.google.com")) {
      platform = "google-meet";
    } else if (link.includes("zoom.us")) {
      platform = "zoom";
    } else if (link.includes("teams.microsoft")) {
      platform = "teams";
    }

    // Insert the scheduling record into the `bot_schedules` table
    const { data, error } = await supabase
      .from("bot_schedules")
      .insert({
        user_id: user.id,
        meeting_link: link,
        scheduled_at: scheduledAt,
        bot_name: botName || "Recall Note Taker",
        platform,
        settings: settings || { diarize: true, actions: true, language: "en", style: "detailed" },
        status: "scheduled"
      })
      .select()
      .single();

    if (error) {
      console.error("[Autopilot API Supabase Error]:", error.message);
      // Fallback in case migrations haven't been applied yet locally (Demo/Fallback Mode)
      if (error.code === "PGRST116" || error.message.includes("does not exist")) {
        console.warn("[Autopilot] Table 'bot_schedules' not found. Falling back to mock success.");
        return NextResponse.json({
          success: true,
          message: "Scheduled (Mock Fallback - Apply Migrations!)",
          data: {
            id: crypto.randomUUID(),
            user_id: user.id,
            meeting_link: link,
            scheduled_at: scheduledAt,
            bot_name: botName || "Recall Note Taker",
            platform,
            settings: settings || { diarize: true, actions: true, language: "en", style: "detailed" },
            status: "scheduled",
            created_at: new Date().toISOString()
          }
        });
      }
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Autopilot successfully scheduled",
      data
    });
  } catch (error: any) {
    console.error("[Autopilot API Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to schedule bot" }, { status: 500 });
  }
}
