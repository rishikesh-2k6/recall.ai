# 🛠 Verbatim AI Master Backend Blueprint
**The Single Source of Truth for the Backend Engineer**

The frontend of Verbatim is 100% complete and fully operational. By default, it runs in a "Demo Mode" that intercepts API calls and returns mockup data. Your goal is to build the actual APIs to process real audio files, host the background automated meeting bot, query the AI models, save the data to a database, and power all the advanced AI features.

---

## 🛠 Complete Technical Stack
*   **Web Framework:** Next.js Serverless Routes (`app/api/...`) OR a dedicated Python FastAPI server. (Next.js serverless is recommended for routes, with a dedicated Node/Python background VM for bot execution).
*   **Speech-to-Text:** [Groq API](https://groq.com/) (Whisper-large-v3) - For blazing-fast audio transcription.
*   **LLM Processing:** [NVIDIA NIM APIs](https://build.nvidia.com/) (Llama-3.1-70B-Instruct) - For summarization, action item extraction, and meeting insights.
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL) - For storing meeting history, user profiles, and subscriptions.
*   **Vector DB / RAG:** Supabase pgvector (using `sentence-transformers/all-MiniLM-L6-v2` or Hugging Face Inference) for the "Vault AI Search".
*   **Queue Scheduler:** Redis with BullMQ (Node.js) or Celery (Python) for background bot processing.
*   **Automated Bot VM:** Always-Free Oracle Cloud ARM VM running Playwright headless Chromium instances in Docker containers.
*   **Autopilot AI Engine:** Google Gemini 1.5 Flash API (multimodal audio upload for zero-cost speaker-diarized transcription and synthesis).

---

## 🗄 1. Database Schema Migrations

Ensure your Supabase PostgreSQL instance has the following tables and Row-Level Security (RLS) policies configured. Run these migrations in order:

### 1.1 Meetings Table (`public.meetings`)
```sql
CREATE TABLE IF NOT EXISTS public.meetings (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Untitled Meeting',
  duration     INTEGER NOT NULL DEFAULT 0,          -- in seconds
  transcript   JSONB NOT NULL DEFAULT '[]',         -- Array of: { speaker: string, timestamp: number, text: string }
  tldr         TEXT,
  key_quote    TEXT,
  action_items JSONB NOT NULL DEFAULT '[]',         -- Array of: { id: uuid, text: string, assignee: string, priority: string, done: boolean }
  speakers     JSONB NOT NULL DEFAULT '[]',         -- Array of: { id: string, label: string, talkTime: number }
  insights     JSONB,                               -- Object: { sentiment: string, risks: string[], decisions: string[] }
  audio_url    TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meetings"
  ON public.meetings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON public.meetings FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_created_at ON public.meetings(created_at DESC);
```

### 1.2 Embeddings Table (`public.meeting_embeddings`)
Used for semantic RAG search inside the meeting vault.
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.meeting_embeddings (
  id          BIGSERIAL PRIMARY KEY,
  meeting_id  UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chunk_text  TEXT NOT NULL,
  embedding   VECTOR(384) NOT NULL, -- 384 dimensions for sentence-transformers/all-MiniLM-L6-v2
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.meeting_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own embeddings"
  ON public.meeting_embeddings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on embeddings"
  ON public.meeting_embeddings FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

### 1.3 Subscriptions Table (`public.subscriptions`)
Controls premium tiers for user access.
```sql
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier       TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
  ON public.subscriptions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND tier = 'free');

CREATE POLICY "Users can insert their own subscription"
  ON public.subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 1.4 Autopilot Schedules Table (`public.bot_schedules`)
Saves scheduling configurations for premium AI bots.
```sql
CREATE TABLE IF NOT EXISTS public.bot_schedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_link   TEXT NOT NULL,
  scheduled_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  bot_name       TEXT NOT NULL DEFAULT 'Recall Note Taker',
  platform       TEXT NOT NULL DEFAULT 'custom' CHECK (platform IN ('google-meet', 'zoom', 'teams', 'custom')),
  settings       JSONB NOT NULL DEFAULT '{"diarize": true, "actions": true, "language": "en", "style": "detailed"}',
  status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'joining', 'recording', 'processing', 'completed', 'failed')),
  error_message  TEXT,
  meeting_id     UUID REFERENCES public.meetings(id) ON DELETE SET NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.bot_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bot schedules"
  ON public.bot_schedules FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on bot schedules"
  ON public.bot_schedules FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_bot_schedules_user_id ON public.bot_schedules(user_id);
