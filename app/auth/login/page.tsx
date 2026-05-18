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
import { Mic } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Hard redirect so server middleware re-reads the new session cookie
      window.location.href = returnUrl || "/dashboard"
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
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

      <div className="w-full max-w-md space-y-7">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-serif)" }}>
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text2)]">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="Your password"
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
            {isLoading ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--text3)]">
          Don&apos;t have an account?{" "}
          <Link
            href={returnUrl ? `/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/signup"}
            className="text-[var(--accent)] hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
