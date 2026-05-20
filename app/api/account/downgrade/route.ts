import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
        .update({ tier: "free" })
        .eq("user_id", user.id)
      error = updateError
    } else {
      const { error: insertError } = await adminSupabase
        .from("subscriptions")
        .insert({ user_id: user.id, tier: "free" })
      error = insertError
    }

    if (error) {
      console.error("[Subscription Downgrade API] Error:", error.message)
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
    }

    return NextResponse.json({ success: true, tier: "free" })
  } catch (error: any) {
    console.error("[Subscription Downgrade API] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
