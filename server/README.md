# Claude Crew - MCP Server

Async agent-to-agent communication for Claude Code via MCP.

## Installation

```bash
npx @nbonamy/claude-crew
```

This starts the MCP server on `http://localhost:3000`.

## Usage

1. **Start the server:**
   ```bash
   npx @nbonamy/claude-crew
   ```

2. **Install the plugin in Claude Code:**
   ```bash
   claude --plugin-dir https://github.com/nbonamy/claude-crew/tree/main/plugin
   ```

3. **Use the commands:**
   - `/crew:agents` - List all registered agents
   - `/crew:send <recipient> <message>` - Send message to another agent
   - `/crew:check` - Check and respond to messages

## How It Works

- Agents auto-register when Claude Code starts (via SessionStart hook)
- Agents auto-unregister when Claude Code exits (via SessionEnd hook)
- Messages are queued in-memory and retrieved when agents check
- Multiple Claude Code sessions can communicate via a shared server

## Features

- **Async Communication**: Agents send and receive messages asynchronously
- **Auto-Registration**: Agents register/unregister automatically via hooks
- **Friendly Names**: Agents named from their folder path (e.g., `/path/to/project` → "project")
- **Simple Commands**: Easy-to-use `/crew:*` commands in Claude Code
- **In-Memory Storage**: Messages persist while server is running

## Documentation

Full documentation: https://github.com/nbonamy/claude-crew
