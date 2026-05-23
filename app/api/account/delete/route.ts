import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/supabase/auth-helper"
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit"
// Stripe import disabled until Stripe is configured
// import { stripe } from "@/lib/stripe"
const stripe = {
  customers: {
    del: async (id: string) => {
      console.log("[Delete Account] (Stripe Mock) deleting customer:", id);
      return {};
    }
  }
} as any;

export async function POST(req: NextRequest) {
  try {
    // --- AUTH (supports both cookie sessions and Bearer tokens for mobile) ---
    const user = await getAuthenticatedUser(req)

    if (!user) {
      console.error("[Delete Account] Authentication failed")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // --- RATE LIMITING ---
    const rateLimitResult = rateLimit(user.id, RATE_LIMITS.ACCOUNT)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait.", retryAfterMs: rateLimitResult.retryAfterMs },
        { status: 429 }
      )
    }

    const userId = user.id
    console.log(`[Delete Account] Starting deletion for user: ${userId}`)

    // 2. Get user's subscription to find Stripe customer ID
    const adminClient = createAdminClient()
    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single()

    // 3. Delete Stripe customer if exists (automatically cancels all subscriptions)
    if (subscription?.stripe_customer_id) {
      try {
        console.log(`[Delete Account] Deleting Stripe customer: ${subscription.stripe_customer_id}`)
        await stripe.customers.del(subscription.stripe_customer_id)
        console.log(`[Delete Account] ✅ Stripe customer deleted`)
      } catch (stripeError) {
        // Log but don't fail - user deletion should proceed even if Stripe fails
        console.error("[Delete Account] ⚠️ Stripe deletion failed (continuing anyway):", stripeError)
      }
    } else {
      console.log("[Delete Account] No Stripe customer found, skipping")
    }

    // 4. Delete Supabase auth user (triggers CASCADE DELETE on all related tables)
    // This requires admin privileges (service role key)

    try {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

      if (deleteError) {
        console.error("[Delete Account] ❌ Supabase user deletion failed:", deleteError)
        return NextResponse.json(
          { error: "Failed to delete user account" },
          { status: 500 }
        )
      }

      console.log(`[Delete Account] ✅ User deleted successfully: ${userId}`)
    } catch (deleteError) {
      console.error("[Delete Account] ❌ Exception during user deletion:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 }
      )
    }

    // 5. Sign out the user (clear cookies — only relevant for web, mobile handles its own session)
    try {
      const supabaseSession = await createClient()
      await supabaseSession.auth.signOut()
    } catch {
      // Sign-out failure is non-critical since the user account is already deleted
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully"
    })

  } catch (error) {
    console.error("[Delete Account] ❌ Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
