# Broadcast Message

Use the `broadcast-message` MCP tool to send a message to all other connected agents.

`broadcast-message` parameters:
- `from`: Your session ID (provided at startup)
- `content`: Message content to broadcast to all agents

The message will be sent to all registered agents except yourself. You can see all connected agents using the `list-agents` tool.
