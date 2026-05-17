"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { User, Menu, X, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useSubscription } from "@/contexts/subscription-context"
import { useState } from "react"

export function Navigation() {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { isPro } = useSubscription()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile Navigation */}
      <nav className="md:hidden border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">8x Template</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border/50 px-6 py-4 space-y-4">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="block py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    {!isPro && (
                      <Link
                        href="/upgrade"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button className="w-full">Upgrade to Pro</Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <Link
                      href="/upgrade"
                      className="block py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full">Sign In</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">8x Template</span>
            </Link>

            <div className="flex items-center gap-6">
              {!isLoading && (
                <>
                  {user ? (
                    <div className="flex items-center gap-4">
                      <Link
                        href="/profile"
                        className={`transition-colors ${
                          pathname === "/profile" ? "text-primary" : "text-foreground/80 hover:text-foreground"
                        }`}
                        title="Profile"
                      >
                        <User className="w-5 h-5" />
                      </Link>
                      {!isPro && (
                        <Link href="/upgrade">
                          <Button variant="outline" size="sm" className="text-sm bg-transparent">
                            Upgrade
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Link href="/upgrade">
                        <Button variant="ghost" size="sm" className="text-sm">
                          Pricing
                        </Button>
                      </Link>
                      <Button size="sm" className="text-sm" asChild>
                        <Link href="/auth/login">Sign In</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
