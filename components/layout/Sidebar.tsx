"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Mic, Clock, Settings, Menu, X,
  Smile, Frown, HelpCircle,
  PanelLeftClose, PanelLeftOpen,
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
  aligned:   { icon: Smile,      color: "var(--green)" },
  tense:     { icon: Frown,      color: "var(--red)" },
  uncertain: { icon: HelpCircle, color: "var(--amber)" },
  neutral:   { icon: Smile,      color: "var(--text3)" },
}

export function Sidebar() {
  const pathname  = usePathname()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [collapsed,    setCollapsed]    = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const recentMeetings = MOCK_MEETINGS.slice(0, 5)

  // ─── shared nav link ─────────────────────────────────────────────
  function NavLink({ item }: { item: typeof NAV_ITEMS[0] }) {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        title={item.label}
        className={`
          flex items-center gap-3 rounded-lg text-sm transition-all duration-150
          ${collapsed ? "justify-center px-0 py-2.5 w-10 mx-auto" : "px-3 py-2.5"}
          ${isActive
            ? "bg-[var(--accent)]/12 text-[var(--accent)] font-medium"
            : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"}
        `}
      >
        <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  // ─── icon-only footer button ──────────────────────────────────────
  function FooterBtn({
    icon: Icon, label, onClick, danger,
  }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
    return (
      <button
        onClick={onClick}
        title={label}
        className={`
          flex items-center gap-3 rounded-lg text-sm transition-all duration-150 w-full
          ${collapsed ? "justify-center px-0 py-2.5 w-10 mx-auto" : "px-3 py-2.5"}
          ${danger
            ? "text-[var(--red)] hover:bg-[var(--red)]/8"
            : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"}
        `}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span>{label}</span>}
      </button>
    )
  }

  return (
    <>
      {/* ── Mobile hamburger ─────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] lg:hidden shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-[var(--text)]" />
      </button>

      {/* ── Mobile backdrop ──────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <motion.nav
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="hidden lg:flex flex-col flex-shrink-0 h-screen border-r border-[var(--border)] bg-[var(--bg2)] overflow-hidden relative z-30"
      >
        {/* Header: logo + collapse */}
        <div className={`flex items-center border-b border-[var(--border)] h-14 px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[var(--text)] text-sm tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
                  Verbatim
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center"
              >
                <Mic className="w-3.5 h-3.5 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed (at top of nav area) */}
        {collapsed && (
          <div className="flex justify-center pt-3 pb-1">
            <button
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-lg text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg3)] transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Nav items */}
        <div className={`flex-1 overflow-y-auto py-3 ${collapsed ? "px-0 flex flex-col items-center gap-1" : "px-3 space-y-0.5"}`}>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
              Menu
            </p>
          )}

          {NAV_ITEMS.map(item => <NavLink key={item.label} item={item} />)}

          {/* Recent meetings — only in expanded mode */}
          {!collapsed && (
            <div className="mt-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
                Recent
              </p>
              {recentMeetings.map(meeting => {
                const s = SENTIMENT_ICONS[meeting.insights.sentiment] || SENTIMENT_ICONS.neutral
                const isActive = pathname === `/meetings/${meeting.id}`
                return (
                  <Link
                    key={meeting.id}
                    href={`/meetings/${meeting.id}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? "bg-[var(--accent)]/12 text-[var(--accent)]"
                        : "text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--bg3)]"
                    }`}
                  >
                    <s.icon className="w-3 h-3 flex-shrink-0" style={{ color: s.color }} />
                    <span className="truncate">{meeting.name}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: Settings only (theme is inside Settings > General) */}
        <div className={`border-t border-[var(--border)] py-2 ${collapsed ? "px-0 flex flex-col items-center gap-1" : "px-3 space-y-0.5"}`}>
          <FooterBtn icon={Settings} label="Settings" onClick={() => setSettingsOpen(true)} />

          {/* User pill — expanded only */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg bg-[var(--bg3)]/50">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)]/25 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] flex-shrink-0">
                R
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text)] truncate leading-tight">Rishikesh</p>
                <p className="text-[10px] text-[var(--text3)] leading-tight">Free Plan</p>
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* ── Mobile Drawer ────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav"
            initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-50 w-60 h-screen flex flex-col bg-[var(--bg2)] border-r border-[var(--border)] shadow-2xl lg:hidden"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
                  <Mic className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-[var(--text)] text-sm" style={{ fontFamily: "var(--font-serif)" }}>Verbatim</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-[var(--text3)] hover:bg-[var(--bg3)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map(item => <NavLink key={item.label} item={item} />)}
            </div>

            <div className="px-3 py-2 border-t border-[var(--border)] space-y-0.5">
              <FooterBtn icon={Settings} label="Settings" onClick={() => { setSettingsOpen(true); setMobileOpen(false) }} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Settings Modal ───────────────────────────── */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />
    </>
  )
}
