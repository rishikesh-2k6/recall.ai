"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, Users, FileText, ChevronRight, Search, Filter, Smile, Frown, HelpCircle } from "lucide-react"
import { formatMinSec, formatDuration } from "@/lib/utils"
import { MOCK_MEETINGS } from "@/lib/mock-data"

const SENTIMENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  aligned:   { icon: Smile, color: 'var(--green)' },
  tense:     { icon: Frown, color: 'var(--red)' },
  uncertain: { icon: HelpCircle, color: 'var(--amber)' },
  neutral:   { icon: Smile, color: 'var(--text3)' },
}

export default function MeetingsPage() {
  const [search, setSearch] = useState("")
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null)

  const meetings = MOCK_MEETINGS
    .filter(m => {
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterSentiment && m.insights.sentiment !== filterSentiment) return false
      return true
    })

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-[var(--text)] mb-1"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Meeting History
        </h1>
        <p className="text-sm text-[var(--text3)]">
          {meetings.length} meetings recorded
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text3)]" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
          />
        </div>

        {/* Sentiment filter pills */}
        <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <button
            onClick={() => setFilterSentiment(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              !filterSentiment ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text3)]"
            }`}
          >
            All
          </button>
          {["aligned", "tense", "uncertain"].map(s => (
            <button
              key={s}
              onClick={() => setFilterSentiment(filterSentiment === s ? null : s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                filterSentiment === s ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text3)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Meeting list */}
      <div className="space-y-3">
        {meetings.map((meeting, i) => {
          const sentiment = SENTIMENT_ICONS[meeting.insights.sentiment] || SENTIMENT_ICONS.neutral
          const date = new Date(meeting.created_at)

          return (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/meetings/${meeting.id}`}
                className="block p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/20 hover:bg-[var(--card2)] transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {meeting.name}
                      </h3>
                      <sentiment.icon className="w-4 h-4 flex-shrink-0" style={{ color: sentiment.color }} />
                    </div>

                    <p className="text-xs text-[var(--text3)] line-clamp-2 mb-3">
                      {meeting.tldr}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text3)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatMinSec(meeting.stats.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {meeting.stats.speakerCount} speakers
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {meeting.stats.wordCount.toLocaleString()} words
                      </span>
                    </div>
                  </div>

                  {/* Right: date + arrow */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-[10px] text-[var(--text3)] font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--text3)] group-hover:text-[var(--accent)] transition-colors" />
                  </div>
                </div>

                {/* Action items preview */}
                {meeting.actionItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {meeting.actionItems.slice(0, 3).map(item => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg3)] text-[10px] text-[var(--text2)]"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.done ? 'bg-[var(--green)]' : 'bg-[var(--amber)]'}`} />
                          <span className="truncate max-w-[120px]">{item.text}</span>
                        </span>
                      ))}
                      {meeting.actionItems.length > 3 && (
                        <span className="text-[10px] text-[var(--text3)]">
                          +{meeting.actionItems.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </motion.div>
          )
        })}

        {meetings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[var(--text3)]">No meetings match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
