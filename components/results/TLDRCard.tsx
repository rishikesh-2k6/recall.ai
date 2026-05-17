"use client"

import { Copy, Share2 } from "lucide-react"
import { toast } from "sonner"
import type { MeetingResult } from "@/lib/types"

interface TLDRCardProps {
  result: MeetingResult
}

export function TLDRCard({ result }: TLDRCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(result.tldr)
    toast.success("Summary copied to clipboard")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Summary</h3>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
            aria-label="Copy summary"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
            aria-label="Share summary"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-[var(--text2)] leading-relaxed">
        {result.tldr}
      </p>

      {/* Key quote highlight */}
      {result.keyQuote && (
        <blockquote className="border-l-2 border-[var(--accent)] pl-4 py-2 bg-[var(--accent)]/5 rounded-r-lg">
          <p className="text-sm italic text-[var(--accent2)]">
            &ldquo;{result.keyQuote}&rdquo;
          </p>
        </blockquote>
      )}
    </div>
  )
}
