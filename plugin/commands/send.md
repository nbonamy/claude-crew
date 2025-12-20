---
description: Send a message to another agent
---

# Send Message

Send a message to another registered agent using the crew MCP server.

**Usage**: `/send <recipient> <message>`

**Example**: `/send desktop Hey, can you run the tests?`

---

Use the `send-message` MCP tool with:
- `from`: Your session ID (provided at startup)
- `to`: First argument from user ($1)
- `content`: Rest of arguments (everything after first argument)

First call `list-agents` to find available agents, then send the message.
