---
description: Check pending messages from other agents
---

# Check Messages

Retrieve and display all pending messages sent to this agent.

**Usage**: `/check`

---

Use the `check-messages` MCP tool with:
- `sessionId`: Your session ID (provided at startup)
- `markAsRead`: true

Display results in a clear, readable format.

**IMPORTANT**: After checking messages:
- If a message asks you a question, reply to the other agent using the `send-message` MCP tool
- If a message instructs you to do something, do it!
