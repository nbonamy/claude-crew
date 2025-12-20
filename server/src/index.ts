import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createServer } from './server.js';
import { storage } from './storage.js';
import type { Request, Response } from 'express';

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

// Store transports by session ID
const transports: Record<string, SSEServerTransport> = {};

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

// SSE endpoint for establishing the stream
app.get('/sse', async (req: Request, res: Response) => {
  
  // console.log('📡 New SSE connection');

  try {
    // Create a new SSE transport for the client
    const transport = new SSEServerTransport('/messages', res);

    // Store the transport by session ID
    const sessionId = transport.sessionId;
    transports[sessionId] = transport;

    // Set up onclose handler to clean up transport when closed
    transport.onclose = () => {
      // console.log(`🔌 SSE transport closed for session ${sessionId}`);
      delete transports[sessionId];
    };

    // Connect the transport to a new MCP server
    const server = createServer();
    await server.connect(transport);

    // console.log(`✓ SSE stream established with session ID: ${sessionId}`);
  } catch (error) {
    console.error('✗ Error establishing SSE stream:', error);
    if (!res.headersSent) {
      res.status(500).send('Error establishing SSE stream');
    }
  }
});

// Messages endpoint for receiving client JSON-RPC requests
app.post('/messages', async (req: Request, res: Response) => {
  // Extract session ID from URL query parameter
  const sessionId = req.query.sessionId as string | undefined;

  if (!sessionId) {
    console.error('✗ No session ID provided in request URL');
    res.status(400).send('Missing sessionId parameter');
    return;
  }

  const transport = transports[sessionId];
  if (!transport) {
    console.error(`✗ No active transport found for session ID: ${sessionId}`);
    res.status(404).send('Session not found');
    return;
  }

  try {
    // Handle the POST message with the transport
    await transport.handlePostMessage(req, res, req.body);
  } catch (error) {
    console.error('✗ Error handling request:', error);
    if (!res.headersSent) {
      res.status(500).send('Error handling request');
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Claude Crew MCP Server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   SSE: http://localhost:${PORT}/sse`);
  console.log();
  console.log('📝 To configure Claude Code:');
  console.log();
  console.log('1. Add MCP server (choose scope):');
  console.log('   Local:  claude mcp add --transport sse crew --scope local http://localhost:' + PORT + '/sse');
  console.log('   User:   claude mcp add --transport sse crew --scope user http://localhost:' + PORT + '/sse');
  console.log();
  console.log('2. Install plugin:');
  console.log('   claude --plugin-dir ~/src/claude-crew/plugin');
  console.log();
});
