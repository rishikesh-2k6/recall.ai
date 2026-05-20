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
