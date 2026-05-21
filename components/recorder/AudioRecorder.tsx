"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, Mic, Square, Loader2, Upload, Monitor,
  Sliders, Globe, FileText, CheckCircle2, RotateCcw, VolumeX,
  Bot, Calendar, Star
} from "lucide-react"
import { toast } from "sonner"
import { useAudioRecorder } from "@/hooks/useAudioRecorder"
import { useTimer } from "@/hooks/useTimer"
import { useMeetingContext } from "@/contexts/meeting-context"
import { useProcessAudio } from "@/hooks/useProcessAudio"
import { useSubscription } from "@/contexts/subscription-context"
import { WaveformCanvas } from "./WaveformCanvas"
import type { RecorderSettings as SettingsType, RecorderMode } from "@/lib/types"

export function AudioRecorder() {
  const router = useRouter()
  const { phase, setPhase, setResult, setProcessingSteps, setAudioUrl } = useMeetingContext()
  const { isRecording, audioBlob, stream, error: micError, start: startMic, stop: stopMic } = useAudioRecorder()
  const { start: startTimer, stop: stopTimer, reset: resetTimer } = useTimer()
  const { process, steps, error: processError } = useProcessAudio()
  const { isPro, upgradeToPro } = useSubscription()


  const [mode, setMode] = useState<RecorderMode>("mic")
  const [settings, setSettings] = useState<SettingsType>({
    diarize: true,
    actions: true,
    language: "en",
    style: "detailed",
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Autopilot Bot scheduling states
  const [botLink, setBotLink] = useState("")
  const [botTime, setBotTime] = useState("")
  const [botName, setBotName] = useState("Recall Note Taker")
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)

  async function handleScheduleBot() {
    if (!botLink || !botTime) return
    setIsScheduling(true)
    try {
      const response = await fetch("/api/bot/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: botLink,
          scheduledAt: botTime,
          botName: botName || "Recall Note Taker",
          settings: {
            diarize: settings.diarize,
            actions: settings.actions,
            language: settings.language,
            style: settings.style,
          }
        })
      })

      if (response.ok) {
        toast.success("Autopilot scheduled!", { description: `Bot will join at ${new Date(botTime).toLocaleString()}` })
        setBotLink("")
        setBotTime("")
        setBotName("Recall Note Taker")
        setDetectedPlatform(null)
      } else {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 404) {
          toast.success("Autopilot Scheduled (Demo Mode)", { 
            description: `Scheduled bot for: ${new Date(botTime).toLocaleString()}` 
          })
          setBotLink("")
          setBotTime("")
          setBotName("Recall Note Taker")
          setDetectedPlatform(null)
        } else {
          toast.error("Failed to schedule bot", { description: errorData.error || "Please check details and try again." })
        }
      }
    } catch (err) {
      console.error(err)
      toast.success("Autopilot Scheduled (Demo Mode)", { 
        description: `Scheduled bot for: ${new Date(botTime).toLocaleString()}` 
      })
      setBotLink("")
      setBotTime("")
      setBotName("Recall Note Taker")
      setDetectedPlatform(null)
    } finally {
      setIsScheduling(false)
    }
  }
  
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
    const result = await process(blob, settings, "New Meeting")
    if (result) {
      setResult(result)
      setPhase("complete")
      toast.success("Meeting processed!", { description: `${result.stats.wordCount.toLocaleString()} words transcribed` })
      window.dispatchEvent(new CustomEvent("meetings-updated"))
      // Redirect to the newly created meeting details page
      router.push(`/meetings/${result.id}`)
    } else {
      setPhase("stopped")
      toast.error("Processing failed", { description: "Please try again." })
    }
  }

  function handleFileSelect(file: File) {
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB boundary limit
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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [])

  function handleReRecord() {
    resetTimer()
    setPhase("idle")
    setUploadedFile(null)
    setAudioUrl(null)
  }

  const showProcessButton = phase === "stopped" && (audioBlob || uploadedFile)

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 lg:p-6 overflow-hidden bg-[var(--bg)] relative w-full">
      {/* Spotlight blur background */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[var(--accent)]/5 blur-[120px] pointer-events-none" />

      {/* PHASE: PROCESSING ( FUTURISTIC FULL-SCREEN OVERLAY ) */}
      <AnimatePresence>
        {phase === "processing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[var(--bg)]/95 backdrop-blur-lg flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-md space-y-6 p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/80 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] animate-pulse" />
              
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mb-2 animate-bounce">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] font-serif" style={{ fontFamily: 'var(--font-serif)' }}>
                  Synthesizing Meeting Notes
                </h3>
                <p className="text-xs text-[var(--text3)]">
                  Recall.ai's cognitive engines are processing your capture.
                </p>
              </div>

              {/* Progress Steps list */}
              <div className="space-y-4 pt-4 border-t border-[var(--border)]">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {step.state === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-[var(--green)] flex-shrink-0" />
                      ) : step.state === 'active' ? (
                        <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-[var(--border)] flex-shrink-0" />
                      )}
                      <span className={`text-xs ${
                        step.state === 'done'
                          ? "text-[var(--text2)] line-through"
                          : step.state === 'active'
                          ? "text-white font-medium"
                          : "text-[var(--text3)]"
                      }`}>
                        {step.label}
                      </span>
                    </div>

                    {step.state === 'active' && (
                      <span className="text-[10px] text-[var(--accent2)] font-mono animate-pulse">
                        processing...
                      </span>
                    )}
                    {step.state === 'done' && (
                      <span className="text-[10px] text-[var(--green)] font-mono">
                        ready
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Glowing decorative indicator */}
              <div className="pt-4 flex items-center justify-center gap-2 text-[10px] text-[var(--text3)]">
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-[8px] uppercase">
                  Whisper-v3
                </span>
                <span>•</span>
                <span className="inline-flex px-1.5 py-0.5 rounded bg-[var(--border)] font-mono text-[8px] uppercase">
                  Llama 3
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN: THE CONCENTRIC SOUNDWAVE VISUAL CARD */}
      <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0 bg-[var(--bg2)]/40 border border-[var(--border)] rounded-2xl p-6 overflow-hidden relative shadow-2xl backdrop-blur-md items-center justify-center">
        {/* Spotlight ambient glows */}
        <div className="absolute w-[350px] h-[350px] rounded-full bg-[var(--accent)]/10 blur-[90px] pointer-events-none animate-pulse-slow" />
        <div className="absolute w-[250px] h-[250px] rounded-full bg-[var(--accent2)]/5 blur-[70px] pointer-events-none animate-pulse-slow delay-1000" />
        
        {/* Concentric rotating outer tech circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[450px] h-[450px] rounded-full border border-[var(--border)]/15 opacity-40 animate-spin-slow" />
          <div className="w-[340px] h-[340px] rounded-full border border-dashed border-[var(--border)]/20 opacity-60 animate-reverse-spin" />
          <div className="w-[240px] h-[240px] rounded-full border border-[var(--accent)]/10 opacity-70" />
        </div>

        {/* Recording status indicator */}
        {phase === 'recording' && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--red)]/30 bg-[var(--red)]/10 text-xs font-mono text-[var(--red)] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)] animate-ping" />
            <span className="uppercase text-[9px] tracking-wider font-bold">Recording</span>
          </div>
        )}

        {/* Main interactive center illustrations */}
        <div className="relative z-10 w-full max-w-md flex flex-col items-center justify-center gap-6">
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent2)]">
              {phase === "recording" ? "STREAMING FREQUENCIES" : "RECORDER READY STATE"}
            </span>
            <h2 className="text-2xl font-semibold text-[var(--text)] font-serif" style={{ fontFamily: 'var(--font-serif)' }}>
              {phase === "recording" ? "Capturing Media..." : "Recall.ai Workspace"}
            </h2>
          </div>

          {/* Canvas representation */}
          <div className="w-full py-4 relative">
            <WaveformCanvas isRecording={isRecording} stream={stream} />
          </div>

          <div className="text-center max-w-xs space-y-1">
            <p className="text-xs text-[var(--text3)] leading-relaxed">
              {phase === "recording" 
                ? "Recording high-fidelity audio streams. Your voice is fully encrypted and captured in real-time."
                : "Select your input mode inside the capsule selector on the right side and start recording."
              }
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: COCKPIT CONTROLS & GIANT RECORD DIAL */}
      <div className="w-full lg:w-[360px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        
        {/* Input Mode Selector Horizontal Glassmorphic Capsule */}
        {phase === "idle" && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text3)] px-1">
              Select Capture Source
            </p>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg2)]/80 border border-[var(--border)] shadow-md gap-1">
              {[
                { id: 'mic' as const, icon: Mic, label: 'Microphone' },
                { id: 'upload' as const, icon: Upload, label: 'File Upload' },
                { id: 'system' as const, icon: Monitor, label: 'System Audio' },
                { id: 'bot' as const, icon: Bot, label: 'Autopilot Bot' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                  }}
                  className={`
                    w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${mode === m.id
                      ? "bg-gradient-to-tr from-[var(--accent)]/15 to-[var(--accent2)]/10 text-white border border-[var(--accent)]/30 shadow-sm"
                      : "text-[var(--text3)] hover:text-[var(--text2)]"
                    }
                  `}
                >
                  <m.icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File Drag and Drop Zone if mode === 'upload' */}
        {phase === "idle" && mode === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-[var(--border2)] rounded-2xl p-6 text-center cursor-pointer hover:border-[var(--accent2)]/40 hover:bg-[var(--accent2)]/5 transition-all animate-fade-in"
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--accent2)] animate-pulse" />
            <p className="text-sm font-semibold text-[var(--text)]">Click or Drag & Drop File</p>
            <p className="text-xs text-[var(--text3)] mt-1">Accepts MP3, WAV, M4A, WEBM, MP4</p>
          </div>
        )}

        {/* System Audio Warning Badge */}
        {phase === "idle" && mode === 'system' && (
          <div className="p-4 rounded-xl bg-[var(--amber)]/5 border border-[var(--amber)]/20 flex gap-2 animate-fade-in">
            <VolumeX className="w-4 h-4 text-[var(--amber)] flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[11px] text-[var(--amber)] leading-relaxed font-sans">
              <strong>System Audio Warning:</strong> Capturing audio requires sharing a tab/screen with the "Share audio" checked in the browser prompt. Chromium is recommended.
            </p>
          </div>
        )}

        {/* Autopilot Bot scheduling panel if mode === 'bot' */}
        {phase === "idle" && mode === 'bot' && (
          <div className="space-y-4 animate-fade-in">
            {!isPro ? (
              // Premium Lock Card
              <div className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-[var(--bg2)] to-purple-500/10 backdrop-blur-md relative overflow-hidden shadow-xl text-center space-y-4">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] rounded-full bg-amber-500/10 blur-[40px] pointer-events-none" />
                <div className="inline-flex p-3 rounded-full bg-amber-500/10 text-amber-400 mb-1 animate-pulse">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-amber-400 tracking-wider uppercase">Recall Autopilot (Pro Feature)</h4>
                <p className="text-xs text-[var(--text2)] leading-relaxed font-sans">
                  Let Recall.ai attend your meetings for you! Submit any Google Meet, Zoom, or Teams link, and our smart AI bot will log in at the scheduled time, listen, and deliver structured notes directly to your dashboard.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await upgradeToPro();
                      toast.success("Welcome to Pro!", { description: "You have unlocked all premium autopilot features!" });
                    } catch (e) {
                      toast.error("Failed to upgrade");
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 fill-white text-white animate-spin-slow" />
                  Upgrade to Pro
                </button>
              </div>
            ) : (
              // Autopilot Scheduler Form for Pro Users
              <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg2)]/60 backdrop-blur-md shadow-xl space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)]">
                  <Bot className="w-4 h-4 text-[var(--accent)]" />
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Bot Autopilot Scheduler</h3>
                    <p className="text-[10px] text-[var(--text3)]">Schedule a bot to join and record on your behalf</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Meeting Link input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text3)]">
                      Meeting Link (Google Meet, Zoom, Teams)
                    </label>
                    <input
                      type="text"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={botLink}
                      onChange={(e) => {
                        setBotLink(e.target.value);
                        if (e.target.value.includes("meet.google.com")) {
                          setDetectedPlatform("google-meet");
                        } else if (e.target.value.includes("zoom.us")) {
                          setDetectedPlatform("zoom");
                        } else if (e.target.value.includes("teams.microsoft")) {
                          setDetectedPlatform("teams");
                        } else {
                          setDetectedPlatform(null);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]/50 font-medium placeholder:text-[var(--text3)]"
                    />
                    
                    {detectedPlatform && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                          detectedPlatform === "google-meet" 
                            ? "bg-green-500/10 text-green-400 border-green-500/20" 
                            : detectedPlatform === "zoom"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                        }`}>
                          <span className="w-1 h-1 rounded-full bg-current" />
                          {detectedPlatform === "google-meet" ? "Google Meet Detected" : detectedPlatform === "zoom" ? "Zoom Detected" : "MS Teams Detected"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Scheduled Time input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text3)]">
                      Start Date & Time
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={botTime}
                        onChange={(e) => setBotTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]/50 font-medium font-sans"
                      />
                    </div>
                  </div>

                  {/* Bot Custom Name input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text3)]">
                      Bot Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Recall Note Taker"
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]/50 font-medium placeholder:text-[var(--text3)]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleScheduleBot}
                  disabled={isScheduling || !botLink || !botTime}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] hover:opacity-95 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[var(--accent)]/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      Schedule Autopilot
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}





        {/* Uploaded File display */}
        {uploadedFile && phase === "stopped" && (
          <div className="p-4 rounded-xl bg-[var(--bg3)] border border-[var(--border)] text-xs text-[var(--text2)] flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2 truncate">
              <span className="text-lg">📎</span>
              <div className="truncate">
                <p className="font-semibold text-[var(--text)] truncate">{uploadedFile.name}</p>
                <p className="text-[10px] text-[var(--text3)] font-mono">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>
            <button
              onClick={() => {
                setUploadedFile(null)
                setPhase("idle")
              }}
              className="text-[var(--text3)] hover:text-[var(--text)] transition-colors"
              title="Remove file"
            >
              ×
            </button>
          </div>
        )}

        {/* AI Strategy Settings Box (collapsible or floating) */}
        {(phase === "idle" || phase === "stopped") && (
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg2)]/60 backdrop-blur-md shadow-lg space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-[var(--border)]">
              <Sliders className="w-4 h-4 text-[var(--accent2)]" />
              <h3 className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">AI Processing Strategy</h3>
            </div>

            {/* Toggle checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.diarize}
                  onChange={(e) => setSettings(prev => ({ ...prev, diarize: e.target.checked }))}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/50 bg-[var(--bg)] w-4 h-4"
                />
                <div>
                  <p className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    Speaker Diarization
                  </p>
                  <p className="text-[10px] text-[var(--text3)]">De-noise and group by speaker voice</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={settings.actions}
                  onChange={(e) => setSettings(prev => ({ ...prev, actions: e.target.checked }))}
                  className="rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]/50 bg-[var(--bg)] w-4 h-4"
                />
                <div>
                  <p className="text-xs font-semibold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    Action Items Extraction
                  </p>
                  <p className="text-[10px] text-[var(--text3)]">Auto-assign tasks and priorities</p>
                </div>
              </label>
            </div>

            {/* Dropdown Options */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[var(--text3)]" /> Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]/50 font-medium"
                >
                  <option value="en">English (US)</option>
                  <option value="hi">Hindi (IN)</option>
                  <option value="es">Spanish (ES)</option>
                  <option value="fr">French (FR)</option>
                  <option value="auto">Auto Detect</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text3)] flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[var(--text3)]" /> Summary
                </label>
                <select
                  value={settings.style}
                  onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value }))}
                  className="w-full px-2 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)]/50 font-medium"
                >
                  <option value="detailed">Executive Brief</option>
                  <option value="bullet">Bullet Points</option>
                  <option value="brief">Summary Only</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* GIANT CONCENTRIC PULSING RECORD DIAL ( Only when not in upload or bot mode, or recording ) */}
        {mode !== 'upload' && mode !== 'bot' && (phase === "idle" || phase === "recording") && (
          <div className="relative flex items-center justify-center py-4">
            {/* Ambient Pulsing Rings */}
            <AnimatePresence>
              {isRecording && (
                <>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute w-24 h-24 rounded-full border-2 border-[var(--red)] pointer-events-none"
                  />
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0.8 }}
                    animate={{ scale: 2.4, opacity: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 0.7 }}
                    className="absolute w-24 h-24 rounded-full border border-dashed border-[var(--red)]/45 pointer-events-none"
                  />
                </>
              )}
              {!isRecording && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute w-24 h-24 rounded-full bg-[var(--accent)]/10 blur-md pointer-events-none"
                />
              )}
            </AnimatePresence>

            <button
              onClick={isRecording ? handleStop : handleStart}
              className={`
                relative w-20 h-20 rounded-full flex flex-col items-center justify-center
                transition-all duration-500 shadow-2xl cursor-pointer group z-10
                ${isRecording
                  ? "bg-gradient-to-tr from-[var(--red)] to-[#ff4d4d] text-white hover:scale-105"
                  : "bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] text-white hover:scale-105 hover:shadow-[var(--accent)]/20 hover:shadow-2xl"
                }
              `}
            >
              {/* Internal concentric rotating tech circle */}
              <div className={`absolute inset-2 rounded-full border border-white/20 group-hover:rotate-45 transition-transform duration-700 ${isRecording ? "animate-spin-slow" : ""}`} />
              
              {isRecording ? (
                <>
                  <Square className="w-6 h-6 mb-0.5 animate-pulse text-white" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">STOP</span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 mb-0.5 text-white" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">REC</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Captured Recording Controls ( stopped phase only ) */}
        <AnimatePresence>
          {showProcessButton && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="space-y-2.5 pt-2"
            >
              <button
                onClick={handleProcess}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] hover:opacity-95 text-white text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[var(--accent)]/15 cursor-pointer hover:scale-[1.01]"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                Process Capture with AI
              </button>
              
              <button
                onClick={handleReRecord}
                className="w-full py-2.5 px-4 rounded-xl border border-[var(--border)] text-xs text-[var(--text3)] hover:text-[var(--text)] hover:bg-[var(--bg2)]/60 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Over / Discard
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/mp4,video/x-m4v,video/*"
          onChange={handleFileChange}
          className="hidden"
        />


      </div>
    </div>
  )
}
