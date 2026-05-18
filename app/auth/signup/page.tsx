"use client"

import type React from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Mic, Mail, CheckCircle2, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setReturnUrl(params.get("returnUrl"))
    }
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.push(returnUrl || "/dashboard")
    }
  }, [user, authLoading, returnUrl, router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (error) throw error

      // If the user is immediately logged in (email confirmation disabled),
      // redirect them directly to the dashboard.
      if (data.session) {
        router.push(returnUrl || "/dashboard")
      } else {
        // Email confirmation is required — show the success screen.
        setEmailSent(true)
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/30 group-hover:shadow-[var(--accent)]/50 transition-shadow">
          <Mic className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-serif)" }}>
          Verbatim
        </span>
      </Link>

      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {emailSent ? (
            /* ── Email sent success screen ───────────── */
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-[var(--green)]/10 border border-[var(--green)]/20 flex items-center justify-center">
                  <Mail className="w-9 h-9 text-[var(--green)]" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: "var(--font-serif)" }}>
                  Check your inbox
                </h1>
                <p className="text-sm text-[var(--text2)] leading-relaxed">
                  We&apos;ve sent a confirmation link to{" "}
                  <span className="font-semibold text-[var(--text)]">{email}</span>.
                  Click it to activate your account and start recording.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 text-left space-y-2">
                {["Check your spam folder if you don't see the email.", "The link expires after 24 hours.", "Once confirmed, you'll be taken to your dashboard."].map((tip) => (
                  <div key={tip} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[var(--text2)]">{tip}</p>
                  </div>
                ))}
              </div>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
              >
                Back to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ) : (
            /* ── Signup form ─────────────────────────── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-7"
            >
              <div className="text-center">
                <h1 className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-serif)" }}>
                  Create your account
                </h1>
                <p className="mt-1.5 text-sm text-[var(--text2)]">Start capturing meetings in seconds</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-[var(--text2)] text-xs font-medium uppercase tracking-wide">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[var(--bg2)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--accent)]/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[var(--text2)] text-xs font-medium uppercase tracking-wide">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="bg-[var(--bg2)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--accent)]/60"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="repeat-password" className="text-[var(--text2)] text-xs font-medium uppercase tracking-wide">Confirm Password</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="bg-[var(--bg2)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text3)] focus:border-[var(--accent)]/60"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-lg bg-[var(--red)]/10 border border-[var(--red)]/20 px-3 py-2.5 text-sm text-[var(--red)]"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-semibold shadow-lg shadow-[var(--accent)]/20 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account…" : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-sm text-[var(--text3)]">
                Already have an account?{" "}
                <Link
                  href={returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login"}
                  className="text-[var(--accent)] hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
