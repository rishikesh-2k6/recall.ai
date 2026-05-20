"use client"

import { AudioRecorder } from "@/components/recorder/AudioRecorder"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 overflow-y-auto overflow-x-hidden relative bg-[var(--bg)] min-h-[calc(100vh-4rem)]">
      {/* Spacious Full Screen Recording Station */}
      <AudioRecorder />
    </div>
  )
}
