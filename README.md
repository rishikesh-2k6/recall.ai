# Verbatim — Enterprise AI Meeting & Lecture Note Taker

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-v2-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Groq Whisper](https://img.shields.io/badge/Groq-Whisper_v3-7C6EF0?style=for-the-badge)](https://groq.com/)
[![NVIDIA Llama](https://img.shields.io/badge/NVIDIA-LLaMA_3-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://nvidia.com/)

**Focus on the meeting, we’ll take the notes.** A high-fidelity, split-panel web companion that captures room and system audio, processes smart speaker diarization, generates chronologues, extracts actionable tasks, and supports RAG-powered vector search across your history.

---
</div>

## 🌌 Overview

Verbatim is a premium Next.js and Supabase web application styled with vibrant HSL dark modes, responsive framer-motion micro-animations, and glassmorphic card overlays. It is designed to clone and enhance the iOS *Summary: AI Meeting Note Taker* app experience on the web. 

By integrating high-performance local compression with advanced serverless LLM pipelines, it processes minutes of dialogue in seconds, yielding structured summaries, checkable action items, speaker analytics, and seamless Notion sync.

---

## ✨ Features

### 🎤 Capture & Compression
* **Live Microphone Recording:** One-tap room audio capture with a real-time Web Audio API frequency waveform visualizer canvas.
* **Pre-recorded File Uploads:** Drop-in processing for `.mp3`, `.wav`, `.m4a`, `.webm`, and `.mp4` video/audio up to a secure **25 MB** boundary.
* **Active System Audio Recording:** Built-in loopback capture (screen audio) utilizing browser `getDisplayMedia` to record online conference calls (Google Meet, Zoom, MS Teams).
* **32kbps Mono Vocal Compression:** Integrates a client-side codec in `MediaRecorder` that slashes audio payloads by **up to 80%** while preserving vocal readability for AI speech-to-text.

### 🧠 AI Analytics Workspace
* **Chronological TLDR:** A concise paragraph summarizing core takeaways alongside a highlighted **Featured Key Quote**.
* **Speaker Diarization:** Diarizes conversations into color-coded speaker logs showing who spoke and when.
* **Checkable Action Items:** Interactive task checklist highlighting prioritization tags (`High`, `Medium`, `Low`) and contextually inferred task assignees.
* **Deep Insights Panel:** Comprehensive analytics capturing:
  * **Overall Sentiment:** Color-coded emotional index (🟢 *Aligned*, 🟡 *Uncertain*, 🔴 *Tense*, ⚪ *Neutral*).
  * **Roadmap Decisions Log:** Formal milestones, timelines, and commitments made.
  * **Potential Risks:** Warning list of roadblocks, technical debt, and schedule threats.
  * **Talk Ratio Metrics:** Interactive percentage-based participation charts.

### 🔍 History & RAG Semantic Search
* **Database Archiving:** Syncs all processed notes, audio logs, and metrics directly to a secure PostgreSQL Supabase DB.
* **Vault AI Semantic Search:** A built-in **RAG (Retrieval-Augmented Generation)** search engine. By typing questions ending with `?` (e.g., *“What did we decide about the budget?”*), Verbatim queries vector databases, feeds transcript contexts into LLaMA 3, and returns a synthesized paragraph-long answer.
* **Sentiment Filters:** Instantly filter your entire dashboard history using sentiment pill badges (*All / Aligned / Tense / Uncertain*).

### 🌐 Exports & Integrations
* **Copy-to-Clipboard Actions:** Separate triggers to copy the summary (GFM markdown), transcript (timestamped logs), or prioritized actions.
* **File Downloads:** Instant local exports in clean `.txt` or high-fidelity GitHub-Flavored Markdown `.md` sheets.
* **Notion Workspace Integration:** Connect and sync completed notes directly into your Notion database with automatic loading and success notifications.

---

## 🔒 Security Hardening

Verbatim has been rigorously audited and secured against modern web vulnerabilities:

| Severity | Vulnerability | Resolution |
| :---: | :--- | :--- |
| **Critical** | Route Access Bypass | Implemented root Next.js `middleware.ts` to block unauthorized users from `/dashboard`, `/meetings`, `/profile`, and `/upgrade`. |
| **Critical** | Billing Escalation | Disabled direct client-side DB writes for tier states. Created secure server-side `/api/account/upgrade` and `/api/account/downgrade` routes. |
| **Critical** | File Upload DOS | Added strict **25 MB** upload limits and dynamic MIME-type extensions filters in `/api/process-audio/route.ts`. |
| **High** | Open Redirect | Sanitized and validated `returnUrl` parameters inside route controllers. |
| **High** | Prompt Injection | Isolated system instructions from user inputs by packing raw transcript blocks inside strict `<transcript>` tags. |

---

## 🛠 Tech Stack

* **Frontend Framework:** Next.js 16 (App Router) + React 19 + TypeScript
* **Styling:** CSS-First Tailwind CSS + custom glassmorphic CSS variables
* **Database & Auth:** Supabase SSR Auth + PostgreSQL (pgvector support ready)
* **Audio Engineering:** HTML5 Web Audio API + `MediaRecorder` + Canvas `AnalyserNode`
* **Animations:** Framer Motion (staggered transitions, hover triggers, pulse loops)
* **Speech-to-Text (STT):** Groq API (Whisper-v3 Cloud Integration)
* **LLM Engine:** NVIDIA API (LLaMA 3 NIM)
* **Integrations:** Official Notion Workspace API Client

---

## 📁 Architecture Directory Map

```
/app
  /dashboard
    page.tsx                  ← Split-panel recording & details view
    layout.tsx                ← Sidebar + topbar layout wrapper
  /meetings
    page.tsx                  ← History explorer & Vault AI Search (RAG)
    /[id]                     ← Saved meeting detailed sheet & export actions
  /api
    /process-audio
      route.ts                ← Secure 25MB validation & Groq/Nvidia pipeline
    /account
      /upgrade                ← Server-side subscription validator
      /downgrade              ← Secure tier downgrade router
  layout.tsx                  ← Fonts, global CSS tokens, providers
  globals.css                 ← CSS design variables & base styles

/components
  /recorder
    AudioRecorder.tsx         ← Recorder coordinator
    WaveformCanvas.tsx        ← Frequency waveform visualizer
    RecordButton.tsx          ← Animated trigger button
    TimerDisplay.tsx          ← HH:MM:SS stopwatch
    ModeSelector.tsx          ← Mic / Upload / System selector
    RecorderSettings.tsx      ← AI parameters toggles
  /results
    ResultsPanel.tsx          ← Analytical tabs panel
    TLDRCard.tsx              ← Summaries & quote cards
    TranscriptView.tsx        ← Timestamped searchable dialogue
    ActionItemList.tsx        ← Interactive prioritized checklist
    InsightsPanel.tsx         ← Sentiment & talk ratio graphs
    SpeakerChips.tsx          ← Speaker identification badges
    StatsRow.tsx              ← Meet length, words, and speaker metrics
  /shared
    ProcessingState.tsx       ← Animated step timeline

/hooks
  useAudioRecorder.ts         ← Captures mic and system audio display stream
  useTimer.ts                 ← Session timer state
  useProcessAudio.ts          ← Pipes data to endpoints with loader triggers
```

---

## 🚀 Quick Start Guide

### Prerequisites
* [Node.js](https://nodejs.org/) v20+
* [Supabase CLI](https://supabase.com/docs/guides/cli) & [Docker](https://www.docker.com/)

### Setup Instructions

1. **Clone & Install Dependencies:**
   ```bash
   git clone https://github.com/DhanushSai-Chalasani/template-webapp.git
   cd template-webapp
   npm install
   ```

2. **Spin Up Local Database:**
   ```bash
   supabase start
   ```

3. **Configure Environment Keys:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   GROQ_API_KEY="your-groq-key-here"
   NVIDIA_API_KEY="your-nvidia-key-here"
   ```

4. **Run the Development Server:**
   Launch the development server:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser, log in, and begin capturing your notes.

---

## 🔌 API Contract

The frontend posts audio to `/api/process-audio` as `multipart/form-data`:

| Field Name | Type | Description |
| :--- | :---: | :--- |
| `audio` | File / Blob | Audio recording file (`audio/webm` format) |
| `name` | string | User-customized meeting or lecture name |
| `diarize` | boolean | Toggle multi-speaker identification on/off |
| `actions` | boolean | Toggle checklist action item extraction |
| `language` | string | Target speech language (`"en"`, `"hi"`, `"es"`, `"fr"`, `"auto"`) |
| `style` | string | Target summary layout style (`"brief"`, `"detailed"`, `"bullet"`) |

---

## 👥 Useful Command Console

```bash
npm run dev       # Start Next.js development server
npm run build     # Compile production optimized bundles
npm run lint      # Execute ESLint validations
supabase start    # Start local docker database
supabase stop     # Turn off local database
supabase studio   # Open browser Supabase administrator tool
```

---
*Created for the 8x Engineer Hiring Challenge. Built with premium standards by the Verbatim team. © 2026. All rights reserved.*
