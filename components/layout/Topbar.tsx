"use client"

import { useMeetingContext } from "@/contexts/meeting-context"
import { Share2, Download } from "lucide-react"

export function Topbar() {
  const { phase } = useMeetingContext()
  const isLive = phase === "recording"

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg2)]/50 backdrop-blur-sm">
      {/* Left: Meeting title */}
      <div className="flex items-center gap-3">
        <h1
          className="text-lg font-semibold text-[var(--text)] tracking-tight"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Verbatim
        </h1>
      </div>

      {/* Right: badges + actions */}
      <div className="flex items-center gap-3">
        {/* Live badge */}
        {isLive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--red)]/10 border border-[var(--red)]/30">
            <span className="w-2 h-2 rounded-full bg-[var(--red)] animate-pulse" />
            <span className="text-xs font-medium text-[var(--red)]">LIVE</span>
          </div>
        )}

        {/* Model badges */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
            Whisper-v3
          </span>
          <span className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-[var(--green)]/10 text-[var(--green)] border border-[var(--green)]/20">
            Llama 3
          </span>
        </div>

        {/* Export button */}
        {phase === "complete" && (
          <button className="p-2 rounded-lg hover:bg-[var(--bg3)] text-[var(--text2)] hover:text-[var(--text)] transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  )
}