CREATE INDEX idx_bot_schedules_scheduled_at ON public.bot_schedules(scheduled_at);
```

---

## 📡 2. API Endpoint Contracts

### 2.1 Process Audio (`POST /api/process-audio`)
Handles direct user microphone recordings and local file uploads.
*   **Content-Type:** `multipart/form-data`
*   **Parameters:**
    *   `audio` (File): The raw audio blob (MP3, WAV, M4A, WEBM up to 25MB).
    *   `name` (string): Pre-defined or suggested meeting title.
    *   `diarize` (boolean): Speaker segmentation request.
    *   `actions` (boolean): Extract to-do list checkbox.
    *   `language` (string): Detect or isolate language (e.g. `en`, `hi`, `es`, `auto`).
    *   `style` (string): Summary format style (`detailed`, `bullet`, `brief`).
*   **Expected JSON Response:**
    ```json
    {
      "id": "uuid-v4",
      "name": "Updated Meeting Title",
      "created_at": "2026-05-21T11:00:00.000Z",
      "audioUrl": "https://storage-bucket-url/id.wav",
      "stats": {
        "duration": 180,
        "speakerCount": 2,
        "wordCount": 420,
        "actionItemCount": 1
      },
      "speakers": [
        { "id": "s1", "label": "Speaker 1", "talkTime": 120 }
      ],
      "transcript": [
        { "speaker": "Speaker 1", "timestamp": 0, "text": "Hello world" }
      ],
      "tldr": "A high level executive summary...",
      "keyQuote": "Crucial quote extracted...",
      "actionItems": [
        { "id": "uuid-v4", "text": "Submit API designs", "assignee": "Dave", "priority": "high", "done": false }
      ],
      "insights": {
        "sentiment": "aligned",
        "meetingType": "Technical Sync",
        "risks": ["Deployment timeline is short"],
        "decisions": ["Adopt pgvector for RAG"]
      }
    }
    ```

### 2.2 Schedule Autopilot Bot (`POST /api/bot/schedule`)
Called when a Pro tier user schedules a bot.
*   **Content-Type:** `application/json`
*   **Payload:**
    ```json
    {
      "link": "https://meet.google.com/abc-defg-hij",
      "scheduledAt": "2026-05-21T14:30:00.000Z",
      "botName": "Recall Note Taker",
      "settings": {
        "diarize": true,
        "actions": true,
        "language": "en",
        "style": "detailed"
      }
    }
    ```
*   **Expected JSON Response:**
    ```json
    {
      "success": true,
      "message": "Autopilot successfully scheduled",
      "data": {
        "id": "uuid-v4",
        "meeting_link": "https://meet.google.com/abc-defg-hij",
        "scheduled_at": "2026-05-21T14:30:00.000Z",
        "bot_name": "Recall Note Taker",
        "platform": "google-meet",
        "status": "scheduled"
      }
    }
    ```

### 2.3 Notion Export Integration (`POST /api/export/notion`)
*   **Content-Type:** `application/json`
*   **Payload:** `{ "meetingId": "uuid-v4" }`
*   **Action:** Retreives meeting records, utilizes the Notion SDK (`@notionhq/client`), and appends a formatted document block structure directly into the user's Notion integration page.

### 2.4 Vault Semantic RAG Search (`POST /api/vault-search`)
*   **Content-Type:** `application/json`
*   **Payload:** `{ "query": "What did the client say about the budget?" }`
*   **Action:** Converts query text to embeddings, executes cosine-similarity search against `meeting_embeddings`, builds a prompt injection bypass containing context chunks, queries Llama 3, and returns a natural language response.

---

## 🗺 3. Phase-by-Phase Technical Pipelines

```
           +---------------------------------------+
           |       API Processing Pipeline         |
           +---------------------------------------+
                               |
       [Groq API]              | Whisper-large-v3
                               v
                       [Raw Transcript]
                               |
    [NVIDIA NIM API]           | Llama-3.1-70B-Instruct
                               v
                     [Structured JSON DB]
                               |
    [Hugging Face]             | sentence-transformers (all-MiniLM-L6-v2)
                               v
                 [Supabase Vector Embeddings]
