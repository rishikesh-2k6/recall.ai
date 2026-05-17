# Verbatim AI Backend Blueprint
**For the Backend Engineer**

The frontend of Verbatim is 100% complete. It currently runs in a "Demo Mode" that intercepts API calls and returns mock data. Your goal is to build the actual APIs to process real audio files, query the AI models, save the data to a database, and power the "Wow Features" (Notion Export, Vault RAG Search).

## 🛠 Tech Stack
*   **Framework:** Next.js Serverless Routes (`app/api/...`) OR a dedicated Python FastAPI server. (Python is recommended for easier AI/RAG handling).
*   **Transcription:** [Groq API](https://groq.com/) (Whisper-large-v3) - For blazing-fast audio transcription.
*   **LLM Processing:** [NVIDIA Build APIs](https://build.nvidia.com/) (Llama 3 70B) - For summarization, action item extraction, and insights.
*   **Database:** [Supabase](https://supabase.com/) (PostgreSQL) - For storing meeting history.
*   **Vector DB / RAG:** Supabase pgvector or ChromaDB (for the "Vault AI Search").

---

## 📡 API Contract (The Core Endpoint)

The frontend currently attempts to send audio to `/api/process-audio`. You need to build this endpoint.

**Request:** `POST /api/process-audio`
*   **Content-Type:** `multipart/form-data`
*   **Payload:**
    *   `audio`: The raw audio `Blob` or `File`.
    *   `template`: string (e.g., "standup", "interview").
    *   `diarization`: boolean (stringified).
    *   `language`: string (e.g., "auto", "en").

**Expected JSON Response:**
The frontend strictly expects the following JSON structure to render the Results Dashboard:

```json
{
  "id": "unique-uuid",
  "name": "Meeting Name (auto-generated)",
  "created_at": "2024-05-17T10:00:00Z",
  "audio_url": "https://supabase-bucket-url.mp3",
  "tldr": "A 2-3 sentence summary of the meeting.",
  "keyQuote": "The most important quote said during the meeting.",
  "stats": {
    "duration": 120, 
    "speakerCount": 2,
    "wordCount": 450
  },
  "transcript": [
    { "speaker": "Speaker 1", "timestamp": 0, "text": "Hello everyone." },
    { "speaker": "Speaker 2", "timestamp": 5, "text": "Let's begin." }
  ],
  "actionItems": [
    { "id": "uuid", "text": "Schedule follow up", "assignee": "John", "priority": "high", "done": false }
  ],
  "insights": {
    "sentiment": "aligned",
    "risks": ["Tight deadline"],
    "decisions": ["Approved $15k budget"]
  }
}
```

---

## 🗺 Phase-by-Phase Implementation Plan

### Phase 1: The Audio Pipeline (Whisper)
1.  **Receive the File:** Parse the `multipart/form-data` payload.
2.  **Transcribe:** Send the audio file to the `Groq` API using the `whisper-large-v3` model.
3.  **Diarization (Optional):** If Groq doesn't natively support speaker diarization, you can either mock the speakers, use a Pyannote.audio pipeline, or rely on Deepgram as an alternative transcription provider.
4.  **Format:** Convert the raw Whisper output into the `transcript` JSON array required by the frontend.

### Phase 2: The LLM Engine (NVIDIA Llama 3)
1.  **Construct the Prompt:** Feed the full text transcript from Phase 1 into an NVIDIA NIM Llama-3 prompt.
2.  **System Instruction:** Instruct the LLM to act as an executive assistant. Pass in the `template` parameter (e.g., "This is a Sales Call. Extract specific sales blockers.").
3.  **Structured Output:** Use "JSON Mode" or Pydantic to ensure the LLM outputs exact JSON containing the `tldr`, `keyQuote`, `actionItems`, and `insights`.

### Phase 3: Database Persistence (Supabase)
1.  **Storage:** Upload the raw audio file to a Supabase Storage Bucket and get the public URL (`audio_url`).
2.  **Schema Setup:** Create tables for `meetings`, `transcript_lines`, and `action_items`.
3.  **Insert:** Save the generated JSON payload to Supabase so it appears in the frontend's Meeting History (`/meetings`) page.

### Phase 4: The "Wow Features" (Integrations)

#### 1. Notion Export API (`POST /api/export/notion`)
*   The frontend has a "Send to Notion" button.
*   Build an endpoint that accepts the meeting ID.
*   Use the `notion-client` SDK to create a new page in a Notion database, formatting the TLDR as a text block, action items as `to_do` blocks, and appending the transcript.

#### 2. Vault AI Search (RAG System)
*   The frontend has an "Ask Vault AI" search bar.
*   **Setup:** Whenever a new meeting is processed, generate embeddings for the summary and transcript using an embedding model (e.g., `text-embedding-3-small` or local sentence-transformers).
*   **Store Vectors:** Save these vectors into Supabase pgvector or a local vector store.
*   **Query Endpoint (`POST /api/vault-search`):** When the user asks "What was the marketing budget?", convert the question to a vector, do a similarity search across past meetings, pass the top results to Llama 3, and return a natural language answer.

---

## 🚀 How to Remove the Frontend "Demo Mode"
Once your API is ready:
1. Open `hooks/useProcessAudio.ts`.
2. Delete the `setTimeout` block under `// DEMO FALLBACK: Remove this in production`.
3. Uncomment the actual `fetch('/api/process-audio')` logic located immediately above it.
4. Test the full pipeline!
