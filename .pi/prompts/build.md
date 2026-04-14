---
description: Full project workflow - architect designs, then frontend and backend devs implement in parallel
---
Use the subagent tool with agentScope "both" to execute this workflow as a chain:

1. First, use the "scout" agent to explore the current codebase state and find all relevant code for: $@
2. Then, use the "architect" agent to design the architecture and API contracts for "$@" using the scout's findings (use {previous} placeholder)
3. Then, use the "backend-dev" agent to implement the backend based on the architect's design (use {previous} placeholder)
4. Then, use the "frontend-dev" agent to implement the frontend based on the architect's design and knowing the backend is ready (use {previous} placeholder)
5. Finally, use the "tester" agent to write and run tests for both frontend and backend (use {previous} placeholder)

Execute this as a chain, passing output between steps via {previous}.
