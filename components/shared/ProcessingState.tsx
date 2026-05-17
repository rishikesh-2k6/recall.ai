"use client"

import { motion } from "framer-motion"
import { Circle, Loader2, CheckCircle2 } from "lucide-react"
import type { StepStatus } from "@/lib/types"

interface ProcessingStateProps {
  steps: StepStatus[]
}

export function ProcessingState({ steps }: ProcessingStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col items-center justify-center p-12"
    >
      <div className="w-full max-w-sm space-y-4">
        <h3
          className="text-lg font-semibold text-[var(--text)] text-center mb-6"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Processing your meeting…
        </h3>

        {steps.map((step, i) => (
          <motion.div
            key={step.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3"
          >
            {step.state === 'done' ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--green)] flex-shrink-0" />
            ) : step.state === 'active' ? (
              <Loader2 className="w-5 h-5 text-[var(--accent)] animate-spin flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-[var(--text3)] flex-shrink-0" />
            )}
            <span className={`text-sm ${
              step.state === 'done'
                ? "text-[var(--text2)] line-through"
                : step.state === 'active'
                ? "text-[var(--text)] font-medium"
                : "text-[var(--text3)]"
            }`}>
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
