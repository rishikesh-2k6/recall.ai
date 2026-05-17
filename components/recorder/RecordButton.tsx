"use client"

import { motion } from "framer-motion"
import type { Phase } from "@/lib/types"
import { Mic, Square, Loader2 } from "lucide-react"

interface RecordButtonProps {
  phase: Phase
  onStart: () => void
  onStop: () => void
}

export function RecordButton({ phase, onStart, onStop }: RecordButtonProps) {
  const isRecording = phase === "recording"
  const isProcessing = phase === "processing"

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer pulse ring (recording only) */}
      {isRecording && (
        <motion.div
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-[-16px] rounded-full border border-[var(--red)]"
        />
      )}

      <button
        onClick={isRecording ? onStop : onStart}
        disabled={isProcessing}
        aria-label={isRecording ? "Stop recording" : isProcessing ? "Processing audio" : "Start recording"}
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg cursor-pointer
          ${isRecording
            ? "bg-[var(--red)] hover:bg-[var(--red)]/90 ring-4 ring-[var(--red)]/20"
            : isProcessing
            ? "bg-[var(--card2)] cursor-not-allowed"
            : "bg-[var(--accent)] hover:bg-[var(--accent)]/90 ring-4 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/40"
          }
        `}
      >
        {isProcessing ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : isRecording ? (
          <Square className="w-5 h-5 text-white" />
        ) : (
          <Mic className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  )
}
