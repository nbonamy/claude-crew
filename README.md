# Claude Crew

Async agent-to-agent communication for Claude Code via MCP.

## Quick Start

**Terminal 1**: Start the shared server
```bash
npx @nbonamy/claude-crew
```

**Terminal 2**: Start Claude Code with plugin
```bash
claude --plugin-dir ~/src/claude-crew/plugin
```

The plugin connects to the HTTP server on `http://localhost:3000/mcp`.
Now you have `/crew:send`, `/crew:check`, `/crew:agents` available!

Multiple Claude Code instances can connect to the same server.

## Development

```bash
# Install and build locally
make install
make build

# Start server in dev mode (watch mode)
make dev

# With pm2
make start   # Start
make stop    # Stop
make logs    # View logs
```

## Architecture

```
claude-crew/
├── server/          # MCP server (TypeScript)
│   ├── src/
│   │   ├── storage.ts      # In-memory agents + messages
│   │   ├── server.ts       # McpServer with 5 MCP tools
│   │   ├── index.ts        # Express + SSE transport + REST API
│   │   └── tools/          # MCP tool implementations
│   └── ecosystem.config.cjs
└── plugin/          # Claude Code plugin
    ├── hooks/              # Auto-register/unregister on session start/end
    ├── commands/           # /crew:send, /crew:check, /crew:agents
    └── scripts/            # Hook shell scripts
```

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
   - Calls REST API to register agent
   - Outputs session ID to Claude's context in JSON format with `hookSpecificOutput`
   - Example output includes agent name and session ID for use in commands

2. **SessionEnd Hook**
   - Runs when Claude Code exits
   - Calls REST API to unregister agent

3. **Commands** (namespaced as /crew:*)
   - `/crew:agents` - List all registered agents
   - `/crew:send <recipient> <message>` - Send message to another agent
   - `/crew:check` - Check and respond to messages

## Setup

### 1. Start the Server

```bash
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

## Usage

### Basic Workflow

**Terminal 1** (~/project-desktop):
```bash
$ claude --plugin-dir ~/src/claude-crew/plugin

Agent registered with crew as: project-desktop
Your session ID is: fa0b9d64-10f5-4086-a911-b310747efc00
Use this session ID when calling crew MCP tools

> /crew:agents
# Shows all registered agents

> /crew:send server Can you run the tests?
# Message sent!
```

**Terminal 2** (~/project-server):
```bash
$ claude --plugin-dir ~/src/claude-crew/plugin

Agent registered with crew as: project-server
Your session ID is: 50714b14-d077-48c7-a41b-c9c8fe6e3f63

> /crew:check
# [UNREAD] From: project-desktop
# Message: Can you run the tests?

> Running tests...
# (agent executes the request)

> /crew:send desktop Tests passed! All 42 tests green.
# Message sent!
```

### Commands

#### `/crew:agents`
Lists all registered agents with status and message counts.

#### `/crew:send <recipient> <message>`
Send a message to another agent.
- Recipient can be: friendly name, partial match (case-insensitive), or session ID
- If no arguments provided, Claude will ask for details
- Uses `$ARGUMENTS` to parse the message content

#### `/crew:check`
Check messages. The agent will:
1. Retrieve all pending messages (uses session ID from startup or from `list-agents`)
2. Display them with sender info and timestamps
3. Mark them as read
4. **If a message asks a question**: Reply using `send-message` MCP tool
5. **If a message is an instruction**: Execute it
6. **Otherwise**: Just display results in a clear format

## Agent Naming

Agents are automatically named from their base folder:
- `/Users/name/projects/station1-desktop` → "station1-desktop"
- `/Users/name/work/api-server` → "api-server"
- `/tmp/test` → "test"

Use `/crew:agents` to see all agent names and find the right recipient.

## Message Flow

1. **Registration**: SessionStart hook → REST API → Agent registered → Session ID output to context
2. **Send**: `/crew:send` → Claude calls `send-message` MCP tool → Message queued
3. **Check**: `/crew:check` → Claude calls `check-messages` MCP tool → Messages retrieved
4. **Response**: Claude reads message → Executes instruction or replies automatically
5. **Cleanup**: SessionEnd hook → REST API → Agent unregistered

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

## Key Design Decisions

### Why REST API + MCP?

Hooks run at session startup/shutdown, before MCP connection is established. They need simple HTTP endpoints. The MCP tools are used by Claude during the session for sending/checking messages.

### Why Streamable HTTP?

Streamable HTTP is the modern transport protocol for MCP, replacing the deprecated SSE transport. It provides a cleaner request/response model and better compatibility with standard HTTP clients.

### Why In-Memory Storage?

Messages are ephemeral - they're meant for real-time coordination between active sessions. Persistence would add complexity without much benefit. If all agents are offline, there's no one to read the messages anyway.

### Why Session ID in Context?

The startup hook outputs the session ID so Claude has it available throughout the session. This eliminates the need for Claude to look up its own session ID when calling MCP tools.

## Troubleshooting

### Plugin not showing up
Don't copy to ~/.claude/plugins/ - use `--plugin-dir` instead. Manual copying doesn't register the plugin in `installed_plugins.json`.

### Hook hangs on startup
Check that the server is running (`curl http://localhost:3000/health`). Hooks have a 30-second timeout.

### Messages not received
Both agents must be registered. Use `/crew:agents` to verify registration. Check server logs with `make logs`.

### Session ID issues
The startup hook should output your session ID. If not, check the hook logs or restart Claude Code.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `AGENT_MANAGER_URL` - Server URL for hooks (default: http://localhost:3000)

## License

MIT
