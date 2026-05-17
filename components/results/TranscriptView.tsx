"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { formatTimestamp, getSpeakerColor } from "@/lib/utils"
import type { TranscriptLine } from "@/lib/types"

interface TranscriptViewProps {
  lines: TranscriptLine[]
  onSeek?: (timestamp: number) => void
}

// Keyword highlight patterns
const HIGHLIGHT_PATTERNS = [/deadline/gi, /budget/gi, /decision/gi, /action/gi, /blocker/gi]

function highlightText(text: string): React.ReactNode {
  let parts: React.ReactNode[] = [text]

  HIGHLIGHT_PATTERNS.forEach((pattern) => {
    parts = parts.flatMap((part) => {
      if (typeof part !== "string") return [part]
      const split = part.split(pattern)
      const matches = part.match(pattern)
      if (!matches) return [part]

      const result: React.ReactNode[] = []
      split.forEach((segment, i) => {
        result.push(segment)
        if (matches[i]) {
          result.push(
            <mark key={`${i}-${matches[i]}`} className="bg-[var(--accent)]/20 text-[var(--accent2)] px-0.5 rounded">
              {matches[i]}
            </mark>
          )
        }
      })
      return result
    })
  })

  return <>{parts}</>
}

// Build speaker index map for color assignment
function buildSpeakerIndex(lines: TranscriptLine[]): Map<string, number> {
  const map = new Map<string, number>()
  let idx = 0
  lines.forEach(line => {
    if (!map.has(line.speaker)) {
      map.set(line.speaker, idx++)
    }
  })
  return map
}

export function TranscriptView({ lines, onSeek }: TranscriptViewProps) {
  const [search, setSearch] = useState("")
  const speakerIndex = buildSpeakerIndex(lines)

  const filtered = search
    ? lines.filter(l => l.text.toLowerCase().includes(search.toLowerCase()))
    : lines

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
        <Search className="w-4 h-4 text-[var(--text3)]" />
        <input
          type="text"
          placeholder="Search transcript..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
        />
      </div>

      {/* Transcript lines */}
      <div className="max-h-[320px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
        {filtered.map((line, i) => {
          const color = getSpeakerColor(speakerIndex.get(line.speaker) ?? 0)
          return (
            <button
              key={i}
              onClick={() => onSeek?.(line.timestamp)}
              className="w-full text-left flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--bg3)] transition-colors group"
            >
              {/* Speaker name */}
              <span className="text-xs font-semibold min-w-[80px] truncate" style={{ color }}>
                {line.speaker}
              </span>
              {/* Timestamp */}
              <span className="text-[10px] font-mono text-[var(--text3)] min-w-[36px] pt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                {formatTimestamp(line.timestamp)}
              </span>
              {/* Text */}
              <span className="text-sm text-[var(--text2)] flex-1 group-hover:text-[var(--text)] transition-colors">
                {highlightText(line.text)}
              </span>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text3)] text-center py-8">No matching lines found.</p>
        )}
      </div>
    </div>
  )
}
