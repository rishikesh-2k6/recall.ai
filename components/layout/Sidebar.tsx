"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Mic, Clock, Settings, Menu, X,
  Smile, Frown, HelpCircle,
  ChevronLeft, ChevronRight, Sun, Moon,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { MOCK_MEETINGS } from "@/lib/mock-data"
import { SettingsModal } from "./SettingsModal"
import { useTheme } from "@/contexts/theme-context"

const NAV_ITEMS = [
  { label: "Record",   icon: Mic,   href: "/dashboard" },
  { label: "Meetings", icon: Clock, href: "/meetings" },
]

const SENTIMENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  aligned:   { icon: Smile,       color: "var(--green)" },
  tense:     { icon: Frown,       color: "var(--red)" },
  uncertain: { icon: HelpCircle,  color: "var(--amber)" },
  neutral:   { icon: Smile,       color: "var(--text3)" },
}

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { theme, setTheme, toggle } = useTheme()

  const recentMeetings = MOCK_MEETINGS.slice(0, 5)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] lg:hidden shadow"
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5 text-[var(--text)]" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`
          hidden lg:flex flex-col flex-shrink-0
          h-screen border-r border-[var(--border)] bg-[var(--bg2)]
          overflow-hidden relative z-30
        `}
      >
        {/* Logo + Collapse button */}
        <div className={`flex items-center border-b border-[var(--border)] px-3 py-4 ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-[var(--text)] text-base tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                Verbatim
              </span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
          )}
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors ${collapsed ? "mt-3" : ""}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav items */}
        <div className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
          {!collapsed && (
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
              Menu
            </p>
          )}
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${collapsed ? "justify-center" : ""}
                  ${isActive
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border-l-2 border-[var(--accent)]"
                    : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
                  }
                `}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            )
          })}

          {/* Recent meetings */}
          {!collapsed && (
            <div className="mt-6">
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
                Recent
              </p>
              <div className="space-y-0.5">
                {recentMeetings.map(meeting => {
                  const sentiment = SENTIMENT_ICONS[meeting.insights.sentiment] || SENTIMENT_ICONS.neutral
                  const isActive = pathname === `/meetings/${meeting.id}`
                  return (
                    <Link
                      key={meeting.id}
                      href={`/meetings/${meeting.id}`}
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
          )}
        </div>

        {/* Footer: Theme toggle + Settings */}
        <div className={`px-2 py-3 border-t border-[var(--border)] space-y-1`}>
          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            {theme === "dark"
              ? <Sun className="w-4 h-4 flex-shrink-0 text-[var(--amber)]" />
              : <Moon className="w-4 h-4 flex-shrink-0 text-[var(--accent)]" />
            }
            {!collapsed && <span className="text-xs">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="text-xs">Settings</span>}
          </button>

          {/* User info */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-2 pt-2 mt-1 border-t border-[var(--border)]">
              <div className="w-7 h-7 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent)]">
                R
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text)] truncate">Rishikesh</p>
                <p className="text-[10px] text-[var(--text3)]">Free Plan</p>
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-50 w-64 h-screen flex flex-col bg-[var(--bg2)] border-r border-[var(--border)] shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[var(--text)]" style={{ fontFamily: "var(--font-serif)" }}>Verbatim</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-[var(--text3)] hover:bg-[var(--bg3)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-2 py-4 overflow-y-auto">
              {NAV_ITEMS.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${
                      isActive
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="px-2 py-3 border-t border-[var(--border)]">
              <button onClick={toggle} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text2)] hover:bg-[var(--bg3)] transition-colors">
                {theme === "dark" ? <Sun className="w-4 h-4 text-[var(--amber)]" /> : <Moon className="w-4 h-4 text-[var(--accent)]" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>
              <button onClick={() => { setSettingsOpen(true); setMobileOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--text2)] hover:bg-[var(--bg3)] transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Settings modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />
    </>
  )
}