```

### Phase 1: Audio Transcription Pipeline (Groq Whisper-large-v3)
1.  **Parse Request:** Parse incoming `multipart/form-data` using standard utilities.
2.  **Size Enforcements:** Enforce strict file size verification. The Whisper API maximum limit is **25MB**. 
3.  **Transcribe:** Submit media streams to Groq's whisper model using their official SDK:
    ```typescript
    import Groq from "groq-sdk";
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "verbose_json",
      language: language !== "auto" ? language : undefined,
    });
    ```
4.  **Format Transcripts:** Iterate over `transcription.segments` to assemble speaker text blocks matching the frontend `transcript` parameter array.

### Phase 2: LLM Synthesis Engine (NVIDIA NIM Llama 3)
1.  **Format system Prompt:** Restrict LLM instructions strictly using an un-bypassable system system instruction template to isolate input transcripts from prompt injections.
2.  **Structured JSON Mode:** Instruct NVIDIA's NIM model (`meta/llama-3.1-70b-instruct`) using JSON mode to output matching schemas:
    ```typescript
    import OpenAI from "openai";
    const nvidia = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const completion = await nvidia.chat.completions.create({
      model: "meta/llama-3.1-70b-instruct", 
      messages: [
        { role: "system", content: SYSTEM_CONSTRAINTS },
        { role: "user", content: `Analyze: \n<transcript>${transcriptText}</transcript>` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    ```

### Phase 3: Database & Vector Search Persistence
1.  **Media Upload:** Upload the raw media stream to Supabase Storage in the `meetings-audio` bucket and retrieve public URLs.
2.  **Insert Row:** Commit metadata, stats, action items, transcript arrays, and analysis results to `public.meetings`.
3.  **Hugging Face Vector Embedding Pipeline:**
    To support semantic vault searches, slice full transcripts into 400-word segments and generate embeddings using `sentence-transformers/all-MiniLM-L6-v2` via Hugging Face Inference:
    ```typescript
    import { HfInference } from "@huggingface/inference";
    const hf = new HfInference(process.env.HF_TOKEN);

    const embeddings = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: chunksTextArray,
    }) as number[][];
    ```
4.  **Insert Embeddings:** Save the vector arrays into `public.meeting_embeddings`.

### Phase 4: Integration Add-ons (Notion & RAG)
*   **Notion Export:** Connect user database configurations via `@notionhq/client` and map meeting structures into page layouts containing toggles, to-do blocks, and headers.
*   **RAG Query Endpoint (`POST /api/vault-search`):**
    1. Parse query and generate matching 384-dimension vector arrays.
    2. Query Supabase using a RPC PostgreSQL vector cosine similarity call:
       ```sql
       CREATE OR REPLACE FUNCTION match_meeting_embeddings (
         query_embedding vector(384),
         match_threshold float,
         match_count int,
         filter_user_id uuid
       ) RETURNS TABLE (
         id bigint,
         meeting_id uuid,
         chunk_text text,
         similarity float
       ) AS $$
       BEGIN
         RETURN QUERY
         SELECT
           me.id,
           me.meeting_id,
           me.chunk_text,
           1 - (me.embedding <=> query_embedding) AS similarity
         FROM public.meeting_embeddings me
         WHERE me.user_id = filter_user_id
         AND 1 - (me.embedding <=> query_embedding) > match_threshold
         ORDER BY me.embedding <=> query_embedding ASC
         LIMIT match_count;
       END;
       $$ LANGUAGE plpgsql STABLE;
       ```
    3. Pass matches to NVIDIA Llama-3.1-70B-Instruct to synthesize natural language answers.

### Phase 5: Premium Autopilot Bot System (Headless VM Worker)
Build an asynchronous task worker service (Express/FastAPI) hosted on a dedicated VM (e.g. Always-Free OCI VM).

```
[Autopilot Queue Job] ---> [Spin Playwright Chromium] ---> [Join Conference (Meet/Zoom/Teams)]
                                                                      |
[Upload .wav to Gemini] <-- [Save Audio File] <-- [Record Tab Stream (MediaRecorder API)]
```

#### 5.1 Queue Job Workers (Redis & BullMQ)
When the Next.js API receives a schedule request, compute the `delay` and enqueue:
```typescript
import { Queue } from 'bullmq';
const autopilotQueue = new Queue('autopilot-bots', { connection: redisConnection });

const delayMs = new Date(scheduledAt).getTime() - Date.now();
await autopilotQueue.add('join-meeting', { scheduleId, link, botName }, { delay: delayMs });
```

#### 5.2 Playwright Automated Joining Script
Launch headless Chromium instances containerized inside Docker. Use Chromium media bypass parameters:
```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--allow-file-access-from-files',
    '--disable-gesture-requirement-for-media-playback',
  ]
});
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(meetingLink);

