# Outreach Studio - Backend & API Developer Guide

Outreach Studio is a multi-tenant SME website outreach dashboard designed for automated lead discovery, AI research, site brief generation, custom website preview recording, and WhatsApp socket dispatch.

---

## 1. Architecture Overview

- **Frontend Framework**: React 19 + TypeScript + Tailwind CSS (Vite SPA)
- **Backend Framework**: Express v4 on Node.js (bundled via `esbuild` to `dist/server.cjs`)
- **AI Integration**: Server-side `@google/genai` (Google Gemini) for area suggestion, site brief generation, and message rewriting.
- **Data Model**: Google Drive Sheet acts as the primary user persistence layer (`drive.file` scope).
- **WhatsApp Relay**: Local socket server running at `http://127.0.0.1:8787`.

---

## 2. API Endpoints Reference

### Summary & Pipeline
- `GET /api/summary`: Returns aggregate metrics, total count, stage breakdown, and Google Sheet link.
- `POST /api/create-sheet`: Provisions a new pipeline spreadsheet directly in the user's Google Drive.
- `GET /api/leads`: Returns the full leads table with reachability, rating, website status, and stage.
- `POST /api/lead-note`: Updates manual owner notes for a given `place_id`.

### Campaign & Settings
- `GET /api/campaign` / `POST /api/campaign`: Retrieves & updates campaign category, city, target area chips, and daily limits.
- `POST /api/suggest-areas`: Calls Gemini server-side to generate neighborhood chips for a target city.
- `GET /api/model` / `POST /api/model`: Retrieves & saves model provider choices and encrypted API keys.
- `POST /api/test-key`: Tests valid authentication for Google Places or LLM provider keys.

### Outreach Funnel Stages
- `GET /api/reachability`: Returns leads categorized into `verified`, `rejected`, and `waiting` WhatsApp status.
- `POST /api/whatsapp/check-batch`: Checks reachability status via socket for unchecked leads.
- `GET /api/review-queue`: Returns site briefs awaiting single-item human approval.
- `POST /api/decide`: Records `approve`, `skip`, or `later` decision for a brief.
- `POST /api/regenerate`: Uses Gemini to rewrite the Lovable site generation prompt.
- `GET /api/build-queue`: Returns approved briefs ready for site building.
- `POST /api/record-build`: Saves published preview URL (`.lovable.app`) and generates thumbnail screenshot.
- `GET /api/whatsapp/queue`: Returns built sites ready for WhatsApp transmission.
- `POST /api/outreach/rewrite`: Uses Gemini to apply custom AI rewrite instructions to a lead's message.
- `POST /api/whatsapp/send`: Sends WhatsApp message & preview image via local relay socket.

### Batch Runner & Live Logs
- `POST /api/run`: Launches asynchronous morning outreach pipeline batch.
- `GET /api/log`: Streams current execution terminal log lines and running state.

---

## 3. Environment Variables & Credentials

Set these in your server environment or `.env` file:

```env
# Server Port & Host
PORT=3000
NODE_ENV=production

# Gemini API Key (Server-Side Only)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Google Places API Key
PLACES_API_KEY=your_google_places_key_here
```

All credentials saved via the Settings UI are encrypted on the server side and never sent back to the browser.
