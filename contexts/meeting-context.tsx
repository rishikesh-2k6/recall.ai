"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { Phase, MeetingResult, StepStatus } from "@/lib/types"

interface MeetingContextType {
  phase: Phase
  result: MeetingResult | null
  processingSteps: StepStatus[]
  setPhase: (p: Phase) => void
  setResult: (r: MeetingResult | null) => void
  setProcessingSteps: (s: StepStatus[]) => void
}

const MeetingContext = createContext<MeetingContextType | null>(null)

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<MeetingResult | null>(null)
  const [processingSteps, setProcessingSteps] = useState<StepStatus[]>([])

  return (
    <MeetingContext.Provider value={{ phase, result, processingSteps, setPhase, setResult, setProcessingSteps }}>
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeetingContext() {
  const ctx = useContext(MeetingContext)
  if (!ctx) throw new Error("useMeetingContext must be used within MeetingProvider")
  return ctx
}
