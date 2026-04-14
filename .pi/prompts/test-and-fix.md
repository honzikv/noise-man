---
description: Run tests and review code, then fix issues
---
Use the subagent tool with agentScope "both" to execute this workflow as a chain:

1. First, use the "scout" agent to explore the current codebase: $@
2. Then, use the "tester" agent to write and run tests based on the codebase findings (use {previous} placeholder)
3. Then, use the "reviewer" agent to review the code quality and identify issues (use {previous} placeholder)
4. Finally, use the "frontend-dev" agent to fix any critical issues found by the tester and reviewer (use {previous} placeholder)

Execute this as a chain, passing output between steps via {previous}.
