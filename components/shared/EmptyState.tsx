"use client"

import { Mic } from "lucide-react"
import { motion } from "framer-motion"

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-center mb-6">
        <Mic className="w-7 h-7 text-[var(--accent)]/40" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text)] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
        No meeting recorded yet
      </h3>
      <p className="text-sm text-[var(--text3)] max-w-xs">
        Hit the record button or upload an audio file to get an AI-powered transcript and summary.
      </p>
    </motion.div>
  )
}
