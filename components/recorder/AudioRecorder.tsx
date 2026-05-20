"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, AlertCircle, Zap } from "lucide-react"
import { toast } from "sonner"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useTimer } from "@/hooks/useTimer"
import { useMeetingContext } from "@/contexts/meeting-context"
import { useProcessAudio } from "@/hooks/useProcessAudio"
import { WaveformCanvas } from "./WaveformCanvas"
import { RecordButton } from "./RecordButton"
import { TimerDisplay } from "./TimerDisplay"
import { ModeSelector } from "./ModeSelector"
import { RecorderSettings } from "./RecorderSettings"
import { MeetingTemplatePicker } from "./MeetingTemplatePicker"
import type { RecorderSettings as SettingsType, RecorderMode } from "@/lib/types"
import type { MeetingTemplate } from "./MeetingTemplatePicker"

export function AudioRecorder() {
  const { phase, setPhase, setResult, setProcessingSteps, setAudioUrl } = useMeetingContext()
  const { isRecording, audioBlob, stream, error: micError, start: startMic, stop: stopMic } = useAudioRecorder()
  const { formatted, start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer()
  const { process, steps, error: processError } = useProcessAudio()

  const [meetingName, setMeetingName] = useState("New Meeting")
  const [mode, setMode] = useState<RecorderMode>("mic")
  const [settings, setSettings] = useState<SettingsType>({
    diarize: true,
    actions: true,
    language: "en",
    style: "detailed",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  async function handleStart() {
    await startMic(mode)
    startTimer()
    setPhase("recording")
    const toastMsg = mode === "system"
      ? "Recording system audio. Make sure you share system audio in the screen prompt."
      : "Speak clearly into your microphone."
    toast("Recording started", { description: toastMsg })
  }

  async function handleStop() {
    await stopMic()
    stopTimer()
    setPhase("stopped")
    toast.success("Recording saved", { description: "Ready to process with AI." })
  }

  async function handleProcess() {
    const blob = mode === "upload" && uploadedFile
      ? uploadedFile
      : audioBlob

    if (!blob) return

    // Create audio URL for playback
    const url = URL.createObjectURL(blob)
    setAudioUrl(url)

    setPhase("processing")
    setProcessingSteps(steps)
    const result = await process(blob, settings, meetingName)
    if (result) {
      setResult(result)
      setPhase("complete")
      toast.success("Meeting processed!", { description: `${result.stats.wordCount.toLocaleString()} words transcribed` })
      window.dispatchEvent(new CustomEvent("meetings-updated"))
      // Auto-set suggested title
      if (result.suggestedTitle && meetingName === "New Meeting") {
        setMeetingName(result.suggestedTitle)
      }
    } else {
      setPhase("stopped")
      toast.error("Processing failed", { description: "Please try again." })
    }
  }

  function handleFileSelect(file: File) {
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB Groq Whisper boundary limit
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large", { 
        description: `Maximum size allowed is 25MB. This file is ${(file.size / 1024 / 1024).toFixed(1)}MB.` 
      });
      return;
    }
    setUploadedFile(file)
    setPhase("stopped")
    toast.success("File uploaded", { description: file.name })
  }

  function handleReRecord() {
    resetTimer()
    setPhase("idle")
    setUploadedFile(null)
    setAudioUrl(null)
  }

  function handleNewMeeting() {
    resetTimer()
    setPhase("idle")
    setUploadedFile(null)
    setAudioUrl(null)
    setResult(null)
    setMeetingName("New Meeting")
  }

  function handleTemplateSelect(template: MeetingTemplate) {
    setSettings(prev => ({ ...prev, ...template.settings }))
    if (meetingName === "New Meeting") setMeetingName(template.nameSuggestion)
    toast(`Template applied: ${template.label}`)
  }

  const showProcessButton = phase === "stopped" && (audioBlob || uploadedFile)

  return (
    <section className="w-full lg:w-[340px] flex-shrink-0 flex flex-col gap-5 p-6 pt-16 lg:pt-6 border-b lg:border-b-0 lg:border-r border-[var(--border)] bg-[var(--bg2)]/30 overflow-y-visible lg:overflow-y-auto">
      {/* Meeting name input */}
      <div>
        <input
          type="text"
          value={meetingName}
          onChange={(e) => setMeetingName(e.target.value)}
          className="w-full bg-transparent text-lg font-semibold text-[var(--text)] placeholder:text-[var(--text3)] border-none outline-none"
          style={{ fontFamily: 'var(--font-serif)' }}
          placeholder="Meeting Name"
        />
        <p className="text-[10px] text-[var(--text3)] mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Waveform */}
      <WaveformCanvas isRecording={isRecording} stream={stream} />

      {/* Timer */}
      <TimerDisplay value={formatted} isRecording={isRecording} />

      {/* Record Button */}
      <div className="flex justify-center py-2">
        <RecordButton phase={phase} onStart={handleStart} onStop={handleStop} />
      </div>

      {/* Error display */}
      <AnimatePresence>
        {(micError || processError) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-[var(--red)]/5 border border-[var(--red)]/20"
          >
            <AlertCircle className="w-4 h-4 text-[var(--red)] flex-shrink-0" />
            <p className="text-xs text-[var(--red)]">{micError || processError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates (idle only) */}
      {phase === "idle" && (
        <MeetingTemplatePicker onSelect={handleTemplateSelect} />
      )}

      {/* Mode Selector (idle only) */}
      {phase === "idle" && (
        <ModeSelector mode={mode} onChange={setMode} onFileSelect={handleFileSelect} />
      )}

      {/* Settings (idle or stopped) */}
      {(phase === "idle" || phase === "stopped") && (
        <RecorderSettings settings={settings} onChange={setSettings} />
      )}

      {/* Process / Re-record buttons */}
      <AnimatePresence>
        {showProcessButton && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="space-y-2"
          >
            <button
              onClick={handleProcess}
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--accent)]/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Process with AI
            </button>
            <button
              onClick={handleReRecord}
              className="w-full py-2 px-4 rounded-xl text-sm text-[var(--text3)] hover:text-[var(--text2)] transition-colors cursor-pointer"
            >
              Re-record
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New meeting button (complete phase) */}
      {phase === "complete" && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleNewMeeting}
          className="w-full py-3 px-4 rounded-xl border border-[var(--accent)]/30 text-[var(--accent)] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[var(--accent)]/5 transition-all cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          New Meeting
        </motion.button>
      )}

      {/* File info */}
      {uploadedFile && (
        <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text2)]">
          📎 {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
        </div>
      )}

      {/* Demo note */}
      <div className="mt-auto p-3 rounded-lg bg-[var(--accent)]/5 border border-[var(--accent)]/10">
        <p className="text-[10px] text-[var(--accent)] flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          Demo Mode — Uses sample data when backend is unavailable
        </p>
      </div>
    </section>
  )
}
