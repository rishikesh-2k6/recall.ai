"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, FileText, ChevronRight, Search, Smile, Frown, HelpCircle, Sparkles, Send, Trash2, Archive } from "lucide-react"
import { formatMinSec } from "@/lib/utils"
import { toast } from "sonner"

const SENTIMENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  aligned:   { icon: Smile, color: 'var(--green)' },
  tense:     { icon: Frown, color: 'var(--red)' },
  uncertain: { icon: HelpCircle, color: 'var(--amber)' },
  neutral:   { icon: Smile, color: 'var(--text3)' },
}

export default function MeetingsPage() {
  const [search, setSearch] = useState("")
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [allMeetings, setAllMeetings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMeetings = () => {
    fetch("/api/meetings")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setAllMeetings(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }

  useEffect(() => {
    fetchMeetings()
    
    window.addEventListener("meetings-updated", fetchMeetings)
    return () => {
      window.removeEventListener("meetings-updated", fetchMeetings)
    }
  }, [])

  async function handleDelete(meetingId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Are you sure you want to delete this meeting?")) return

    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setAllMeetings(prev => prev.filter(m => m.id !== meetingId))
        window.dispatchEvent(new CustomEvent("meetings-updated"))
        toast.success("Meeting deleted")
      } else {
        toast.error("Failed to delete meeting.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred while deleting the meeting.")
    }
  }

  async function handleQuickArchive(meetingId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insights: {
            is_archived: true
          }
        })
      })
      if (res.ok) {
        setAllMeetings(prev => prev.filter(m => m.id !== meetingId))
        window.dispatchEvent(new CustomEvent("meetings-updated"))
        toast.success("Meeting archived", {
          description: "Found under the Archive tab."
        })
      } else {
        toast.error("Failed to archive meeting.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred.")
    }
  }

  async function handleVaultAsk() {
    if (!search.trim()) return
    setIsAsking(true)
    setAiResponse(null)
    
    try {
      const res = await fetch("/api/vault-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: search }),
      })
      const data = await res.json()
      setAiResponse(data.answer || "No answer found.")
    } catch (e) {
      setAiResponse("An error occurred while searching your vault.")
    }
    
    setIsAsking(false)
  }

  const meetings = allMeetings
    .filter(m => {
      if (m.insights?.is_archived) return false
      if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filterSentiment && m.insights?.sentiment && m.insights.sentiment !== filterSentiment) return false
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

      {/* Search + Vault Ask bar */}
      <div className="flex flex-col gap-4 mb-8 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] opacity-50" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Vault AI Search</h2>
          </div>

          {/* Sentiment filter pills */}
          <div className="flex flex-wrap items-center gap-1 px-2 py-1 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
            <button
              onClick={() => setFilterSentiment(null)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                !filterSentiment ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text3)]"
              }`}
            >
              All
            </button>
            {["aligned", "tense", "uncertain"].map(s => (
              <button
                key={s}
                onClick={() => setFilterSentiment(filterSentiment === s ? null : s)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all capitalize ${
                  filterSentiment === s ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text3)]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus-within:border-[var(--accent)]/50 transition-colors">
            <Search className="w-4 h-4 text-[var(--text3)]" />
            <input
              type="text"
              placeholder="Search history, or ask 'What did we decide about the budget?'..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                if (aiResponse) setAiResponse(null) // clear response if typing
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && search.endsWith('?')) handleVaultAsk()
              }}
              className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
            />
            {search.endsWith('?') && (
              <button 
                onClick={handleVaultAsk}
                className="flex items-center justify-center p-1.5 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors"
                title="Ask Vault AI"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* AI Response Area */}
        <AnimatePresence>
          {(isAsking || aiResponse) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20"
            >
              {isAsking ? (
                <div className="flex items-center gap-2 text-sm text-[var(--accent2)]">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                  Searching your meeting vault...
                </div>
              ) : (
                <p className="text-sm text-[var(--text2)] leading-relaxed">
                  <span className="font-semibold text-[var(--accent)]">Vault AI: </span>
                  {aiResponse}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Meeting list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-[var(--text3)]">Loading your meetings...</div>
        ) : meetings.map((meeting, i) => {
          const sentiment = SENTIMENT_ICONS[meeting.insights?.sentiment] || SENTIMENT_ICONS.neutral
          const date = new Date(meeting.created_at)

          return (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative group"
            >
              <Link
                href={`/meetings/${meeting.id}`}
                className="block p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--accent)]/20 hover:bg-[var(--card2)] transition-all pr-24 group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                        {meeting.name}
                      </h3>
                      <sentiment.icon className="w-4 h-4 flex-shrink-0" style={{ color: sentiment.color }} />
                      {meeting.insights?.meetingType && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] border border-white/10 shadow-sm shadow-[var(--accent)]/10 animate-pulse-slow">
                          ✨ {meeting.insights.meetingType}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text3)] line-clamp-2 mb-3">
                      {meeting.tldr}
                    </p>

                    {/* Stats */}
                    {meeting.stats && (
                    <div className="flex items-center gap-4 text-[10px] text-[var(--text3)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatMinSec(meeting.stats.duration ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {meeting.stats.speakerCount ?? 1} speakers
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {(meeting.stats.wordCount ?? 0).toLocaleString()} words
                      </span>
                    </div>
                    )}
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
                      {meeting.actionItems.slice(0, 3).map((item: any) => (
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
              <button
                onClick={(e) => handleQuickArchive(meeting.id, e)}
                className="absolute right-[5.5rem] top-5 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text3)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Archive meeting"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(meeting.id, e)}
                className="absolute right-12 top-5 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text3)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete meeting"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}

        {!isLoading && meetings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-[var(--text3)]">No meetings match your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}
