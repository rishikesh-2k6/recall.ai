"use client"

interface TimerDisplayProps {
  value: string
  isRecording: boolean
}

export function TimerDisplay({ value, isRecording }: TimerDisplayProps) {
  return (
    <div className="text-center">
      <span
        className={`
          text-4xl font-mono tracking-tighter
          ${isRecording ? "text-[var(--red)]" : "text-[var(--text)]"}
        `}
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {value}
      </span>
      <p className="text-xs text-[var(--text3)] mt-1">
        {isRecording ? "Recording in progress..." : "Ready to record"}
      </p>
    </div>
  )
}
