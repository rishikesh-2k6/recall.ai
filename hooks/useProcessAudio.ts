"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import type { MeetingResult, RecorderSettings, StepStatus, StepName } from "@/lib/types"
import { MOCK_MEETING } from "@/lib/mock-data"

const STEP_LABELS: Record<StepName, string> = {
  captured: 'Audio captured',
  transcribing: 'Transcribing (Groq Whisper)',
  analysing: 'Analysing (Llama 3)',
  extracting: 'Extracting action items',
  saving: 'Saving to database',
}

const STEP_NAMES: StepName[] = ['captured', 'transcribing', 'analysing', 'extracting', 'saving']

// Simulated step durations in ms (for demo mode)
const STEP_DELAYS = [600, 1200, 1000, 800, 500]

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
      // Try real API first
      const formData = new FormData()
      const filename = (audioBlob as any).name || 'recording.webm'
      formData.append('audio', audioBlob, filename)
      formData.append('name', meetingName)
      formData.append('diarize', String(settings.diarize))
      formData.append('actions', String(settings.actions))
      formData.append('language', settings.language)
      formData.append('style', settings.style)

      // Step 0: captured
      advanceStep(0)
      await new Promise(r => setTimeout(r, STEP_DELAYS[0]))

      // Step 1: transcribing
      advanceStep(1)

      let data: MeetingResult | null = null

      const res = await fetch('/api/process-audio', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to process audio')
      }

      data = await res.json()

      // Step 2: analysing
      advanceStep(2)

      // Step 3: extracting
      advanceStep(3)

      // Step 4: saving
      advanceStep(4)

      // All done
      setSteps(prev => prev.map(s => ({ ...s, state: 'done' as const })))
      setResult(data)
      return data
    } catch (err) {
      console.warn("Backend processing failed, falling back to Demo Mode:", err)
      
      // Simulate completing remaining steps for smooth UI
      for (let i = 1; i < STEP_NAMES.length; i++) {
        advanceStep(i)
        await new Promise(r => setTimeout(r, 450))
      }
      
      const fallbackData: MeetingResult = {
        ...MOCK_MEETING,
        name: meetingName || MOCK_MEETING.name,
        suggestedTitle: meetingName !== "New Meeting" ? `${meetingName} — Feature Prioritization` : MOCK_MEETING.suggestedTitle
      }
      
      setSteps(prev => prev.map(s => ({ ...s, state: 'done' as const })))
      setResult(fallbackData)
      toast.info("Using Demo Mode sample data (API or database was unavailable)")
      return fallbackData
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
