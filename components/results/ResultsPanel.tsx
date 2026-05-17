"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useMeetingContext } from "@/contexts/meeting-context"
import { EmptyState } from "@/components/shared/EmptyState"
import { ProcessingState } from "@/components/shared/ProcessingState"
import { StatsRow } from "./StatsRow"
import { SpeakerChips } from "./SpeakerChips"
import { TLDRCard } from "./TLDRCard"
import { TranscriptView } from "./TranscriptView"
import { ActionItemList } from "./ActionItemList"
import { InsightsPanel } from "./InsightsPanel"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FileText, MessageSquare, CheckSquare, Lightbulb } from "lucide-react"

export function ResultsPanel() {
  const { phase, result, processingSteps } = useMeetingContext()

  if (phase === "idle" || phase === "recording" || phase === "stopped") {
    return <EmptyState />
  }

  if (phase === "processing") {
    return <ProcessingState steps={processingSteps} />
  }

  if (!result) return <EmptyState />

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 p-6 lg:p-7 overflow-y-auto"
    >
      {/* Stats */}
      <StatsRow stats={result.stats} />

      {/* Speaker Chips */}
      <SpeakerChips speakers={result.speakers} />

      {/* Tabs */}
      <Tabs defaultValue="tldr" className="w-full">
        <TabsList className="w-full grid grid-cols-4 gap-1">
          <TabsTrigger value="tldr" className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TLDR</span>
          </TabsTrigger>
          <TabsTrigger value="transcript" className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Transcript</span>
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="tldr">
            <motion.div
              key="tldr"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <TLDRCard result={result} />
            </motion.div>
          </TabsContent>

          <TabsContent value="transcript">
            <motion.div
              key="transcript"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <TranscriptView lines={result.transcript} />
            </motion.div>
          </TabsContent>

          <TabsContent value="actions">
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <ActionItemList items={result.actionItems} />
            </motion.div>
          </TabsContent>

          <TabsContent value="insights">
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <InsightsPanel insights={result.insights} speakers={result.speakers} />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}