// Example Google Meet Join
await page.fill('input[type="text"]', botName);
await page.keyboard.press('Control+d'); // Mute Mic
await page.keyboard.press('Control+e'); // Close Cam
await page.click('button:has-text("Ask to join"), button:has-text("Join now")');
```

#### 5.3 Zero-Cost Browser Audio Capturing
Record call audio inside the headless browser by injecting a Web Audio API stream listener:
```javascript
// Run inside page.evaluate() after joining:
const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const destination = audioContext.createMediaStreamDestination();
source.connect(destination);

const mediaRecorder = new MediaRecorder(destination.stream);
const chunks = [];
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/wav' });
  // Expose this blob and save it as a file on the worker server
};
mediaRecorder.start();
```

#### 5.4 Multimodal Audio Synthesis (Gemini 1.5 Flash)
Gemini 1.5 Flash natively supports audio files up to 8.4 hours in length. Feed the raw audio recording directly to Gemini using the Google Gen AI SDK. This acts as both the transcriber and synthesis engine in a single, zero-cost, speaker-diarized step:

```typescript
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 1. Upload audio recording to the File API
const audioFile = await ai.files.upload({
  file: 'path/to/meeting_recording.wav',
  mimeType: 'audio/wav',
});

// 2. Perform diarized transcription and summary analysis
const response = await ai.models.generateContent({
  model: 'gemini-1.5-flash',
  contents: [
    audioFile,
    { text: GEMINI_SYNTHESIS_PROMPT_JSON_FORMAT }
  ],
  config: {
    responseMimeType: 'application/json',
  }
});

const meetingJsonResult = JSON.parse(response.text);
```

#### 5.5 Storage Sync & DB Update
Once the worker receives the synthesized JSON result:
1. Upload the `.wav` file to Supabase's `meetings-audio` storage bucket.
2. Insert the completed meeting details into the `public.meetings` table.
3. Update the `status` column in `public.bot_schedules` to `completed` and reference the newly created `meeting_id`.

---

## 🚀 Transitioning to Production (Removing "Demo Mode")
Once you have fully implemented the pipeline endpoints:
1. Open [useProcessAudio.ts](file:///c:/Users/rishi/OneDrive/Desktop/AI%20Meeting%20&%20Lecture%20Note%20Taker/hooks/useProcessAudio.ts) in the frontend.
2. Delete the `setTimeout` block located under `// DEMO FALLBACK: Remove this in production`.
3. Uncomment the actual `fetch('/api/process-audio')` lines immediately above it.
4. Open the Autopilot route at [app/api/bot/schedule/route.ts](file:///c:/Users/rishi/OneDrive/Desktop/AI%20Meeting%20&%20Lecture%20Note%20Taker/app/api/bot/schedule/route.ts). Replace the `Table 'bot_schedules' not found` mock fallbacks with your direct active queue.
5. Compile, deploy, and perform end-to-end tests!
