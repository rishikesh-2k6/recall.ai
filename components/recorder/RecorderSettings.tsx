"use client"

import type { RecorderSettings as Settings } from "@/lib/types"

interface RecorderSettingsProps {
  settings: Settings
  onChange: (settings: Settings) => void
}

export function RecorderSettings({ settings, onChange }: RecorderSettingsProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text3)]">
        AI Settings
      </p>
      <div className="grid grid-cols-2 gap-2">
        {/* Speaker Diarize */}
        <button
          onClick={() => update('diarize', !settings.diarize)}
          className={`
            p-3 rounded-lg border text-left transition-all text-xs
            ${settings.diarize
              ? "bg-[var(--accent)]/5 border-[var(--accent)]/20 text-[var(--accent)]"
              : "bg-[var(--bg)] border-[var(--border)] text-[var(--text3)]"
            }
          `}
        >
          <p className="font-semibold">Speaker ID</p>
          <p className="text-[10px] mt-0.5 opacity-70">{settings.diarize ? "On" : "Off"}</p>
        </button>

        {/* Action Items */}
        <button
          onClick={() => update('actions', !settings.actions)}
          className={`
            p-3 rounded-lg border text-left transition-all text-xs
            ${settings.actions
              ? "bg-[var(--accent)]/5 border-[var(--accent)]/20 text-[var(--accent)]"
              : "bg-[var(--bg)] border-[var(--border)] text-[var(--text3)]"
            }
          `}
        >
          <p className="font-semibold">Action Items</p>
          <p className="text-[10px] mt-0.5 opacity-70">{settings.actions ? "On" : "Off"}</p>
        </button>

        {/* Language */}
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <p className="font-semibold text-xs text-[var(--text2)] mb-1">Language</p>
          <select
            value={settings.language}
            onChange={(e) => update('language', e.target.value)}
            className="w-full bg-transparent text-xs text-[var(--text)] focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="auto">Auto-detect</option>
          </select>
        </div>

        {/* Summary Style */}
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <p className="font-semibold text-xs text-[var(--text2)] mb-1">Style</p>
          <select
            value={settings.style}
            onChange={(e) => update('style', e.target.value)}
            className="w-full bg-transparent text-xs text-[var(--text)] focus:outline-none cursor-pointer"
          >
            <option value="detailed">Detailed</option>
            <option value="brief">Brief</option>
            <option value="bullet">Bullet</option>
          </select>
        </div>
      </div>
    </div>
  )
}
