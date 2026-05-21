"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, FileText, ChevronRight, Search, RotateCcw, Trash2, Archive, Sparkles, ArrowLeft } from "lucide-react"
import { formatMinSec } from "@/lib/utils"
import { toast } from "sonner"

export default function ArchivePage() {
  const [search, setSearch] = useState("")
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

  async function handleRestore(meetingId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insights: {
            is_archived: false
          }
        })
      })
      if (res.ok) {
        setAllMeetings(prev => prev.filter(m => m.id !== meetingId))
        window.dispatchEvent(new CustomEvent("meetings-updated"))
        toast.success("Meeting restored", {
          description: "Available in your main History board."
        })
      } else {
        toast.error("Failed to restore meeting.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred.")
    }
  }

  async function handleDelete(meetingId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm("Are you sure you want to permanently delete this meeting? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setAllMeetings(prev => prev.filter(m => m.id !== meetingId))
        window.dispatchEvent(new CustomEvent("meetings-updated"))
        toast.success("Meeting permanently deleted")
      } else {
        toast.error("Failed to delete meeting.")
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred while deleting the meeting.")
    }
  }

  const meetings = allMeetings.filter(m => {
    // Only show archived meetings
    if (!m.insights?.is_archived) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-[var(--text3)] hover:text-[var(--accent)] transition-colors mb-4 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <Archive className="w-5 h-5 text-[var(--accent2)]" />
          <h1
            className="text-2xl font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Archive Vault
          </h1>
        </div>
        <p className="text-sm text-[var(--text3)]">
          {meetings.length} archived meeting records
        </p>
      </div>

      {/* Search bar */}
      <div className="flex flex-col gap-4 mb-8 p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]/50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent2)] to-[var(--accent)] opacity-50" />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent2)] animate-pulse" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Search Archive</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] focus-within:border-[var(--accent)]/50 transition-colors">
            <Search className="w-4 h-4 text-[var(--text3)]" />
            <input
              type="text"
              placeholder="Search archived meetings by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text3)] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Meeting list */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-16 text-sm text-[var(--text3)]">Loading archived meetings...</div>
        ) : meetings.map((meeting, i) => {
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
                className="block p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] opacity-85 hover:opacity-100 hover:border-[var(--accent2)]/20 hover:bg-[var(--card2)] transition-all pr-24 group"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: name + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-[var(--text)] truncate group-hover:text-[var(--accent2)] transition-colors line-through decoration-white/20">
                        {meeting.name}
                      </h3>
                      {meeting.insights?.meetingType && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-gradient-to-r from-[var(--accent2)] to-[var(--accent)] border border-white/10 shadow-sm opacity-60">
                          {meeting.insights.meetingType}
                        </span>
                      )}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[var(--border)] text-[9px] text-[var(--text3)] uppercase tracking-wider font-semibold">
                        Archived
                      </span>
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
                    <ChevronRight className="w-4 h-4 text-[var(--text3)] group-hover:text-[var(--accent2)] transition-colors" />
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => handleRestore(meeting.id, e)}
                className="absolute right-[5.5rem] top-5 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text3)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Restore meeting"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => handleDelete(meeting.id, e)}
                className="absolute right-12 top-5 p-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--text3)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )
        })}

        {!isLoading && meetings.length === 0 && (
          <div className="text-center py-16">
            <Archive className="w-8 h-8 text-[var(--text3)] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[var(--text3)]">No meetings in your archive vault.</p>
          </div>
        )}
      </div>
    </div>
  )
}
