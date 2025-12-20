import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { storage } from './storage.js';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'claude-crew' });
});

// Simple REST API for hooks (bypasses MCP)
app.post('/api/register', (req, res) => {
  const { sessionId, baseFolder, name } = req.body;
  if (!sessionId || !baseFolder) {
    return res.status(400).json({ error: 'Missing sessionId or baseFolder' });
  }

  const agent = storage.registerAgent(sessionId, baseFolder, name);
  console.log(`✓ Agent registered: ${agent.name} (${agent.sessionId.substring(0, 8)}...) from ${agent.baseFolder}`);

  res.json({ success: true, agent });
});

app.post('/api/unregister', (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  const agent = storage.getAgent(sessionId);
  const success = storage.unregisterAgent(sessionId);

  if (success) {
    console.log(`✓ Agent unregistered: ${agent?.name || sessionId.substring(0, 8) + '...'}`);
    res.json({ success: true });
  } else {
    console.log(`✗ Failed to unregister: ${sessionId.substring(0, 8)}... (not found)`);
    res.status(404).json({ error: 'Agent not found' });
  }
});

// Streamable HTTP endpoint for MCP
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = randomUUID();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
    });

    // Store the transport by session ID
    transports[sessionId] = transport;

    // Set up onclose handler to clean up transport when closed
    transport.onclose = () => {
      delete transports[sessionId];
    };

    // Connect the transport to a new MCP server
    const server = createServer();
    await server.connect(transport);

    // Handle the request with the transport
    await transport.handleRequest(req, res, { parsedBody: req.body });
  } catch (error) {
    console.error('✗ Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling MCP request');
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Claude Crew MCP Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   MCP: http://localhost:${PORT}/mcp`);
  console.log();
  console.log('📝 To configure Claude Code:');
  console.log();
  console.log('1. Add MCP server (choose scope):');
  console.log('   Local:  claude mcp add --transport http crew --scope local http://localhost:' + PORT + '/mcp');
  console.log('   User:   claude mcp add --transport http crew --scope user http://localhost:' + PORT + '/mcp');
  console.log();
  console.log('2. Install plugin:');
  console.log('   claude --plugin-dir ~/src/claude-crew/plugin');
  console.log();
});
