import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { google } from "googleapis"

export async function POST(req: NextRequest) {
  try {
    // --- AUTH (supports both cookie sessions and Bearer tokens for mobile) ---
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 })
    }

    // --- RATE LIMITING (Fix #8) ---
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.EXPORT)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before exporting again.", retryAfterMs: rateLimitResult.retryAfterMs },
        { status: 429 }
      )
    }

    const { meetingId, googleToken } = await req.json()

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId parameter" }, { status: 400 })
    }

    // Fetch the meeting details from Supabase
    const admin = createAdminClient()
    const { data: meeting, error: dbError } = await admin
      .from("meetings")
      .select("*")
      .eq("id", meetingId)
      .eq("user_id", user.id)
      .single()

    if (dbError || !meeting) {
      return NextResponse.json({ error: "Meeting not found or access denied." }, { status: 404 })
    }

    // --- OAUTH TOKEN STRATEGY (Fix #7) ---
    // Priority 1: Fetch stored server-side token from user_integrations table
    // Priority 2: Fall back to client-provided token (legacy web flow, will be deprecated)
    // Priority 3: Return demo/mock response for development
    let accessToken: string | null = null

    // Try server-side stored token first (secure, recommended for mobile)
    const { data: integration } = await admin
      .from("user_integrations")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .single()

    if (integration?.access_token) {
      // Check if token is expired
      if (integration.expires_at && new Date(integration.expires_at) < new Date()) {
        // Token expired — if we have a refresh token, the client should re-authenticate
        // For now, fall through to client-provided token or demo mode
        console.warn("[Google Docs Export] Stored token expired. Falling back.")
      } else {
        accessToken = integration.access_token
      }
    }

    // Fall back to client-provided token (legacy flow — log a deprecation warning)
    if (!accessToken && googleToken) {
      console.warn(
        "[Google Docs Export] WARNING: Using client-provided OAuth token. " +
        "This is insecure and will be deprecated. Migrate to server-side token storage."
      )
      accessToken = googleToken
    }

    // No token available — return demo mode response
    if (!accessToken) {
      console.warn("[Google Docs Export] No Google token available. Returning demo mode response.")
      return NextResponse.json({ 
        url: `https://docs.google.com/document/d/mock-document-${meetingId}/edit`,
        message: "Google Docs created in Demo mode (To export to real Drive, link your Google account in Settings)."
      })
    }

    // Initialize Google API client with the resolved token
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    const docs = google.docs({ version: "v1", auth: oauth2Client })

    // 1. Create a blank Google Document
    const newDoc = await docs.documents.create({
      requestBody: { title: `${meeting.name} — AI Meeting Notes` },
    })
    const documentId = newDoc.data.documentId

    if (!documentId) {
      throw new Error("Failed to retrieve document ID from Google Docs API.")
    }

    // 2. Build beautiful document contents
    const summaryText = meeting.tldr || "No summary generated."
    const keyQuote = meeting.key_quote ? `"${meeting.key_quote}"\n\n` : ""
    
    const actionsText = (meeting.action_items || [])
      .map((item: any) => `[${item.priority.toUpperCase()}] ${item.text}${item.assignee ? ` (Assignee: ${item.assignee})` : ""}`)
      .join("\n") || "None identified."

    const insightsText = meeting.insights 
      ? `Sentiment: ${meeting.insights.sentiment || "Neutral"}\n` +
        `Risks Identified: ${(meeting.insights.risks || []).join(", ") || "None"}\n` +
        `Decisions Recorded: ${(meeting.insights.decisions || []).join(", ") || "None"}\n`
      : "No insights recorded."

    const headerText = `${meeting.name}\n`
    const metadataText = `Date: ${new Date(meeting.created_at).toLocaleDateString()}\n` +
                         `Duration: ${Math.floor(meeting.duration / 60)} minutes\n\n`

    const bodyText = `${headerText}${metadataText}` +
                     `─── EXECUTIVE SUMMARY ───\n${summaryText}\n\n` +
                     (keyQuote ? `─── KEY QUOTE ───\n${keyQuote}` : "") +
                     `─── ACTION ITEMS ───\n${actionsText}\n\n` +
                     `─── MEETING INSIGHTS ───\n${insightsText}\n`

    // Batch update requests to format the titles and text structures nicely
    const requests = [
      {
        insertText: {
          endOfSegmentLocation: {},
          text: bodyText,
        },
      },
      // Format the title paragraph style
      {
        updateParagraphStyle: {
          range: { startIndex: 1, endIndex: headerText.length },
          paragraphStyle: { namedStyleType: "TITLE" },
          fields: "namedStyleType",
        },
      },
    ]

    await docs.documents.batchUpdate({
      documentId,
      requestBody: { requests },
    })

    return NextResponse.json({ 
      url: `https://docs.google.com/document/d/${documentId}/edit`,
      success: true 
    })
  } catch (error: any) {
    console.error("[Google Docs Export Error]:", error)
    return NextResponse.json({ error: error.message || "Failed to create Google Doc" }, { status: 500 })
  }
}
