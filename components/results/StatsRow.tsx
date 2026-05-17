"use client"

import { motion } from "framer-motion"
import { Clock, Users, FileText, CheckSquare } from "lucide-react"
import { formatMinSec } from "@/lib/utils"
import type { MeetingStats } from "@/lib/types"

interface StatsRowProps {
  stats: MeetingStats
}

const STAT_ITEMS = [
  { key: 'duration', icon: Clock, label: 'Duration', format: (v: number) => formatMinSec(v) },
  { key: 'speakerCount', icon: Users, label: 'Speakers', format: (v: number) => String(v) },
  { key: 'wordCount', icon: FileText, label: 'Words', format: (v: number) => v.toLocaleString() },
  { key: 'actionItemCount', icon: CheckSquare, label: 'Actions', format: (v: number) => String(v) },
] as const

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {STAT_ITEMS.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-center"
        >
          <item.icon className="w-4 h-4 mx-auto mb-1.5 text-[var(--text3)]" />
          <p className="text-lg font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-mono)' }}>
            {item.format(stats[item.key])}
          </p>
          <p className="text-[10px] text-[var(--text3)] uppercase tracking-wider">{item.label}</p>
        </motion.div>
      ))}
    </div>
  )
}
