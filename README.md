# Winged Journal

A personal bird scrapbook: upload a photo, identify the bird, autofill species notes from the web, and keep a local gallery you can edit.

## Quick start

```bash
cd winged-journal
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`).

No API keys are required for the demo path. Sample photos on the home page walk through upload → ID → scrapbook without a camera.

## Bird identification

| Mode | When | How |
|------|------|-----|
| **Mock / demo** (default) | No vision keys in env | Matches by filename cues against a small catalog (Robin, Cardinal, Blue Jay, Chickadee, Mallard), with a short simulated delay |
| **OpenAI Vision** | `VITE_OPENAI_API_KEY` set | Sends the image to Chat Completions (`gpt-4o-mini` by default) and expects JSON `{ commonName, scientificName, confidence, notes }` |
| **Anthropic Vision** | `VITE_ANTHROPIC_API_KEY` set (and no OpenAI key) | Sends the image to the Messages API and parses the same JSON shape |

Copy `.env.example` to `.env.local` and fill keys if you want live vision:

```bash
cp .env.example .env.local
```

If a live provider errors, the app falls back to mock mode.

> Note: browser-exposed `VITE_*` keys are fine for personal local use only. For a shared deployment, proxy vision calls through a small backend.

## Species lookup

After ID, the app calls the **Wikipedia REST API**:

1. `GET https://en.wikipedia.org/api/rest_v1/page/summary/{title}` for common name / scientific name
2. On miss, title search via `w/rest.php/v1/search/title`
3. Offline/demo fallback blurbs for the sample species if the network is unavailable

Extracted fields: short description, opportunistic habitat/range phrases from the extract, Wikipedia URL, thumbnail when present.

## Scrapbook persistence

Entries are stored in the browser with **IndexedDB** (`idb` wrapper), database name `winged-journal`. Each entry keeps the photo as a data URL plus ID metadata, Wikipedia fields, location label, and personal notes. You can open a card, edit/correct the species, and re-fetch Wikipedia after a correction.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Serve the production build |

## Stack

Vite · React 19 · TypeScript · IndexedDB · Wikipedia REST · optional OpenAI / Anthropic vision
