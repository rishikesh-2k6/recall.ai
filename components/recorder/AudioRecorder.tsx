"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, AlertCircle } from "lucide-react"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useTimer } from "@/hooks/useTimer"
import { useMeetingContext } from "@/contexts/meeting-context"
import { useProcessAudio } from "@/hooks/useProcessAudio"
import { WaveformCanvas } from "./WaveformCanvas"
import { RecordButton } from "./RecordButton"
import { TimerDisplay } from "./TimerDisplay"
import { ModeSelector } from "./ModeSelector"
import { RecorderSettings } from "./RecorderSettings"
import type { RecorderSettings as SettingsType, RecorderMode } from "@/lib/types"

export function AudioRecorder() {
  const { phase, setPhase, setResult, setProcessingSteps } = useMeetingContext()
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
    await startMic()
    startTimer()
    setPhase("recording")
  }

  async function handleStop() {
    await stopMic()
    stopTimer()
    setPhase("stopped")
  }

  async function handleProcess() {
    const blob = mode === "upload" && uploadedFile
      ? new Blob([uploadedFile], { type: uploadedFile.type })
      : audioBlob

    if (!blob) return

    setPhase("processing")
    setProcessingSteps(steps)
    const result = await process(blob, settings, meetingName)
    if (result) {
      setResult(result)
      setPhase("complete")
      // Auto-set suggested title
      if (result.suggestedTitle && meetingName === "New Meeting") {
        setMeetingName(result.suggestedTitle)
      }
    } else {
      setPhase("stopped")
    }
  }

  function handleFileSelect(file: File) {
    setUploadedFile(file)
    setPhase("stopped")
  }

  function handleReRecord() {
    resetTimer()
    setPhase("idle")
    setUploadedFile(null)
  }

  const showProcessButton = phase === "stopped" && (audioBlob || uploadedFile)

  return (
    <section className="w-full lg:w-[340px] flex flex-col gap-5 p-6 border-r border-[var(--border)] bg-[var(--bg2)]/30 overflow-y-auto">
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

      {/* Mode Selector */}
      {phase === "idle" && (
        <ModeSelector mode={mode} onChange={setMode} onFileSelect={handleFileSelect} />
      )}

      {/* Settings */}
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
              className="w-full py-3 px-4 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--accent)]/20"
            >
              <Sparkles className="w-4 h-4" />
              Process Meeting
            </button>
            <button
              onClick={handleReRecord}
              className="w-full py-2 px-4 rounded-xl text-sm text-[var(--text3)] hover:text-[var(--text2)] transition-colors"
            >
              Re-record
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File info */}
      {uploadedFile && (
        <div className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text2)]">
          📎 {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
        </div>
      )}
    </section>
  )
}
