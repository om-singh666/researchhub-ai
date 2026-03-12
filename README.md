# ResearchHub AI

ResearchHub AI is a full-stack research paper management and analysis platform built with FastAPI and React. It supports JWT authentication, workspace-based paper organization, paper discovery, and AI-assisted research chat using a Groq-compatible backend flow.

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, JWT auth, sentence-transformers
- AI: Groq Llama 3.3 70B compatible service wrapper
- Database: SQLite by default

## Project Structure

- `backend/` FastAPI API server
- `frontend/` React client

## Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and talks to the backend at `http://localhost:8000`.

## Environment Variables

Backend `.env` values:

- `DATABASE_URL`
- `SECRET_KEY`
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `FRONTEND_ORIGIN`

If `GROQ_API_KEY` is missing, chat falls back to deterministic mock responses so the project still works for demos.
