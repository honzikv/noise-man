---
description: Add a feature - scout, design, implement, test
---
Use the subagent tool with agentScope "both" to execute this workflow as a chain:

1. First, use the "scout" agent to explore the codebase and understand what exists for: $@
2. Then, use the "architect" agent to plan the feature, including any API changes needed (use {previous} placeholder)
3. Then, use the "backend-dev" agent to implement any backend changes from the plan (use {previous} placeholder)
4. Then, use the "frontend-dev" agent to implement the frontend changes from the plan (use {previous} placeholder)
5. Finally, use the "tester" agent to test the new feature (use {previous} placeholder)

Execute this as a chain, passing output between steps via {previous}.
