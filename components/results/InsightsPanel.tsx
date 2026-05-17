"use client"

import { motion } from "framer-motion"
import { AlertTriangle, HelpCircle, Smile, Frown } from "lucide-react"
import { getSpeakerColor } from "@/lib/utils"
import type { Insights } from "@/lib/types"

interface InsightsPanelProps {
  insights: Insights
  speakers?: Array<{ id: string; label: string }>
}

const SENTIMENT_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  aligned:   { icon: Smile, color: 'var(--green)', label: 'Aligned' },
  tense:     { icon: Frown, color: 'var(--red)', label: 'Tense' },
  uncertain: { icon: HelpCircle, color: 'var(--amber)', label: 'Uncertain' },
  neutral:   { icon: Smile, color: 'var(--text3)', label: 'Neutral' },
}

export function InsightsPanel({ insights, speakers = [] }: InsightsPanelProps) {
  const sentiment = SENTIMENT_META[insights.sentiment] || SENTIMENT_META.neutral

  return (
    <div className="space-y-6">
      {/* Sentiment */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)] mb-3">
          Meeting Sentiment
        </p>
        <div className="flex items-center gap-3">
          <sentiment.icon className="w-6 h-6" style={{ color: sentiment.color }} />
          <span className="text-lg font-semibold" style={{ color: sentiment.color }}>
            {sentiment.label}
          </span>
        </div>
      </motion.div>

      {/* Risks */}
      {insights.risks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)] mb-3">
            Timeline Risks
          </p>
          <div className="space-y-2">
            {insights.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-[var(--amber)] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[var(--text2)]">{risk}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Key Decisions */}
      {insights.decisions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)] mb-3">
            Key Decisions
          </p>
          <ul className="space-y-2">
            {insights.decisions.map((decision, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--text2)]">
                <span className="text-[var(--green)] font-bold">✓</span>
                {decision}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Talk Ratio */}
      {Object.keys(insights.talkRatio).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)] mb-3">
            Talk Ratio
          </p>
          <div className="space-y-3">
            {Object.entries(insights.talkRatio).map(([speakerId, pct], i) => {
              const speakerLabel = speakers.find(s => s.id === speakerId)?.label || speakerId
              const color = getSpeakerColor(i)
              return (
                <div key={speakerId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium" style={{ color }}>{speakerLabel}</span>
                    <span className="text-[var(--text3)] font-mono" style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
