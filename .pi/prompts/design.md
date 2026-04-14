---
description: Design phase only - architect creates specs and API contracts
---
Use the subagent tool with agentScope "both" to execute this workflow as a chain:

1. First, use the "scout" agent to explore the current codebase and find all relevant code for: $@
2. Then, use the "architect" agent to design the full architecture, API contracts, and data models for "$@" using the scout's findings (use {previous} placeholder)
3. Finally, use the "designer" agent to create UI/UX specs and component designs for "$@" based on the architect's specifications (use {previous} placeholder)

Execute this as a chain, passing output between steps via {previous}. Do NOT implement - just return the design.
