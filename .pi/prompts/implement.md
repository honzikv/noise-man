---
description: Implement frontend and backend in parallel from existing design specs
---
Use the subagent tool with agentScope "both". First, use the "scout" agent to find all existing design specs and code for: $@

Then use the subagent tool in parallel mode with these tasks:
1. "backend-dev" agent: Implement the backend API based on the design specs found. {previous}
2. "frontend-dev" agent: Implement the frontend UI based on the design specs found. {previous}

Execute the scout first as a single agent, then use the parallel mode for the two developers.
