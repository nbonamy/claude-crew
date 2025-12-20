import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { createServer } from './server.js';
import { storage } from './storage.js';
import type { Request, Response } from 'express';

const MCP_PORT = 3000;
const REST_PORT = process.env.REST_PORT || 3001;

async function startMcpServer() {
  // MCP Server using stdio transport
  const transport = new StdioServerTransport();
  const mcpServer = createServer();
  await mcpServer.connect(transport);
}

function startRestApiServer() {
  // REST API server for hooks (register/unregister)
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'claude-crew' });
  });

  // REST API for hooks
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

  app.listen(REST_PORT, () => {
    console.log(`📌 Hook API running on http://localhost:${REST_PORT}`);
  });
}

// Start both servers
startMcpServer().catch((error) => {
  console.error('✗ MCP Server error:', error);
  process.exit(1);
});

startRestApiServer();
