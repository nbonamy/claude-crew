# Send Message

Use the `send-message` MCP tool based on arguments: $ARGUMENTS.
If arguments are empty, try to deduce it from the context.
If you can't ask more details to the user.

`send-message` parameters:
- `from`: Your session ID (provided at startup)
- `to`: Recipient of message 
- `content`: Rest of arguments (everything after first argument)

First call `list-agents` to find available agents, then send the message.
