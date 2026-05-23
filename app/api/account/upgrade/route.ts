import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  try {
    // --- AUTH (supports both cookie sessions and Bearer tokens for mobile) ---
    const user = await getAuthenticatedUser(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // --- RATE LIMITING ---
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.ACCOUNT)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait.", retryAfterMs: rateLimitResult.retryAfterMs },
        { status: 429 }
      )
    }

    // In a real application, you would verify payment/Stripe details here.
    // For this template app, we perform the update securely on the server-side
    // bypassing the restricted client-side RLS policies.
    const adminSupabase = createAdminClient()
    
    // Check if subscription exists first
    const { data: existingSub } = await adminSupabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single()

    let error
    if (existingSub) {
      const { error: updateError } = await adminSupabase
        .from("subscriptions")
        .update({ tier: "pro" })
        .eq("user_id", user.id)
      error = updateError
    } else {
      const { error: insertError } = await adminSupabase
        .from("subscriptions")
        .insert({ user_id: user.id, tier: "pro" })
      error = insertError
    }

    if (error) {
      console.error("[Subscription Upgrade API] Error:", error.message)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true, tier: "pro" })
  } catch (error: any) {
    console.error("[Subscription Upgrade API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
