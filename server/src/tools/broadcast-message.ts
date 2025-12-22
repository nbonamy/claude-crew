import { z } from 'zod';
import { storage } from '../storage.js';

export const broadcastMessageSchema = {
  from: z.string().describe('Session ID of the sender'),
  content: z.string().describe('Message content to broadcast'),
};

export async function broadcastMessage(args: { from: string; content: string }) {
  const sender = storage.getAgent(args.from);
  if (!sender) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Sender not found',
        },
      ],
      isError: true,
    };
  }

  const agents = storage.listAgents()
    .filter(a => a.sessionId !== args.from);

  let sent = 0;
  for (const agent of agents) {
    storage.sendMessage(args.from, agent.sessionId, args.content);
    sent++;
  }

  const senderName = sender.name || args.from.substring(0, 8) + '...';
  console.log(`📢 Broadcast message sent by ${senderName} to ${sent} agent(s) (${args.content.substring(0, 50)}${args.content.length > 50 ? '...' : ''})`);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Broadcast message sent to ${sent} agent(s)`,
      },
    ],
  };
}
