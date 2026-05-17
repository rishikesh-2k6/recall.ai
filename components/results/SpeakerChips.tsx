"use client"

import { motion } from "framer-motion"
import { getInitials, getSpeakerColor, formatMinSec } from "@/lib/utils"
import type { Speaker } from "@/lib/types"

interface SpeakerChipsProps {
  speakers: Speaker[]
}

export function SpeakerChips({ speakers }: SpeakerChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {speakers.map((speaker, i) => {
        const color = getSpeakerColor(i)
        return (
          <motion.div
            key={speaker.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)]"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {getInitials(speaker.label)}
            </div>
            <span className="text-xs font-medium text-[var(--text)]">{speaker.label}</span>
            <span className="text-[10px] text-[var(--text3)] font-mono" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatMinSec(speaker.talkTime)}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
