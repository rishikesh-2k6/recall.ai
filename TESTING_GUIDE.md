# Testing Guide for the Template Web App

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Migrations & Seeding](#database-migrations--seeding)
4. [Running the Development Server](#running-the-development-server)
5. [Account Creation & Authentication](#account-creation--authentication)
6. [Feature‑by‑Feature Smoke Tests](#feature-by-feature-smoke-tests)
   - 6.1 [Bot Scheduling API (`/api/bot/schedule`)](#bot-scheduling-api)
   - 6.2 [Audio Processing API (`/api/process-audio`)](#audio-processing-api)
   - 6.3 [Google Docs Export (`/api/export/google-docs`)](#google-docs-export)
   - 6.4 [Account Management (`/api/account/*`)](#account-management)
   - 6.5 [Rate‑Limiting & Tier Checks](#rate-limiting--tier-checks)
   - 6.6 [Mobile‑Ready Auth Flow](#mobile-ready-auth-flow)
7. [Bot Worker Verification](#bot-worker-verification)
8. [Security / Bug Checks](#security--bug-checks)
9. [Optional: Push Notifications & Payments](#optional-push-notifications--payments)
10. [Cleanup](#cleanup)

---

### Prerequisites
- **Node.js >= 20** (latest LTS) installed and available in your `PATH`.
- **pnpm** or **npm** (the guide uses `npm`).
- **Docker** (optional but recommended) for a local PostgreSQL + Redis stack.
- **Supabase CLI** (`supabase`) for running local DB migrations.
- **Git** for version control.
- A modern browser (Chrome/Edge) for UI tests.
- **Postman** or **curl** for API testing.

---

## Environment Setup
1. **Clone the repo** (if you haven’t already)
   ```bash
   git clone <repo‑url> C:/Users/Prudhvi/Desktop/template-webapp
   cd C:/Users/Prudhvi/Desktop/template-webapp
   ```
2. **Install dependencies**
   ```bash
   npm ci   # or `npm install` if you prefer
   ```
3. **Create a `.env.local`** – copy the example and fill in real values.
   ```bash
   cp .env.example .env.local
   ```
   Required variables (at minimum):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `REDIS_URL` (e.g., `redis://localhost:6379`)
   - `STRIPE_SECRET_KEY` (if you plan to test payments later)
   - `FIREBASE_CONFIG` (if you plan to test push notifications)
4. **Spin up a local PostgreSQL + Redis** – easiest with Docker Compose:
   ```yaml
   # docker-compose.yml (add to the repo root if not present)
   version: "3.8"
   services:
     db:
       image: supabase/postgres:15
       environment:
         POSTGRES_PASSWORD: postgres
         POSTGRES_USER: postgres
       ports:
         - "5432:5432"
       volumes:
         - pgdata:/var/lib/postgresql/data
     redis:
       image: redis:7-alpine
       ports:
         - "6379:6379"
   volumes:
     pgdata:
   ```
   Then run `docker compose up -d`.
5. **Start Supabase local development** (provides the Postgres instance and `supabase` CLI tools):
   ```bash
   supabase start
   ```
   Verify that `localhost:5432` is reachable.

---

## Database Migrations & Seeding
1. **Run all migrations** – this will create the tables, RLS policies, and triggers introduced in the security audit.
   ```bash
   supabase db reset   # drops & recreates the DB (use with caution)
   supabase db push    # applies migrations from `supabase/migrations`
   ```
2. **Seed test data** (optional but helpful). Create a script `scripts/seed.ts` that inserts a few users, a free‑tier subscription, and a dummy integration record. Run it with `ts-node`:
   ```bash
   npx ts-node scripts/seed.ts
   ```
   The seed should use the Supabase client with the service role key so that RLS bypasses are not required.

---

## Running the Development Server
```bash
npm run dev   # default starts on http://localhost:3000
```
- Verify that the UI loads without console errors.
- Open the Network tab – you should see calls to `/api/*` endpoints returning JSON.

---

## Account Creation & Authentication
1. **Navigate to the Sign‑Up page** (`/signup`).
2. Register a new user (e.g., `testuser@example.com` / `Password123!`).
3. After sign‑up, **verify the email** if the app enforces verification (Supabase sends a console log with a magic link; copy‑paste it into the browser).
4. **Log‑in** with the newly created credentials.
5. Confirm that a **Supabase session cookie** is set (inspect `Application → Cookies`).
6. **Extract the Bearer token** for mobile‑style auth:
   - Open DevTools → Application → Local Storage → `supabase.auth.token` (or run `supabase auth token` CLI).
   - Copy the JWT – you’ll need it for the `Authorization: Bearer <token>` header in subsequent API calls.

---

## Feature‑by‑Feature Smoke Tests
### Bot Scheduling API (`/api/bot/schedule`)
```bash
curl -X POST http://localhost:3000/api/bot/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT>" \
  -d '{"meetingUrl":"https://example.com/meeting","duration":30}'
```
- Expected: `200 OK` with a JSON object containing `jobId`.
- Verify **PRO‑only gating** – create a free‑tier account and confirm you receive `403 Forbidden`.
- Test **SSRF validation** – supply an internal IP (`http://127.0.0.1`) and ensure the response is `400 Bad Request`.
- Trigger the **rate‑limit** by sending >5 requests within a minute; the 6th should return `429 Too Many Requests`.

### Audio Processing API (`/api/process-audio`)
1. Prepare a small WebM audio file (`sample.webm`).
2. Call the endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/process-audio \
     -H "Authorization: Bearer <JWT>" \
     -F "file=@sample.webm"
   ```
3. Expected response: transcription JSON.
4. **Free‑tier limit** – after 3 successful calls, the 4th should reply with `402 Payment Required`.
5. Verify **MIME‑type handling** – try sending a `.mp4` file; you should receive `415 Unsupported Media Type`.

### Google Docs Export (`/api/export/google-docs`)
```bash
curl -X POST http://localhost:3000/api/export/google-docs \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"docId":"1A2B3C...","format":"pdf"}'
```
- Expected: download URL or a direct binary stream.
- Test **server‑side token first** – revoke the user‑side Google OAuth token in Supabase and ensure the request still succeeds using the stored server token.
- Rate‑limit: repeat the call >5 times/minute and watch for `429`.

### Account Management (`/api/account/*`)
| Endpoint | Action | Expected Result |
|----------|--------|-----------------|
| `POST /api/account/upgrade` | Upgrade to PRO (mock) | `200 OK` with upgraded tier field |
| `DELETE /api/account/delete` | Delete account | `200 OK` and all user data removed |
| `GET /api/account/profile` | Retrieve profile | JSON with email, tier, subscription status |
- After deletion, attempt to login again; it should fail.

### Rate‑Limiting & Tier Checks
- **Free tier**: 3 audio‑process calls, 5 bot‑schedule calls per minute.
- **PRO tier**: unlimited (but still rate‑limited to 30 req/min for abuse protection).
- Use a script to fire rapid requests and confirm HTTP status codes (`429`, `402`).

### Mobile‑Ready Auth Flow
1. Use **Postman** (or any HTTP client) to set the `Authorization: Bearer <JWT>` header **instead of cookies**.
2. Call any protected route (e.g., `/api/bot/schedule`). It should succeed exactly as when the cookie is present.
3. Remove the cookie and repeat – the request must still succeed via the header.
4. Test **fallback**: send an expired JWT; the endpoint should fall back to the cookie (if present) and succeed, otherwise return `401`.

---

## Bot Worker Verification
The bot worker runs as a separate Node process (`npm run worker`). Follow these steps:
1. **Start Redis** (already running via Docker). Verify `redis-cli ping` returns `PONG`.
2. **Launch the worker** in another terminal:
   ```bash
   npm run worker   # usually executes `node bot-worker/worker.js`
   ```
3. **Schedule a bot job** via the API (see the Bot Scheduling test).
4. Observe the worker console – you should see log lines:
   - `Job <id> started`
   - `Audio captured (tab)`, `WebM MIME fixed`, `Room timeout after 5m` – these correspond to the audit fixes.
5. **Simulate failure**: kill the worker mid‑job and confirm that the `finally` block cleans temporary files (check `/tmp` or the project’s `tmp/` folder).
6. **Check job completion** – the API should return a finished status and the transcription should be stored in the DB.

---

## Security / Bug Checks
| Check | How to Verify |
|-------|---------------|
| **RLS Policies** | In Supabase UI, try to read `subscriptions` table directly with a normal user token – should be denied.
| **Tier Enforcement** | Free user exceeds limits – receives `402`/`403`. PRO user can exceed.
| **SSRF Protection** | Use a private IP as `meetingUrl`; expect `400`.
| **MIME Type Fixes** | Upload a WebM with wrong extension; ensure it is accepted and processed.
| **Rate‑Limiter** | Rapid calls → `429`.
| **Auth Helper** | Both cookie and Bearer token work; fallback works.
| **Bot Worker Cleanup** | After a job finishes, no stray `.webm` files remain.
| **Lobby Timeout** | Create a meeting and never join; after 5 minutes the job is cancelled (verify log). |

Run each of the above manually or script them with a small Node test harness (`npm test` can be extended).

---

## Optional: Push Notifications & Payments
The current repo contains placeholders for Firebase Cloud Messaging (FCM) and Stripe/RevenueCat integration.
1. **FCM** – add your `firebase-messaging-sw.js` to `/public`, set `FIREBASE_CONFIG` in `.env.local`, and call `/api/notifications/register` from the frontend. Verify the device receives a test push.
2. **Payment Provider** – replace the mock logic in `app/api/account/upgrade/route.ts` with a real Stripe `checkout.session.create` call. Use Stripe test keys and run the full checkout flow. After a successful payment, the user's `tier` should flip to `PRO`.

---

## Cleanup
- Stop the dev server (`Ctrl+C`).
- Stop the worker (`Ctrl+C`).
- Bring down Docker containers: `docker compose down`.
- Optionally drop the local Supabase DB: `supabase stop && supabase db reset`.

---

**You now have a complete end‑to‑end testing guide** covering account creation, all API routes, mobile authentication, rate‑limiting, tier enforcement, bot‑worker behavior, and the security audit fixes. Follow the steps in order; any failure should be logged and can be traced back to the corresponding commit in the walkthrough.
