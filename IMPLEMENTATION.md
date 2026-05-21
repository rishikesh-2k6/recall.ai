# Recall.ai — Frontend Implementation Plan
> AI Meeting & Lecture Note-Taker · Next.js + Tailwind + Shadcn + Supabase + Groq + NVIDIA

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Phase 0 — Setup & Bootstrap](#phase-0--setup--bootstrap)
5. [Phase 1 — Layout Shell](#phase-1--layout-shell)
6. [Phase 2 — AudioRecorder Component](#phase-2--audiorecorder-component)
7. [Phase 3 — Results Dashboard](#phase-3--results-dashboard)
8. [Phase 4 — Extra Features](#phase-4--extra-features)
9. [Phase 5 — Polish & Animations](#phase-5--polish--animations)
10. [Component Reference](#component-reference)
11. [State Management](#state-management)
12. [Design Tokens](#design-tokens)
13. [API Contract](#api-contract)
14. [Testing Checklist](#testing-checklist)

---

## 1. Project Overview

Recall.ai is a dark-themed, split-panel web app that:
- Records audio from the user's microphone (or accepts file uploads)
- Sends audio to a backend API route that transcribes via **Groq Whisper** and summarises via **NVIDIA Llama 3**
- Displays a live animated waveform, TLDR, speaker-diarized transcript, action items, and AI insights
- Saves all meeting data to **Supabase** and shows a history sidebar

Your role is **Frontend Developer**. You own everything below `/app`, `/components`, `/hooks`, and `/styles`. The Backend Developer owns `/app/api/process-audio/`.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | File-based routing, Server Actions, streaming |
| Styling | Tailwind CSS + CSS Variables | Utility-first + dark theme tokens |
| Components | Shadcn/ui | Headless, composable, already themed |
| Database client | Supabase JS v2 | Auth + Realtime + storage |
| Audio | Browser `MediaRecorder` API | Zero dependencies |
| Waveform | HTML5 Canvas (custom hook) | Full control, zero deps |
| Animations | Framer Motion | Staggered reveals, smooth transitions |
| State | React `useState` + `useReducer` | Local; no Redux needed |
| Forms | React Hook Form + Zod | Validation for settings |
| Icons | Lucide React | Consistent stroke icons |
| Font | DM Serif Display + Plus Jakarta Sans + DM Mono | Via `next/font/google` |

---

## 3. Folder Structure

```
/app
  /dashboard
    page.tsx                  ← Main split-panel view
    layout.tsx                ← Sidebar + topbar shell
  /meetings
    page.tsx                  ← Meeting history list
    /[id]
      page.tsx                ← Single meeting view
  /api
    /process-audio
      route.ts                ← Backend (not your concern)
  layout.tsx                  ← Root layout (fonts, providers)
  globals.css                 ← CSS variables, base styles

/components
  /layout
    Sidebar.tsx
    Topbar.tsx
  /recorder
    AudioRecorder.tsx         ← Root recorder component
    WaveformCanvas.tsx        ← Canvas waveform visualizer
    RecordButton.tsx          ← Animated record/stop button
    TimerDisplay.tsx          ← HH:MM:SS display
    ModeSelector.tsx          ← Mic / Upload / System tabs
    RecorderSettings.tsx      ← AI settings grid
  /results
    ResultsPanel.tsx          ← Tabbed results container
    TLDRCard.tsx
    TranscriptView.tsx
    ActionItemList.tsx
    InsightsPanel.tsx
    SpeakerChips.tsx
    StatsRow.tsx
  /shared
    ProcessingState.tsx       ← Spinner + step tracker
    EmptyState.tsx
    Badge.tsx
    IconButton.tsx

/hooks
  useAudioRecorder.ts         ← MediaRecorder logic
  useWaveform.ts              ← Canvas animation loop
  useTimer.ts                 ← Stopwatch logic
  useMeeting.ts               ← Supabase fetch/save
  useProcessAudio.ts          ← API call + polling

/lib
  supabase.ts                 ← Supabase client
  types.ts                    ← All TypeScript interfaces
  utils.ts                    ← Formatters, helpers

/styles
  tokens.css                  ← Design token overrides
```

---

## Phase 0 — Setup & Bootstrap

### 0.1 Clone the template

```bash
git clone https://github.com/DhanushSai-Chalasani/Recall.ai.git .
npm install
```

### 0.2 Install additional frontend deps

```bash
npm install framer-motion lucide-react react-hook-form zod
npm install @radix-ui/react-tabs @radix-ui/react-tooltip
```

### 0.3 Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
GROQ_API_KEY=your_groq_key           # backend only
NVIDIA_API_KEY=your_nvidia_key       # backend only
```

### 0.4 Configure fonts in `app/layout.tsx`

```tsx
import { DM_Serif_Display, Plus_Jakarta_Sans, DM_Mono } from 'next/font/google'

const serif = DM_Serif_Display({ subsets: ['latin'], weight: ['400'], variable: '--font-serif' })
const sans  = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','600'], variable: '--font-sans' })
const mono  = DM_Mono({ subsets: ['latin'], weight: ['400','500'], variable: '--font-mono' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### 0.5 Set up CSS variables in `globals.css`

```css
:root {
  --bg:           #0a0a0f;
  --bg2:          #111118;
  --bg3:          #1a1a24;
  --card:         #13131d;
  --card2:        #1c1c28;
  --border:       rgba(255,255,255,0.07);
  --border2:      rgba(255,255,255,0.12);
  --accent:       #7c6ef0;
  --accent2:      #a594f9;
  --red:          #f05c5c;
  --green:        #4ade80;
  --amber:        #fbbf24;
  --text:         #e8e6f0;
  --text2:        #8e8ca0;
  --text3:        #5c5a70;
}
```

---

## Phase 1 — Layout Shell

**Goal:** Get the split-panel shell rendering with sidebar + topbar.

### 1.1 `Sidebar.tsx`

- Logo: icon + "Recall.ai" in serif font
- Nav items: Record, Meetings, Search, Analytics, Integrations
- Recent meetings list (fetched from Supabase — see `useMeeting` hook)
- User avatar + name at bottom (from Supabase auth session)
- Active nav item has a left-border accent (`border-l-2 border-[var(--accent)]`)

```tsx
// Key markup pattern
<nav className="w-[240px] flex flex-col border-r border-[var(--border)] bg-[var(--bg2)]">
  <SidebarLogo />
  <NavItems />
  <MeetingHistory meetings={recentMeetings} />
  <UserFooter />
</nav>
```

### 1.2 `Topbar.tsx`

Props: `meetingName`, `isLive`, `modelBadges`

- Left: serif meeting title
- Right: Live badge (animated red dot, shown only when `isLive`), model badges (Whisper-v3, Llama 3), user avatar
- Live badge uses `animate-pulse` via Tailwind

### 1.3 `app/dashboard/layout.tsx`

```tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Phase 2 — AudioRecorder Component

This is the most complex front-end piece. Build in this order:

### 2.1 `useTimer.ts` hook

```ts
// Returns: { seconds, formatted, isRunning, start, stop, reset }
// formatted = "HH:MM:SS" string
// Uses setInterval, cleans up on unmount
```

### 2.2 `useWaveform.ts` hook

```ts
// Takes: canvasRef, isRecording
// Idle state: gentle sine wave, muted color, requestAnimationFrame loop
// Active state: bar visualizer using AnalyserNode data (or simulated bars if no real audio)
// Returns: { startVisualizer, stopVisualizer }
//
// Real audio path:
//   navigator.mediaDevices.getUserMedia({ audio: true })
//   → AudioContext → MediaStreamSource → AnalyserNode
//   → analyser.getByteFrequencyData(dataArray) in the animation loop
//   → draw bars scaled by dataArray values
```

**Canvas draw loop (active recording):**
```ts
function draw() {
  analyser.getByteFrequencyData(dataArray)
  ctx.clearRect(0, 0, w, h)
  const bars = 48
  const barWidth = w / bars
  for (let i = 0; i < bars; i++) {
    const amplitude = dataArray[i * 3] / 255   // sample every 3rd bin
    const barH = amplitude * h * 0.8
    // gradient fill: accent top → accent/40 bottom
    ctx.fillRect(i * barWidth + 2, h/2 - barH/2, barWidth - 4, barH)
  }
  animFrameRef.current = requestAnimationFrame(draw)
}
```

### 2.3 `useAudioRecorder.ts` hook

```ts
// Returns: { isRecording, audioBlob, start, stop, error }
// 
// start():
//   → getUserMedia({ audio: true })
//   → new MediaRecorder(stream, { mimeType: 'audio/webm' })
//   → mediaRecorder.start()
//   → collect chunks in ondataavailable
//
// stop():
//   → mediaRecorder.stop()
//   → onstop: new Blob(chunks, { type: 'audio/webm' })
//   → set audioBlob state
//   → stop all stream tracks
```

### 2.4 `RecordButton.tsx`

States: `idle` | `recording` | `processing`

```tsx
// Idle: purple square icon, ring hover effect
// Recording: red circle icon, pulsing outer ring animation
// Processing: spinner

// CSS: pulse ring via @keyframes or Framer Motion
// onClick calls: isRecording ? stop() : start()
```

Animation (use Framer Motion `animate` prop):
```tsx
<motion.div
  animate={isRecording ? { scale: [1, 1.05, 1], opacity: [0.4, 0, 0.4] } : {}}
  transition={{ duration: 2, repeat: Infinity }}
  className="absolute inset-[-16px] rounded-full border border-[var(--red)]"
/>
```

### 2.5 `ModeSelector.tsx`

Three pill buttons: Mic | Upload | System Audio

- "Upload" mode: shows a `<input type="file" accept="audio/*">` drag-drop zone
- "System Audio" mode: shows a note that this requires desktop capture API (show browser support warning)

### 2.6 `RecorderSettings.tsx`

2×2 grid of toggle cards:

| Setting | Default | Behaviour |
|---|---|---|
| Speaker Diarize | On | Sends `diarize: true` to API |
| Action Items | On | Sends `extract_actions: true` to API |
| Language | English | Dropdown: English, Hindi, Spanish, French, Auto |
| Summary Style | Detailed | Dropdown: Brief, Detailed, Bullet |

### 2.7 `AudioRecorder.tsx` — root component

Composes all of the above. Manages local state machine:

```
idle → recording → stopped → processing → complete
                ↑___________↓ (re-record)
```

```tsx
export default function AudioRecorder({ onComplete }) {
  const { isRecording, audioBlob, start, stop } = useAudioRecorder()
  const { seconds, formatted, startTimer, stopTimer } = useTimer()
  const canvasRef = useRef(null)
  useWaveform(canvasRef, isRecording)

  const [phase, setPhase] = useState<'idle'|'recording'|'stopped'|'processing'>('idle')
  const [meetingName, setMeetingName] = useState('New Meeting')
  const [settings, setSettings] = useState({ diarize: true, actions: true, language: 'en', style: 'detailed' })

  async function handleStart() { await start(); startTimer(); setPhase('recording') }
  async function handleStop()  { await stop();  stopTimer();  setPhase('stopped')   }
  async function handleProcess() {
    setPhase('processing')
    const result = await processAudio(audioBlob, settings)
    onComplete(result)
  }

  return (
    <section className="w-[340px] flex flex-col gap-5 p-7 border-r border-[var(--border)]">
      <RecorderHeader name={meetingName} onNameChange={setMeetingName} />
      <WaveformCanvas ref={canvasRef} isRecording={isRecording} />
      <TimerDisplay value={formatted} isRecording={isRecording} />
      <RecordButton phase={phase} onStart={handleStart} onStop={handleStop} />
      <ModeSelector />
      <RecorderSettings settings={settings} onChange={setSettings} />
      {phase === 'stopped' && (
        <button onClick={handleProcess} className="btn-primary">✨ Process Meeting</button>
      )}
    </section>
  )
}
```

---

## Phase 3 — Results Dashboard

### 3.1 `useProcessAudio.ts` hook

```ts
// Takes: audioBlob, settings
// Returns: { isProcessing, steps, result, error, process }
//
// process():
//   → FormData with audio blob + settings
//   → fetch('/api/process-audio', { method: 'POST', body: formData })
//   → Response is JSON: { transcript, tldr, actionItems, speakers, insights }
//   → Simulate step progress client-side (or read from SSE if backend streams)
//
// steps: ['captured', 'transcribing', 'analysing', 'extracting', 'saving']
// stepStatus: 'pending' | 'active' | 'done'
```

### 3.2 `ProcessingState.tsx`

Animated step list. Each step transitions `pending → active → done`.

```tsx
const stepLabels = {
  captured:    'Audio captured',
  transcribing:'Transcribing (Groq Whisper)',
  analysing:   'Analysing (Llama 3)',
  extracting:  'Extracting action items',
  saving:      'Saving to database',
}
```

Use Framer Motion `AnimatePresence` + `motion.div` for step state transitions.

### 3.3 `StatsRow.tsx`

Displays 4 stat cards in a row: Duration | Speakers | Words | Action Items

```tsx
// Data comes from the API response
// Format duration: seconds → "28:42"
// Word count: transcript.split(' ').length
```

### 3.4 `SpeakerChips.tsx`

One chip per detected speaker. Each chip shows:
- Initials avatar (color auto-assigned from a palette of 6)
- Speaker label ("Speaker 1" or diarized name)
- Talk time in `MM:SS`

```tsx
const SPEAKER_COLORS = ['#7c6ef0', '#f05c5c', '#4ade80', '#fbbf24', '#22d3ee', '#f97316']
// assign by index: speakers.map((s, i) => ({ ...s, color: SPEAKER_COLORS[i % 6] }))
```

### 3.5 `TLDRCard.tsx`

- Title: "Summary"
- Body: `result.tldr` paragraph text
- Highlighted quote block (if `result.keyQuote` exists): left border accent, italic, accent2 color
- Copy button → `navigator.clipboard.writeText(result.tldr)`
- Export button → opens share sheet (future)

### 3.6 `TranscriptView.tsx`

```tsx
// Scrollable container (max-height: 320px, overflow-y: auto)
// Each line: Speaker name (colored by speaker index) | timestamp | text
// Clicking a line → emits onSeek(timestamp) for audio playback (Phase 4)
// Search bar filters lines by text match (client-side)
```

TypeScript interface:
```ts
interface TranscriptLine {
  speaker: string
  timestamp: number   // seconds from start
  text: string
}
```

### 3.7 `ActionItemList.tsx`

```tsx
// Each ActionItem:
interface ActionItem {
  id: string
  text: string
  assignee?: string
  priority: 'high' | 'medium' | 'low'
  done: boolean
}

// Interactions:
// - Checkbox toggles done state (optimistic update → Supabase upsert)
// - Priority badge: high=red, medium=amber, low=purple
// - "Add action item" button at bottom opens inline input

// Keyboard: Enter to save new item, Escape to cancel
```

### 3.8 `InsightsPanel.tsx`

Displays:
1. **Timeline Risk** — derived from keywords like "tight", "delay", "blocked" in transcript
2. **Decision Pending** — items where no owner is assigned
3. **Sentiment** — "Aligned" / "Tense" / "Uncertain" from API
4. **Talk Ratio** — bar chart per speaker (horizontal bars, color-coded)

### 3.9 `ResultsPanel.tsx` — root

```tsx
// Tab strip: TLDR | Transcript | Action Items | Insights
// Uses Shadcn <Tabs> component
// Shows EmptyState when no result yet
// Shows ProcessingState during API call
// Framer Motion AnimatePresence for tab switching

export default function ResultsPanel({ phase, result, steps }) {
  if (phase === 'idle')       return <EmptyState />
  if (phase === 'processing') return <ProcessingState steps={steps} />
  return (
    <div className="flex-1 p-7 overflow-y-auto">
      <StatsRow stats={result.stats} />
      <SpeakerChips speakers={result.speakers} />
      <Tabs defaultValue="tldr">
        <TabsList>…</TabsList>
        <TabsContent value="tldr">      <TLDRCard      result={result} /></TabsContent>
        <TabsContent value="transcript"><TranscriptView lines={result.transcript} /></TabsContent>
        <TabsContent value="actions">   <ActionItemList items={result.actionItems} /></TabsContent>
        <TabsContent value="insights">  <InsightsPanel  insights={result.insights} /></TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Phase 4 — Extra Features

Build these after the core flow is working.

### 4.1 Real-time Transcript Streaming

Instead of waiting for the full API response, stream text via Server-Sent Events (SSE):

```ts
// In useProcessAudio.ts:
const source = new EventSource('/api/process-audio/stream?id=jobId')
source.onmessage = (e) => {
  const { type, content } = JSON.parse(e.data)
  if (type === 'transcript_chunk') appendTranscript(content)
  if (type === 'complete') { source.close(); setResult(content) }
}
```

Display rolling transcript in `TranscriptView` with a blinking cursor at the end.

### 4.2 Audio Playback

```tsx
// Add a hidden <audio> element in AudioRecorder.tsx
// When recording stops: audioEl.src = URL.createObjectURL(audioBlob)
// TranscriptView emits onSeek(seconds) → audioEl.currentTime = seconds; audioEl.play()
// Mini playback bar in results header: play/pause, scrubber, time
```

### 4.3 Meeting History Page (`/meetings`)

```tsx
// Fetch all meetings for current user from Supabase:
// select('*').from('meetings').eq('user_id', user.id).order('created_at', { ascending: false })

// Display as a card grid:
// Title | Date | Duration | Speaker count | Excerpt of TLDR
// Click → /meetings/[id]

// Filter bar: by date range, by speaker, search by keyword
```

Supabase table schema (pass this to your backend dev):
```sql
create table meetings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id),
  name        text not null,
  duration    integer,           -- seconds
  transcript  jsonb,             -- array of TranscriptLine
  tldr        text,
  action_items jsonb,            -- array of ActionItem
  speakers    jsonb,             -- array of Speaker
  insights    jsonb,
  created_at  timestamptz default now()
);
```

### 4.4 Smart Meeting Name

After transcription, auto-suggest a meeting name:
```ts
// In onComplete handler:
if (meetingName === 'New Meeting') {
  const suggested = result.suggestedTitle   // returned by backend LLM prompt
  setMeetingName(suggested)
}
```

### 4.5 Export / Share

Add an Export dropdown to the Topbar (when results are loaded):
- **Copy TLDR** → clipboard
- **Copy Action Items** → formatted markdown list
- **Download .txt** → full transcript as plain text
- **Open in Notion** (future) → Notion API integration
- **Post to Slack** (future) → Slack webhook

```tsx
// Use Shadcn <DropdownMenu> for the export menu
// For .txt download:
const blob = new Blob([transcript], { type: 'text/plain' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url; a.download = `${meetingName}.txt`; a.click()
```

### 4.6 Keyword Highlights

In `TranscriptView`, wrap detected keywords with a highlight span:
```tsx
const HIGHLIGHT_PATTERNS = [/deadline/gi, /budget/gi, /decision/gi, /action/gi, /blocker/gi]

function highlightText(text: string) {
  // returns React elements with <mark> tags around matched words
}
```

### 4.7 Meeting Templates

Add template presets to `RecorderSettings`:
```ts
const TEMPLATES = {
  standup:   { prompt: 'Extract: blockers, completed, planned today', style: 'brief' },
  interview: { prompt: 'Extract: candidate answers, interviewer questions, evaluation notes', style: 'detailed' },
  sales:     { prompt: 'Extract: pain points, budget signals, next steps, objections', style: 'detailed' },
  brainstorm:{ prompt: 'Extract: ideas proposed, decisions made, parking lot items', style: 'bullet' },
}
```

---

## Phase 5 — Polish & Animations

### 5.1 Page load stagger

In `ResultsPanel`, wrap each section in Framer Motion:
```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.08 }}
>
```

### 5.2 Waveform idle → active transition

Smooth crossfade between sine wave and bar visualizer using canvas `globalAlpha` fade.

### 5.3 Record button pulse ring

```tsx
// Framer Motion keyframes for the outer ring when recording:
animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
```

### 5.4 Processing step transitions

Use Framer Motion `AnimatePresence` so each step icon cross-fades between ○ → ⟳ → ✓

### 5.5 Tab switch animation

```tsx
<AnimatePresence mode="wait">
  <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
    {tabContent}
  </motion.div>
</AnimatePresence>
```

### 5.6 Toast notifications

Use Shadcn `<Sonner>` (or `<Toast>`):
- "Meeting saved to database ✓" after processing
- "Copied to clipboard" after copy actions
- "Error processing audio — please try again" on API failure

---

## Component Reference

| Component | Props | Emits |
|---|---|---|
| `AudioRecorder` | — | `onComplete(MeetingResult)` |
| `WaveformCanvas` | `isRecording: bool` | — |
| `RecordButton` | `phase`, `onStart`, `onStop` | click handlers |
| `TimerDisplay` | `value: string`, `isRecording: bool` | — |
| `ModeSelector` | `mode`, `onChange` | — |
| `RecorderSettings` | `settings`, `onChange` | — |
| `ResultsPanel` | `phase`, `result?`, `steps?` | — |
| `TLDRCard` | `result: MeetingResult` | — |
| `TranscriptView` | `lines: TranscriptLine[]` | `onSeek(seconds)` |
| `ActionItemList` | `items: ActionItem[]` | `onChange(items)` |
| `InsightsPanel` | `insights: Insights` | — |
| `SpeakerChips` | `speakers: Speaker[]` | — |
| `StatsRow` | `stats: MeetingStats` | — |
| `ProcessingState` | `steps: StepStatus[]` | — |

---

## State Management

No Redux. Use component-local state + React Context for shared meeting state.

```tsx
// MeetingContext.tsx
interface MeetingContextType {
  phase: 'idle' | 'recording' | 'stopped' | 'processing' | 'complete'
  result: MeetingResult | null
  processingSteps: StepStatus[]
  setPhase: (p: Phase) => void
  setResult: (r: MeetingResult) => void
}

// Wrap dashboard page in <MeetingProvider>
// AudioRecorder and ResultsPanel both consume this context
```

---

## Design Tokens

Reference these in your Tailwind classes as `bg-[var(--bg)]` etc:

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0a0f` | Page background |
| `--bg2` | `#111118` | Sidebar background |
| `--card` | `#13131d` | Card surface |
| `--card2` | `#1c1c28` | Nested card / input bg |
| `--accent` | `#7c6ef0` | Primary brand purple |
| `--accent2` | `#a594f9` | Lighter purple, text accents |
| `--red` | `#f05c5c` | Recording indicator, high priority |
| `--green` | `#4ade80` | Done states, Llama badge |
| `--amber` | `#fbbf24` | Medium priority, warnings |
| `--text` | `#e8e6f0` | Primary text |
| `--text2` | `#8e8ca0` | Secondary text |
| `--text3` | `#5c5a70` | Muted / label text |
| `--border` | `rgba(255,255,255,0.07)` | Subtle dividers |
| `--border2` | `rgba(255,255,255,0.12)` | Hover borders |
| `--font-serif` | DM Serif Display | Headings, logo |
| `--font-sans` | Plus Jakarta Sans | All body text |
| `--font-mono` | DM Mono | Timer, timestamps |

---

## API Contract

> Agree this interface with your Backend Developer before Phase 3.

**Request:**
```
POST /api/process-audio
Content-Type: multipart/form-data

audio:    Blob (audio/webm)
name:     string
diarize:  boolean
actions:  boolean
language: string   ("en" | "hi" | "es" | "fr" | "auto")
style:    string   ("brief" | "detailed" | "bullet")
```

**Response:**
```ts
interface MeetingResult {
  id: string
  name: string
  stats: {
    duration: number          // seconds
    speakerCount: number
    wordCount: number
    actionItemCount: number
  }
  speakers: Array<{
    id: string
    label: string             // "Speaker 1" or diarized name
    talkTime: number          // seconds
  }>
  transcript: Array<{
    speaker: string
    timestamp: number         // seconds
    text: string
  }>
  tldr: string
  keyQuote?: string           // optional most important quote
  suggestedTitle?: string     // auto meeting name
  actionItems: Array<{
    id: string
    text: string
    assignee?: string
    priority: 'high' | 'medium' | 'low'
    done: false
  }>
  insights: {
    sentiment: 'aligned' | 'tense' | 'uncertain' | 'neutral'
    risks: string[]
    decisions: string[]
    talkRatio: Record<string, number>  // speakerId → percentage
  }
}
```

**Error response:**
```ts
{ error: string, code: 'TRANSCRIPTION_FAILED' | 'LLM_ERROR' | 'AUTH_ERROR' }
```

---

## Testing Checklist

### Automated (before every PR)
- [ ] `npm run build` — no TypeScript errors
- [ ] `npm run lint` — no ESLint errors
- [ ] All component props have TypeScript types

### Manual (core flow)
- [ ] Log in via Supabase auth
- [ ] Record a 30-second clip
- [ ] Timer increments correctly
- [ ] Waveform animates during recording
- [ ] "Stop" transitions to "Process" button
- [ ] Processing steps animate in sequence
- [ ] TLDR tab displays summary text
- [ ] Transcript tab shows speaker-colored lines
- [ ] Action items can be checked off
- [ ] Insights tab shows talk ratio bars
- [ ] Meeting appears in sidebar history after save

### Manual (edge cases)
- [ ] Microphone permission denied → shows helpful error state
- [ ] API returns error → toast error, stays on stopped phase
- [ ] No speakers detected (solo recording) → graceful fallback
- [ ] Very short recording (<5 seconds) → handles empty transcript
- [ ] File upload mode → accepts `.mp3`, `.wav`, `.m4a`, `.webm`
- [ ] Mobile viewport (375px) → recorder panel collapses to full-width

### Accessibility
- [ ] All interactive elements reachable via Tab key
- [ ] Record button has `aria-label` that changes with state
- [ ] Color is never the sole indicator (priority tags have text labels)
- [ ] Waveform canvas has `role="img" aria-label="Audio waveform"`

---

*Last updated: May 2026 · Recall.ai v1.0 Frontend Implementation Plan*
