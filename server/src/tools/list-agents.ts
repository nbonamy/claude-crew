import { storage } from '../storage.js';

export const listAgentsSchema = {};

export async function listAgents() {
  const agents = storage.listAgents();
  console.log(`📋 List agents: ${agents.length} registered`);

  if (agents.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No agents currently registered',
        },
      ],
    };
  }

  const agentList = agents.map((agent) => {
    const unreadCount = storage.getUnreadCount(agent.sessionId);
    const timeSinceActivity = Date.now() - agent.lastActivity;
    const minutesAgo = Math.floor(timeSinceActivity / 60000);

    return {
      sessionId: agent.sessionId,
      name: agent.name,
      baseFolder: agent.baseFolder,
      unreadMessages: unreadCount,
      lastActivityMinutesAgo: minutesAgo,
    };
  });

  const text = agents
    .map((agent, i) => {
      const info = agentList[i];
      return `${agent.name} (${agent.sessionId}):\n  Folder: ${agent.baseFolder}\n  Unread: ${info.unreadMessages}\n  Last active: ${info.lastActivityMinutesAgo}m ago`;
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Registered agents (${agents.length}):\n\n${text}`,
      },
    ],
  };
}
