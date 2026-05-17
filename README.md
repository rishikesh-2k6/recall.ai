# Verbatim — AI Meeting & Lecture Note Taker

> Record any meeting or lecture. Get instant AI-powered transcripts, summaries, action items, and speaker insights — all in seconds.

Verbatim is a dark-themed, split-panel web application that captures live audio (or accepts file uploads), transcribes it via **Groq Whisper**, summarises it via **NVIDIA Llama 3**, and presents structured notes with speaker diarization, action items, and AI-driven insights.

Built for the [8x Engineer](https://8x.engineer) Frontend Challenge — a clone of the [Summary: AI Meeting Note Taker](https://apps.apple.com/us/app/summary-ai-note-taker/id6670175056) app.

---

## ✨ Features

### Core
- **One-Tap Live Recording** — Capture room audio via browser microphone with a single button
- **Audio File Upload** — Import `.mp3`, `.wav`, `.m4a`, `.webm` files for processing
- **Real-Time Waveform** — Canvas-based visualizer with idle sine wave and active frequency bars (powered by Web Audio API `AnalyserNode`)
- **Live Timer** — HH:MM:SS stopwatch during recording

### AI Processing
- **Full Transcript** — Speaker-labeled, timestamped, word-for-word text via Groq Whisper-v3
- **TLDR & Summary** — Concise overview with optional key quote highlight
- **Action Items** — Prioritized checklist (high/medium/low) with assignee support and inline add
- **AI Insights** — Sentiment analysis, timeline risks, key decisions, and animated talk-ratio bars
- **Speaker Diarization** — Color-coded speaker chips with talk-time breakdown

### App Features
- **Meeting History** — Sidebar with recent meetings (backed by Supabase)
- **Searchable Transcript** — Client-side keyword search with highlight matching
- **Keyword Highlighting** — Auto-detects "deadline", "budget", "decision", "blocker", "action"
- **Export** — Copy TLDR / action items to clipboard, download `.txt` transcript
- **AI Settings Panel** — Toggle speaker diarization, action item extraction, select language (EN/HI/ES/FR/Auto), and summary style (Brief/Detailed/Bullet)
- **Meeting Templates** — Presets for standups, interviews, sales calls, and brainstorms

### Design
- **Dark Theme** — Premium deep-purple color system (`#0a0a0f` → `#7c6ef0`)
- **Typography** — DM Serif Display (headings) + Plus Jakarta Sans (body) + DM Mono (timestamps)
- **Animations** — Framer Motion staggered reveals, tab transitions, pulse rings, and processing step tracker
- **Mobile-Responsive** — Collapses to single-column on mobile viewports
- **Accessible** — ARIA labels on interactive elements, keyboard-navigable, color never sole indicator

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, Server Actions |
| Language | TypeScript | Type safety across the stack |
| Styling | Tailwind CSS + CSS Variables | Utility-first + dark theme tokens |
| Components | Shadcn/ui + Radix Primitives | Headless, composable, themed |
| Database | Supabase (PostgreSQL) | Auth + meeting storage |
| Audio | Browser `MediaRecorder` API | Zero-dependency recording |
| Waveform | HTML5 Canvas + Web Audio API | Real-time frequency visualization |
| Animations | Framer Motion | Smooth transitions and reveals |
| Transcription | Groq API (Whisper-v3) | Fast, accurate speech-to-text |
| Summarization | NVIDIA API (Llama 3) | TLDR, action items, insights extraction |
| Icons | Lucide React | Consistent stroke icons |
| Toasts | Sonner | Notification system |

---

## 📂 Project Structure

```
/app
  /dashboard
    page.tsx                  ← Main split-panel view
    layout.tsx                ← Sidebar + topbar shell
  /meetings
    page.tsx                  ← Meeting history list (planned)
  /api
    /process-audio
      route.ts                ← Backend AI pipeline (backend dev)
  layout.tsx                  ← Root layout (fonts, providers)
  globals.css                 ← CSS variables, base styles

/components
  /layout
    Sidebar.tsx               ← Navigation + recent meetings
    Topbar.tsx                ← Live badge + model badges
  /recorder
    AudioRecorder.tsx         ← Root recorder (state machine)
    WaveformCanvas.tsx        ← Canvas visualizer
    RecordButton.tsx          ← Animated record/stop button
    TimerDisplay.tsx          ← HH:MM:SS display
    ModeSelector.tsx          ← Mic / Upload / System tabs
    RecorderSettings.tsx      ← AI settings grid
  /results
    ResultsPanel.tsx          ← Tabbed results container
    TLDRCard.tsx              ← Summary + key quote
    TranscriptView.tsx        ← Searchable, highlighted transcript
    ActionItemList.tsx        ← Checkable action items
    InsightsPanel.tsx         ← Sentiment + risks + talk ratio
    SpeakerChips.tsx          ← Color-coded speaker badges
    StatsRow.tsx              ← Duration / Speakers / Words / Actions
  /shared
    ProcessingState.tsx       ← Animated step tracker
    EmptyState.tsx            ← Pre-recording placeholder

/hooks
  useAudioRecorder.ts         ← MediaRecorder logic
  useWaveform.ts              ← Canvas animation loop
  useTimer.ts                 ← Stopwatch logic
  useProcessAudio.ts          ← API call + step progress

/contexts
  meeting-context.tsx         ← Shared state (phase, result)

/lib
  types.ts                    ← All TypeScript interfaces
  utils.ts                    ← Formatters, speaker colors, cn()
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local DB)
- [Docker](https://www.docker.com/) (for local Supabase)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/DhanushSai-Chalasani/template-webapp.git
   cd template-webapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local Supabase**
   ```bash
   supabase start
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54521"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
   SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
   GROQ_API_KEY="<your-groq-key>"
   NVIDIA_API_KEY="<your-nvidia-key>"
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000) → click **"Start Recording"** → go to `/dashboard`

---

## 🔌 API Contract

The frontend sends audio to `POST /api/process-audio` as `multipart/form-data`:

| Field | Type | Description |
|---|---|---|
| `audio` | Blob | Audio file (audio/webm) |
| `name` | string | Meeting name |
| `diarize` | boolean | Enable speaker diarization |
| `actions` | boolean | Extract action items |
| `language` | string | `"en"`, `"hi"`, `"es"`, `"fr"`, `"auto"` |
| `style` | string | `"brief"`, `"detailed"`, `"bullet"` |

The backend returns a `MeetingResult` JSON (see `lib/types.ts` for the full interface).

---

## 👥 Team

| Role | Scope |
|---|---|
| **Frontend Developer** | Dashboard UI, audio recording, results display, animations |
| **Backend Developer** | `/api/process-audio` route, Groq/Whisper transcription, NVIDIA/Llama 3 summarization, Supabase storage |

---

## 📝 Useful Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
supabase start    # Start local Supabase
supabase stop     # Stop local Supabase
supabase studio   # Open Supabase Studio
```

---

## 📄 License

Built for the 8x Engineer Hiring Challenge. Uses the [8x Hiring Template](https://github.com/8xsocial/template-webapp) as the foundation.
