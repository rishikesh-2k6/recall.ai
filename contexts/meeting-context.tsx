"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import type { Phase, MeetingResult, StepStatus } from "@/lib/types"

interface MeetingContextType {
  phase: Phase
  result: MeetingResult | null
  processingSteps: StepStatus[]
  audioUrl: string | null
  setPhase: (p: Phase) => void
  setResult: (r: MeetingResult | null) => void
  setProcessingSteps: (s: StepStatus[]) => void
  setAudioUrl: (url: string | null) => void
}

const MeetingContext = createContext<MeetingContextType | null>(null)

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<MeetingResult | null>(null)
  const [processingSteps, setProcessingSteps] = useState<StepStatus[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  return (
    <MeetingContext.Provider value={{
      phase, result, processingSteps, audioUrl,
      setPhase, setResult, setProcessingSteps, setAudioUrl
    }}>
      {children}
    </MeetingContext.Provider>
  )
}

export function useMeetingContext() {
  const ctx = useContext(MeetingContext)
  if (!ctx) throw new Error("useMeetingContext must be used within MeetingProvider")
  return ctx
}
