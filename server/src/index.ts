import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server.js';
import { storage } from './storage.js';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

// Helper to check if a request is an MCP initialization request
function isInitializeRequest(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    'jsonrpc' in body &&
    'method' in body &&
    (body as Record<string, unknown>).method === 'initialize'
  );
}

const PORT = process.env.PORT || 3333;
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

// MCP endpoint for both GET and POST
app.all('/mcp', async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId && transports[sessionId]) {
      // Reuse existing transport for this session
      await transports[sessionId].handleRequest(req, res, req.body);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New initialization request - create new transport and server
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid: string) => {
          // Store transport when session is initialized
          transports[sid] = transport;
          // console.log(`✓ Session initialized: ${sid.substring(0, 8)}...`);
        }
      });

      // Set up onclose handler to clean up
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          console.log(`🔌 Transport closed for session ${sid.substring(0, 8)}...`);
          delete transports[sid];
        }
      };

      // Create and connect MCP server to this transport
      const server = createServer();
      await server.connect(transport);

      // Handle the initialization request
      await transport.handleRequest(req, res, req.body);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: Invalid session or not an initialization request'
        },
        id: null
      });
    }
  } catch (error) {
    console.error('✗ Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
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

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  for (const sessionId in transports) {
    try {
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  process.exit(0);
});
