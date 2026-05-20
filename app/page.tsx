import Link from "next/link"
import { Mic, Sparkles, FileText, CheckSquare, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold text-[var(--text)]" style={{ fontFamily: 'var(--font-serif)' }}>
            Recall.ai
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-[var(--text2)] hover:text-[var(--text)]">Log in</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent)]/90">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          AI-Powered Meeting Notes
        </div>

        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight text-[var(--text)] max-w-4xl"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          Focus on the meeting,{" "}
          <span className="text-[var(--accent)]">we&apos;ll take the notes.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--text2)] mt-6 max-w-2xl leading-relaxed">
          Record any meeting or lecture. Get instant AI transcripts, summaries, action items, and speaker insights — all in seconds.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 py-6 text-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 shadow-lg shadow-[var(--accent)]/20">
              Start Recording <Mic className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-4 mt-16">
          {[
            { icon: Mic, label: "Live Recording" },
            { icon: FileText, label: "AI Transcription" },
            { icon: Sparkles, label: "Smart Summaries" },
            { icon: CheckSquare, label: "Action Items" },
            { icon: Zap, label: "Instant Processing" },
          ].map(feat => (
            <div key={feat.label} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm text-[var(--text2)]">
              <feat.icon className="w-4 h-4 text-[var(--accent)]" />
              {feat.label}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
