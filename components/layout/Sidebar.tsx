"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Mic, Clock, Search, BarChart3, Plug, Settings, Menu, X } from "lucide-react"

const NAV_ITEMS = [
  { label: "Record",       icon: Mic,       href: "/dashboard" },
  { label: "Meetings",     icon: Clock,     href: "/meetings" },
  { label: "Search",       icon: Search,    href: "/dashboard?search=true" },
  { label: "Analytics",    icon: BarChart3,  href: "/dashboard?analytics=true" },
  { label: "Integrations", icon: Plug,      href: "/dashboard?integrations=true" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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
          <span className="font-serif text-xl text-[var(--text)] tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
            Verbatim
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
            Menu
          </p>
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard")
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

          {/* Recent meetings section placeholder */}
          <div className="mt-6">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
              Recent
            </p>
            <div className="space-y-1 px-3">
              {["Team Standup", "Sprint Review", "1:1 with Alex"].map((name, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 text-sm text-[var(--text2)] hover:text-[var(--text)] cursor-pointer transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-50" />
                  <span className="truncate">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs font-semibold text-[var(--accent)]">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text)] truncate">User</p>
              <p className="text-xs text-[var(--text3)]">Free Plan</p>
            </div>
            <Settings className="w-4 h-4 text-[var(--text3)]" />
          </div>
        </div>
      </nav>
    </>
  )
}
