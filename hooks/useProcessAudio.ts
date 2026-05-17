"use client"

import { useState, useCallback } from "react"
import type { MeetingResult, RecorderSettings, StepStatus, StepName } from "@/lib/types"

const STEP_LABELS: Record<StepName, string> = {
  captured: 'Audio captured',
  transcribing: 'Transcribing (Groq Whisper)',
  analysing: 'Analysing (Llama 3)',
  extracting: 'Extracting action items',
  saving: 'Saving to database',
}

const STEP_NAMES: StepName[] = ['captured', 'transcribing', 'analysing', 'extracting', 'saving']

function createInitialSteps(): StepStatus[] {
  return STEP_NAMES.map(name => ({
    name,
    label: STEP_LABELS[name],
    state: 'pending' as const,
  }))
}

export function useProcessAudio() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [steps, setSteps] = useState<StepStatus[]>(createInitialSteps())
  const [result, setResult] = useState<MeetingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const advanceStep = useCallback((index: number) => {
    setSteps(prev => prev.map((step, i) => ({
      ...step,
      state: i < index ? 'done' : i === index ? 'active' : 'pending',
    })))
  }, [])

  const process = useCallback(async (
    audioBlob: Blob,
    settings: RecorderSettings,
    meetingName: string
  ) => {
    setIsProcessing(true)
    setError(null)
    setSteps(createInitialSteps())

    try {
      // Step 0: captured
      advanceStep(0)
      await new Promise(r => setTimeout(r, 500))

      // Step 1: transcribing
      advanceStep(1)

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('name', meetingName)
      formData.append('diarize', String(settings.diarize))
      formData.append('actions', String(settings.actions))
      formData.append('language', settings.language)
      formData.append('style', settings.style)

      const res = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      })

      // Step 2: analysing
      advanceStep(2)
      await new Promise(r => setTimeout(r, 400))

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Processing failed' }))
        throw new Error(err.error || 'Processing failed')
      }

      // Step 3: extracting
      advanceStep(3)
      await new Promise(r => setTimeout(r, 300))

      const data: MeetingResult = await res.json()

      // Step 4: saving
      advanceStep(4)
      await new Promise(r => setTimeout(r, 300))

      // All done
      setSteps(prev => prev.map(s => ({ ...s, state: 'done' as const })))
      setResult(data)
      return data
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [advanceStep])

  const reset = useCallback(() => {
    setSteps(createInitialSteps())
    setResult(null)
    setError(null)
    setIsProcessing(false)
  }, [])

  return { isProcessing, steps, result, error, process, reset }
}
