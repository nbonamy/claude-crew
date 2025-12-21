# Claude Crew

Async agent-to-agent communication for Claude Code via MCP.

## Installation

Install the crew plugin from the marketplace:

```bash
# Add the nbonamy marketplace
/plugin marketplace add nbonamy/claude-marketplace

# Install the crew plugin
/plugin install crew@nbonamy
```

Then follow the Quick Start section below to start the server.

If you installed the marketplace or plugin using the `/plugin` command in Claude Code, you need to exit and restart Claude Code.

## Quick Start

**Terminal 1**: Start the shared server
```bash
npx @nbonamy/claude-crew
```

**Terminal 2**: Start Claude Code
```bash
claude
```

The plugin connects to the HTTP server on `http://localhost:3000/mcp`.
Now you have `/crew:send`, `/crew:check`, `/crew:list` available!

Multiple Claude Code instances can connect to the same server.

## Usage

### Basic Workflow

**Terminal 1** (~/project-desktop):
```bash
$ claude

Agent registered with crew as: project-desktop
Your crew session ID is: fa0b9d64-10f5-4086-a911-b310747efc00
Use this session ID when calling crew MCP tools (check-messages, send-message, etc.)

> /crew:list
# Shows all registered agents

> /crew:send ask server to run the tests and send me a report
# Message sent!
```

**Terminal 2** (~/project-server):
```bash
$ claude

Agent registered with crew as: project-server
Your crew session ID is: 50714b14-d077-48c7-a41b-c9c8fe6e3f63
Use this session ID when calling crew MCP tools (check-messages, send-message, etc.)

> /crew:check
# [UNREAD] From: project-desktop
# Message: Can you run the tests?

> Running tests...
# (agent executes the request)

> Sending report to desktop: All 42 tests green!
# Message sent!
```

### Commands

#### `/crew:list`
List all registered agents with their session IDs, folders, and message counts.

#### `/crew:send`
Send a message to another agent. Natural language parsing - e.g., `/crew:send a message to server about running tests` or just `/crew:send` and Claude deduces from context.

#### `/crew:check`
Check your messages. Claude will:
1. Retrieve all pending messages (uses session ID from startup)
2. Mark them as read
3. Reply to questions, execute instructions, or display results

## How It Works

### Server Components

1. **MCP Server (Streamable HTTP Transport)**
   - Listens on http://localhost:3000/mcp
   - Provides 5 MCP tools: register-agent, unregister-agent, list-agents, send-message, check-messages
   - Each HTTP connection gets its own server instance sharing the same in-memory storage

2. **REST API (for Hooks)**
   - POST /api/register - Called by SessionStart hook
   - POST /api/unregister - Called by SessionEnd hook
   - These bypass MCP since hooks run before MCP connection is established

3. **In-Memory Storage**
   - Agents: Map of sessionId → {sessionId, name, baseFolder, timestamps}
   - Messages: Array of {id, from, to, content, timestamp, read}
   - Shared across all MCP server instances

### Plugin Components

1. **SessionStart Hook**
   - Runs when Claude Code starts
   - Calls REST API `/api/register` to register agent with its folder path
   - Returns `hookSpecificOutput` with `additionalContext` containing:
     - Agent name
     - Session ID
     - Instructions for using crew MCP tools
   - Session ID is required for all crew MCP tool calls

2. **SessionEnd Hook**
   - Runs when Claude Code exits
   - Calls REST API `/api/unregister` to remove agent from crew

3. **Commands**
   - `/crew:list` - List all registered agents
   - `/crew:send` - Send message to another agent
   - `/crew:check` - Check and respond to messages

## Development Mode Setup

### 1. Start the Server

```bash
# Using npm package (simplest)
npx @nbonamy/claude-crew

# Development (with hot reload)
make dev

# Production (with pm2)
make start
make logs    # View logs
make stop    # Stop server
```

### 2. Configure MCP Server

Choose a scope:
- **local** - Only for current project
- **user** - Available in all projects on your machine

```bash
# User scope (recommended)
claude mcp add --transport http crew --scope user http://localhost:3000/mcp

# Local scope (current project only)
claude mcp add --transport http crew --scope local http://localhost:3000/mcp

# Verify
claude mcp list
```

### 3. Install Plugin

**IMPORTANT**: Use `--plugin-dir` - don't copy to ~/.claude/plugins/ (won't register properly)

```bash
claude --plugin-dir ~/src/claude-crew/plugin
```

## Agent Naming

Agents are automatically named from their base folder:
- `/Users/name/projects/station1-desktop` → "station1-desktop"
- `/Users/name/work/api-server` → "api-server"
- `/tmp/test` → "test"

Use `/crew:list` to see all agent names and find the right recipient.

## Message Flow

1. **Registration**: SessionStart hook → REST API `/api/register` → Agent registered → `hookSpecificOutput` with session ID & instructions added to context
2. **Send**: `/crew:send` → Claude calls `send-message` MCP tool → Message queued
3. **Check**: `/crew:check` → Claude calls `check-messages` MCP tool → Messages retrieved
4. **Response**: Claude reads message → Executes instruction or replies automatically
5. **Cleanup**: SessionEnd hook → REST API `/api/unregister` → Agent unregistered

## Development

### Makefile Commands

```bash
make install   # Install dependencies
make build     # Build TypeScript
make dev       # Watch mode (hot reload)
make start     # Start with pm2
make stop      # Stop pm2
make restart   # Restart pm2
make logs      # View pm2 logs
make clean     # Clean build artifacts
```

### Server Logs

The server logs all operations:
```
✓ Agent registered: project-desktop (fa0b9d64...) from /Users/name/projects/desktop
📋 List agents: 2 registered
✉ Message sent: project-server → project-desktop (Can you run the tests?)
📬 Check messages: project-desktop (1 message, marked as read)
✓ Agent unregistered: project-desktop
```

### Testing Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Register agent (REST API)
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test123","baseFolder":"/tmp/test"}'

# List agents (REST API)
curl http://localhost:3000/api/list
```

## Troubleshooting

### Plugin not showing up
Don't copy to ~/.claude/plugins/ - use `--plugin-dir` instead. Manual copying doesn't register the plugin in `installed_plugins.json`.

### Hook hangs on startup
Check that the server is running (`curl http://localhost:3000/health`). Hooks have a 30-second timeout.

### Messages not received
Both agents must be registered. Use `/crew:list` to verify registration. Check server logs with `make logs`.

### Session ID issues
The startup hook should output your session ID. If not, check the hook logs or restart Claude Code.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `AGENT_MANAGER_URL` - Server URL for hooks (default: http://localhost:3000)

## License

MIT
