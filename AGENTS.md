# Noise-Man Project

A web application for generating various types of ambient noise (white, brown, pink, etc.) for focus, relaxation, and sleep.

## Tech Stack
- **Frontend**: React 18+ with TypeScript, Vite, Web Audio API
- **Backend**: Python 3.11+ with FastAPI, numpy
- **Architecture**: REST API with audio buffer generation on backend, Web Audio playback on frontend

## Project Structure
```
noise-man/
├── frontend/          # React/TypeScript app (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── backend/           # FastAPI Python app
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   └── models/
│   └── requirements.txt
└── .pi/               # Agent configuration
    ├── agents/        # Subagent definitions
    ├── prompts/       # Workflow templates
    └── extensions/    # Subagent extension
```

## Multi-Agent Workflow
This project uses pi's subagent extension for orchestrated development.
All agents run through **Google Antigravity** (free), using three model families:

**Gemini models:**
- **architect** (Gemini 3.1 Pro High) — high-level design and API contracts
- **designer** (Gemini 3 Flash) — UI/UX specs and component design
- **scout** (Gemini 3 Flash) — fast codebase reconnaissance
- **tester** (Gemini 3 Flash) — testing and QA

**Claude models (via Antigravity):**
- **frontend-dev** (Claude Sonnet 4.5) — React/TypeScript implementation
- **reviewer** (Claude Sonnet 4.6) — code review

**GPT-OSS models (via Antigravity):**
- **backend-dev** (GPT-OSS 120B Medium) — Python/FastAPI implementation

Use `/build`, `/design`, `/implement`, `/add-feature`, or `/test-and-fix` to trigger workflows.
