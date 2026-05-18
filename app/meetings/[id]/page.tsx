"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Download, Clock, Users, FileText, CheckSquare } from "lucide-react"
import { formatMinSec } from "@/lib/utils"
import { StatsRow } from "@/components/results/StatsRow"
import { SpeakerChips } from "@/components/results/SpeakerChips"
import { TLDRCard } from "@/components/results/TLDRCard"
import { TranscriptView } from "@/components/results/TranscriptView"
import { ActionItemList } from "@/components/results/ActionItemList"
import { InsightsPanel } from "@/components/results/InsightsPanel"
import { ExportDropdown } from "@/components/shared/ExportDropdown"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileText as FileTextIcon, MessageSquare, Lightbulb } from "lucide-react"

export default function MeetingDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const [meeting, setMeeting] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    if (id) {
      fetch(`/api/meetings/${id}`)
        .then(r => r.json())
        .then(data => {
          if (!data.error) setMeeting(data)
          setIsLoading(false)
        })
        .catch(() => setIsLoading(false))
    }
  }, [id])

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center p-12 text-[var(--text3)]">Loading meeting details...</div>
  }

  if (!meeting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
          Meeting not found
        </h2>
        <p className="text-sm text-[var(--text3)] mb-4">This meeting doesn&apos;t exist or has been deleted.</p>
        <Link href="/meetings" className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to meetings
        </Link>
      </div>
    )
  }

  const date = new Date(meeting.created_at)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-6 lg:p-8 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-1 text-xs text-[var(--text3)] hover:text-[var(--accent)] transition-colors mb-3"
          >
            <ArrowLeft className="w-3 h-3" /> Back to meetings
          </Link>
          <h1
            className="text-2xl font-bold text-[var(--text)]"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {meeting.name}
          </h1>
          <p className="text-xs text-[var(--text3)] mt-1">
            {date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' • '}
            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <ExportDropdown result={meeting} />
      </div>

      {/* Stats */}
      <StatsRow stats={meeting.stats} />

      {/* Speaker Chips */}
      <SpeakerChips speakers={meeting.speakers} />

      {/* Tabs */}
      <Tabs defaultValue="tldr" className="w-full">
        <TabsList className="w-full grid grid-cols-4 gap-1">
          <TabsTrigger value="tldr" className="flex items-center gap-1.5">
            <FileTextIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TLDR</span>
          </TabsTrigger>
          <TabsTrigger value="transcript" className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transcript</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actions</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              {meeting.actionItems.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tldr">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TLDRCard result={meeting} />
          </motion.div>
        </TabsContent>

        <TabsContent value="transcript">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TranscriptView lines={meeting.transcript} />
          </motion.div>
        </TabsContent>

        <TabsContent value="actions">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ActionItemList items={meeting.actionItems} />
          </motion.div>
        </TabsContent>

        <TabsContent value="insights">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <InsightsPanel insights={meeting.insights} speakers={meeting.speakers} />
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
