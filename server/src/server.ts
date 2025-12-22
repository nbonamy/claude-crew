import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAgent, registerAgentSchema } from './tools/register-agent.js';
import { unregisterAgent, unregisterAgentSchema } from './tools/unregister-agent.js';
import { listAgents, listAgentsSchema } from './tools/list-agents.js';
import { sendMessage, sendMessageSchema } from './tools/send-message.js';
import { checkMessages, checkMessagesSchema } from './tools/check-messages.js';
import { broadcastMessage, broadcastMessageSchema } from './tools/broadcast-message.js';

export function createServer() {
  const server = new McpServer({
    name: 'claude-crew',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {},
    },
  });

  // Register tools
  server.registerTool(
    'register-agent',
    {
      title: 'Register Agent',
      description: 'Register a new agent with the manager',
      inputSchema: registerAgentSchema,
    },
    registerAgent
  );

  server.registerTool(
    'unregister-agent',
    {
      title: 'Unregister Agent',
      description: 'Unregister an agent from the manager',
      inputSchema: unregisterAgentSchema,
    },
    unregisterAgent
  );

  server.registerTool(
    'list-agents',
    {
      title: 'List Agents',
      description: 'List all registered agents with their status and message counts',
      inputSchema: listAgentsSchema,
    },
    listAgents
  );

  server.registerTool(
    'send-message',
    {
      title: 'Send Message',
      description: 'Send a message to another agent (use session ID or friendly name)',
      inputSchema: sendMessageSchema,
    },
    sendMessage
  );

  server.registerTool(
    'check-messages',
    {
      title: 'Check Messages',
      description: 'Check messages for an agent',
      inputSchema: checkMessagesSchema,
    },
    checkMessages
  );

  server.registerTool(
    'broadcast-message',
    {
      title: 'Broadcast Message',
      description: 'Send a message to all other connected agents',
      inputSchema: broadcastMessageSchema,
    },
    broadcastMessage
  );

  return server;
}
