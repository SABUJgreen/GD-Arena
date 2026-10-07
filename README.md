# GD Arena

GD Arena is an AI-powered group discussion simulator for practicing structured thinking, disagreement, and leadership in a realistic five-person room.

## Architecture

```text
Next.js App Router ──HTTP / WebSocket──> FastAPI
                                             │
                            Discussion service + deterministic turn engine
                                             │
                           Gemini API (optional) / demo responses
                                             │
                                  MongoDB (optional persistence)
```

## Stack

- Next.js, TypeScript, Tailwind CSS, Recharts
- FastAPI, Pydantic, WebSockets
- Optional Google Gemini API and MongoDB via PyMongo

## Run locally

1. Copy `.env.example` to `.env` and adjust values. The app runs in demo mode without Gemini API or MongoDB.
2. Start the backend:

```bash
cd backend
py -3.13 -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

3. Start the frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. MongoDB is used automatically when `MONGODB_URI` is reachable; otherwise an in-memory repository keeps the demo usable.

## Environment variables

See `.env.example`. `GEMINI_API_KEY` enables live model responses, and `MONGODB_URI` enables persistence. Never commit `.env`.

## MVP features

Authentication, topic configuration, live WebSocket discussion, four distinct participant personas, judge evaluation, results analytics, transcript review, history, and replay.

## Known limitations

Demo mode uses curated responses and in-memory data when external services are not configured. Production deployments should add a shared session store and secure cookie settings for their domain.
