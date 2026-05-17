"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mic, Clock, Search, BarChart3, Settings, Menu, X, Smile, Frown, HelpCircle } from "lucide-react"
import { MOCK_MEETINGS } from "@/lib/mock-data"

const NAV_ITEMS = [
  { label: "Record",   icon: Mic,       href: "/dashboard" },
  { label: "Meetings", icon: Clock,     href: "/meetings" },
]

const SENTIMENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  aligned:   { icon: Smile, color: 'var(--green)' },
  tense:     { icon: Frown, color: 'var(--red)' },
  uncertain: { icon: HelpCircle, color: 'var(--amber)' },
  neutral:   { icon: Smile, color: 'var(--text3)' },
}

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const recentMeetings = MOCK_MEETINGS.slice(0, 5)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] lg:hidden"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <X className="w-5 h-5 text-[var(--text)]" /> : <Menu className="w-5 h-5 text-[var(--text)]" />}
      </button>

      <nav
        className={`
          fixed lg:relative z-40
          w-[240px] h-screen flex flex-col
          border-r border-[var(--border)] bg-[var(--bg2)]
          transition-transform duration-300
          ${collapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <Link href="/" className="font-serif text-xl text-[var(--text)] tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Verbatim
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
            Menu
          </p>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setCollapsed(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]"
                    : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {/* Recent meetings */}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
              Recent
            </p>
            <div className="space-y-0.5 px-1">
              {recentMeetings.map((meeting) => {
                const sentiment = SENTIMENT_ICONS[meeting.insights.sentiment] || SENTIMENT_ICONS.neutral
                const isActive = pathname === `/meetings/${meeting.id}`
                return (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    onClick={() => setCollapsed(false)}
                    className={`flex items-center gap-2 py-2 px-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
                    }`}
                  >
                    <sentiment.icon className="w-3 h-3 flex-shrink-0" style={{ color: sentiment.color }} />
                    <span className="truncate text-xs">{meeting.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
              R
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text)] truncate">Rishikesh</p>
              <p className="text-xs text-[var(--text3)]">Free Plan</p>
            </div>
            <Settings className="w-4 h-4 text-[var(--text3)]" />
          </div>
        </div>
      </nav>
    </>
  )
}
