"use client"

import { AudioRecorder } from "@/components/recorder/AudioRecorder"
import { ResultsPanel } from "@/components/results/ResultsPanel"

export default function DashboardPage() {
  return (
    <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
      {/* Left panel: Recorder */}
      <AudioRecorder />

      {/* Right panel: Results */}
      <ResultsPanel />
    </div>
  )
}
