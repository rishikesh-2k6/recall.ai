"use client"

import { Copy, Share2, Download } from "lucide-react"
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

  const handleDownload = () => {
    try {
      const header = `${result.name}\nDate: ${new Date().toLocaleDateString()}\n\n─── MEETING SUMMARY ───\n`
      const summaryContent = result.tldr
      const keyQuoteContent = result.keyQuote ? `\n\n─── KEY QUOTE ───\n"${result.keyQuote}"\n` : ""
      
      const content = header + summaryContent + keyQuoteContent
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${result.name.replace(/\s+/g, "_")}_summary.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Summary downloaded successfully as TXT file!")
    } catch (err) {
      console.error("Failed to download summary:", err)
      toast.error("Failed to download summary")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Summary</h3>
        <div className="flex gap-1">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
            aria-label="Download summary as TXT"
            title="Download summary as TXT"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
            aria-label="Copy summary"
            title="Copy summary"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-[var(--bg3)] text-[var(--text3)] hover:text-[var(--text)] transition-colors"
            aria-label="Share summary"
            title="Share summary"
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
