# 🎵 Noise-Man

A web application for generating ambient noise (white, brown, pink, blue, etc.) for focus, relaxation, and sleep.

**Built with a multi-agent workflow** — an AI team of architect, designer, frontend dev, backend dev, tester, and reviewer, orchestrated through [pi](https://github.com/mariozechner/pi).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18+, TypeScript, Vite, Web Audio API |
| Backend | Python 3.11+, FastAPI, numpy |
| Communication | REST API (JSON + audio buffers) |

---

## Multi-Agent Development Guide

This project uses **pi's subagent extension** for AI-powered team development. A lead orchestrator model (expensive, smart) delegates work to specialized agents (cheaper, focused), each running in an **isolated subprocess** with its own context window.

### Why Multi-Agent?

Instead of one monolithic AI session doing everything, you get:

- **Zero cost** — all models run through Google Antigravity (free subscription)
- **Isolation** — each agent has a clean context window, no confusion from unrelated code
- **Parallelism** — frontend and backend can be built simultaneously
- **Specialization** — each agent has a tailored system prompt, tool set, and model
- **Multi-vendor models** — Claude, Gemini, and GPT-OSS all via one provider

### Model Assignments (Google Antigravity)

All agents run through **Google Antigravity** — a free sandbox that gives access to Gemini 3, Claude, and GPT-OSS models. Three model families, one subscription, zero cost:

| Agent | Model Family | Model ID | Role |
|-------|-------------|----------|------|
| **You** (orchestrator) | Gemini | `gemini-3.1-pro-high` | Plans, coordinates, decides |
| **architect** | Gemini | `gemini-3.1-pro-high` | System design, API contracts (1M context) |
| **designer** | Gemini | `gemini-3-flash` | UI/UX specs, component design |
| **frontend-dev** | Claude | `claude-sonnet-4-5` | React/TypeScript implementation |
| **backend-dev** | GPT-OSS | `gpt-oss-120b-medium` | Python/FastAPI implementation |
| **tester** | Gemini | `gemini-3-flash` | Writes and runs tests |
| **reviewer** | Claude | `claude-sonnet-4-6` | Code review (read-only tools) |
| **scout** | Gemini | `gemini-3-flash` | Fast codebase reconnaissance (1M context) |

> **Why three model families?**
> - **Gemini 3.1 Pro** — 1M token context, strong reasoning → architecture, orchestration
> - **Gemini 3 Flash** — fast, 1M context → scouting, design, testing
> - **Claude Sonnet** — excellent code generation and review → frontend, code review
> - **GPT-OSS 120B** — good at Python, different perspective → backend
> - All free through Antigravity, subject to rate limits

### Architecture

```
┌─────────────────────────────────────────────────┐
│  YOU  (Orchestrator)                            │
│  Model: google-antigravity/gemini-3.1-pro-high  │
│                                                 │
│  ┌───────────────────────────────────────┐      │
│  │  subagent tool                        │      │
│  │  Modes: single / chain / parallel     │      │
│  └──┬──────────┬──────────┬──────────┬───┘      │
│     │          │          │          │           │
│     ▼          ▼          ▼          ▼           │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐        │
│  │scout │  │archi │  │front │  │back  │  ...    │
│  │gemini│  │gemini│  │claude│  │gpt-  │         │
│  │flash │  │3.1pro│  │sonnet│  │oss   │         │
│  └──────┘  └──────┘  └──────┘  └──────┘         │
│  All via google-antigravity (free)              │
│  Each = isolated `pi` subprocess + sandbox      │
└─────────────────────────────────────────────────┘
```

---

### Quick Start

#### 1. Log in to Google Antigravity

```bash
pi
/login    # select "Google Antigravity", authenticate with your Google account
```

Antigravity is free with any Google account. One login covers all models (Claude, Gemini, GPT-OSS).

#### 2. Start pi with the orchestrator model

```bash
cd ~/develop/noise-man
pi --model google-antigravity/gemini-3.1-pro-high
```

#### 3. Use workflow commands

```bash
# Design phase (no implementation)
/design the noise generator with white, brown, pink, blue noise and a volume mixer

# Full build pipeline: scout → architect → backend → frontend → tester
/build the initial noise generator application

# Add a feature to existing code
/add-feature noise presets (rain, ocean, forest) with save/load

# Test and fix existing code
/test-and-fix the backend noise generation endpoints
```

#### 4. Or just talk to the orchestrator

The orchestrator model sees the `subagent` tool and will use it when appropriate:

```
"Scout the codebase and have the frontend dev add a dark mode toggle"

"Run architect and designer in parallel — architect designs the preset API,
 designer creates the preset selector UI"

"Have the tester check the backend, then the reviewer audit the frontend"
```

---

### Workflow Commands

| Command | Pipeline | Best for |
|---------|----------|----------|
| `/design <task>` | scout → architect → designer | Planning before implementing |
| `/build <task>` | scout → architect → backend → frontend → tester | Greenfield features |
| `/implement <task>` | scout → parallel(backend, frontend) | When design exists |
| `/add-feature <task>` | scout → architect → backend → frontend → tester | Incremental features |
| `/test-and-fix <task>` | scout → tester → reviewer → fix | QA passes |

### Execution Modes

**Chain** — sequential, each step receives the previous step's output:
```
/build the noise generator
  ↓ scout finds codebase state
  ↓ architect designs from scout's findings
  ↓ backend-dev implements from architect's spec
  ↓ frontend-dev implements from architect's spec
  ↓ tester tests everything
```

**Parallel** — concurrent, for independent work:
```
Tell pi: "Run frontend-dev and backend-dev in parallel to implement the mixer"
```

**Single** — one agent, one task:
```
Tell pi: "Use the tester to write tests for the noise service"
```

**Hybrid** — you manually orchestrate between steps:
```
Step 1: "Use scout to explore the codebase"
Step 2: (you read the output, make decisions)
Step 3: "Use architect to design based on [your decisions]"
Step 4: (you review and refine the design)
Step 5: "Use frontend-dev to implement [your refined spec]"
```

---

### Sandbox (Security)

All agents (including subagents) are sandboxed via `.pi/extensions/sandbox.ts`. The sandbox is loaded automatically by every subprocess because pi discovers project-level extensions from `.pi/extensions/` based on `cwd`.

#### What's blocked

| Category | Examples |
|----------|----------|
| **Dangerous bash** | `sudo`, `rm -rf /`, `mkfs`, `dd of=/dev/`, `shutdown`, `reboot` |
| **System writes** | Redirects to `/etc/`, `/usr/`, `/System/`, `/Library/` |
| **Pipe-to-shell** | `curl ... \| sh`, `wget ... \| bash` |
| **Process control** | `killall`, `pkill`, `kill -9 1` |
| **Service management** | `launchctl`, `systemctl` |
| **Credential access** | `~/.ssh/`, `~/.aws/`, `~/.gnupg/`, `~/.kube/`, `~/.docker/` |
| **System file reads** | `/etc/passwd`, `/etc/shadow`, `/System/`, `/Library/` |
| **Writes outside project** | Any `write`/`edit` to paths outside the project root |
| **Protected project files** | `.env`, `.git/`, `node_modules/`, `.pi/extensions/`, `.pi/agents/` |

When a blocked action is attempted, the sandbox returns an error to the LLM explaining why, and shows a `🛡️ Sandbox blocked` notification in the UI.

#### What's allowed

- All reads/writes/edits **within** the project directory (except protected paths)
- Bash commands for development: `npm`, `pip`, `python`, `node`, `git`, `curl` (without pipe-to-shell), `ls`, `cat`, etc.
- Running dev servers, tests, builds

---

### Customizing Agents

#### Change a model

Edit `.pi/agents/<name>.md` frontmatter:
```yaml
---
name: architect
model: google-antigravity/gpt-oss-120b-medium    # try GPT-OSS for architecture
---
```

#### Change available tools

```yaml
---
name: designer
tools: read, grep, find, ls    # read-only access
---
```

Available tools: `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`
If `tools` is omitted, the agent gets all default tools (read, write, edit, bash).

#### Add a new agent

Create `.pi/agents/my-agent.md`:
```yaml
---
name: my-agent
description: What this agent does and when to use it
tools: read, bash
model: google-antigravity/gemini-3-flash
---

Your system prompt here. Be specific about:
- What the agent should do
- Output format
- Constraints
```

#### Create a new workflow

Create `.pi/prompts/my-workflow.md`:
```yaml
---
description: Short description for autocomplete
---
Use the subagent tool with agentScope "both" to execute as a chain:
1. First, "scout" agent: $@
2. Then, "my-agent" to process: {previous}
```

- `$@` captures all user arguments after the command
- `{previous}` passes the previous chain step's output

---

### Tips

#### Rate limits
- Antigravity is free but rate-limited — if you hit limits, wait a moment and retry
- Start with `/design` to plan before committing to a full `/build`
- Prefer chains over parallel when steps depend on each other (fewer concurrent API calls)
- The orchestrator runs for YOUR conversation — subagents use their own model slots

#### Debugging subagent output
- Press **Ctrl+O** to expand subagent output (full tool calls, markdown)
- Each subagent shows usage stats: turns, tokens, cost, model
- Failed chain steps report which step failed and why

#### When NOT to use subagents
- Quick one-liner changes → ask the orchestrator directly
- Exploratory conversations → talk to the orchestrator
- Tight iterative feedback → single agent or manual orchestration

#### Model switching
Press **Ctrl+P** in pi to cycle models. Switch between `gemini-3.1-pro-high` (reasoning) and `gemini-3-flash` (speed) for your own orchestrator session.

---

### Project Structure

```
noise-man/
├── frontend/                # React/TypeScript app (Vite)
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom hooks (audio, API)
│   │   ├── services/        # API client
│   │   └── types/           # Shared TypeScript types
│   └── package.json
├── backend/                 # FastAPI Python app
│   ├── app/
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Noise generation logic
│   │   └── models/          # Pydantic models
│   └── requirements.txt
├── .pi/                     # Agent configuration
│   ├── agents/              # Agent definitions (7 agents)
│   │   ├── architect.md     # System design (Gemini 3.1 Pro)
│   │   ├── designer.md      # UI/UX specs (Gemini 3 Flash)
│   │   ├── frontend-dev.md  # React implementation (Claude Sonnet 4.5)
│   │   ├── backend-dev.md   # FastAPI implementation (GPT-OSS 120B)
│   │   ├── tester.md        # QA (Gemini 3 Flash)
│   │   ├── reviewer.md      # Code review (Claude Sonnet 4.6)
│   │   └── scout.md         # Recon (Gemini 3 Flash)
│   ├── prompts/             # Workflow slash commands
│   │   ├── build.md         # /build — full pipeline
│   │   ├── design.md        # /design — planning only
│   │   ├── implement.md     # /implement — parallel dev
│   │   ├── add-feature.md   # /add-feature — incremental
│   │   └── test-and-fix.md  # /test-and-fix — QA
│   └── extensions/
│       ├── subagent/        # Subagent orchestration engine
│       │   ├── index.ts
│       │   └── agents.ts
│       └── sandbox.ts       # Security sandbox (all agents)
├── AGENTS.md                # Project context for pi
└── README.md                # This file
```
