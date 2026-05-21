"use client"

import { useCallback, useRef } from "react"
import { Mic, Upload, Monitor } from "lucide-react"
import type { RecorderMode } from "@/lib/types"

interface ModeSelectorProps {
  mode: RecorderMode
  onChange: (mode: RecorderMode) => void
  onFileSelect?: (file: File) => void
}

const MODES = [
  { id: 'mic' as const, icon: Mic, label: 'Mic' },
  { id: 'upload' as const, icon: Upload, label: 'Upload' },
  { id: 'system' as const, icon: Monitor, label: 'System Audio' },
]

export function ModeSelector({ mode, onChange, onFileSelect }: ModeSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleModeChange = useCallback((newMode: RecorderMode) => {
    onChange(newMode)
  }, [onChange])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && onFileSelect) {
      onFileSelect(file)
    }
  }, [onFileSelect])

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
        Input Mode
      </p>
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all
              ${mode === m.id
                ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
                : "text-[var(--text3)] hover:text-[var(--text2)]"
              }
            `}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* File upload drop zone */}
      {mode === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[var(--border2)] rounded-xl p-6 text-center cursor-pointer hover:border-[var(--accent)]/40 transition-colors"
        >
          <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--text3)]" />
          <p className="text-sm text-[var(--text2)]">Click or drag file here</p>
          <p className="text-xs text-[var(--text3)] mt-1">.mp3, .wav, .m4a, .webm, .mp4</p>
        </div>
      )}

      {/* System audio warning */}
      {mode === 'system' && (
        <div className="p-3 rounded-lg bg-[var(--amber)]/5 border border-[var(--amber)]/20">
          <p className="text-xs text-[var(--amber)]">
            ⚠ System audio capture requires a Chromium browser and screen share. Not all browsers support this.
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/mp4,video/x-m4v,video/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
