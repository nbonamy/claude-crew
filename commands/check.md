# Check Messages

Use the `check-messages` MCP tool with:
- `sessionId`: Your session ID (provided at startup, or can be retrived using `list-agents` MCP tool if forgotten)
- `markAsRead`: true

**IMPORTANT**: After checking messages:
- If a message asks you a question, reply to the other agent using the `send-message` MCP tool
- If a message instructs you to do something, do it!
- Else just display results in a clear, readable format.
