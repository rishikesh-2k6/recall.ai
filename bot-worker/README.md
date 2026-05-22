# 🤖 Recall AI Autopilot Bot Worker Service

This directory contains the standalone, production-ready asynchronous task worker service for the **Recall AI Autopilot Bot**. 

Since Next.js Serverless routes on Vercel have a 60-second execution timeout, this worker runs on a dedicated virtual machine (e.g. Always-Free Oracle Cloud ARM VM) as a background daemon, using **Redis & BullMQ** as its job scheduler, and **Playwright Headless Chromium** inside **Docker** containers.

---

## 🛠 Complete Tech Stack
- **Runtime:** Node.js + TypeScript (`ts-node`)
- **Queue Scheduler:** BullMQ connected to a Redis Server
- **Browser Automation:** Playwright Headless Chromium
- **Cognitive Engine:** Google Gemini 1.5 Flash API (multimodal diarized audio processing)
- **Database client:** Supabase JS SDK

---

## 🏗 Architectural Workflow
1. User schedules a bot on the frontend web application by posting to `/api/bot/schedule`.
2. The web route inserts a `bot_schedules` row and pushes a delayed job to the Redis queue for the scheduled start time.
3. This worker service receives the job at the meeting time and spins up a Playwright headless Chromium instance.
4. The Playwright bot joins the meeting link, automatically bypassing microphone/camera popups, disabling audio constraints, and typing the custom note taker name.
5. An injected Web Audio API script records call streams in real-time.
6. Upon call exit (or maximum 1-hour timeout), the WAV audio file is saved.
7. The WAV recording is uploaded to the **Google Gemini 1.5 Flash API**, which diarizes, transcribes, and structures notes in a single single-step.
8. Notes are persisted in the Supabase database, and the schedule is updated to `completed`.

---

## 🚀 Setup & Execution Guide

### 1. Requirements
Ensure you have the following installed on your machine or VM:
- [Node.js](https://nodejs.org/) (v20+)
- [Redis Server](https://redis.io/) (installed and running)
- Docker (optional, but highly recommended for containerized deployment)

### 2. Configure Environment Variables
Create a `.env` file inside this `bot-worker` directory with the following credentials:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

HEADLESS=true
```

### 3. Local Installation & Development
Install local dependencies and start the task listener:
```bash
# Install packages
npm install

# Run the typescript compiler in watch mode
npx tsc --watch

# Start the worker daemon
npm start
```

### 4. Running with Docker (Production VM Deployment)
The easiest way to host this worker on a cloud VM (like Oracle Cloud OCI ARM VM) is using Docker:

1. **Build the Docker Image:**
   ```bash
   docker build -t recall-bot-worker .
   ```

2. **Run the Container (linked to your Redis server):**
   ```bash
   docker run -d \
     --name recall-bot-worker-service \
     --env-file .env \
     --restart unless-stopped \
     recall-bot-worker
   ```

---

## 🛠 Troubleshooting & Bypasses
- **Google Meet:** Uses keyboard shortcut mappings (`Ctrl + d`, `Ctrl + e`) to mute audio/video before requesting room lobby entry.
- **Zoom Client:** Forcefully bypasses native app prompts by rewriting meeting endpoints to leverage the Zoom Web Client framework fully inside Chromium.
- **MS Teams:** Automatically dismisses native app popups, signs in as guest, and clicks room joining buttons.
