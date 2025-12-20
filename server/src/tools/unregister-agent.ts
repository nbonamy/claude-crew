import { z } from 'zod';
import { storage } from '../storage.js';

export const unregisterAgentSchema = {
  sessionId: z.string().describe('Session ID of the agent to unregister'),
};

export async function unregisterAgent(args: { sessionId: string }) {
  const agent = storage.getAgent(args.sessionId);
  const success = storage.unregisterAgent(args.sessionId);

  if (!success) {
    console.log(`✗ Failed to unregister: ${args.sessionId.substring(0, 8)}... (not found)`);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Agent with session ID ${args.sessionId} not found`,
        },
      ],
      isError: true,
    };
  }

  console.log(`✓ Agent unregistered: ${agent?.name || args.sessionId.substring(0, 8) + '...'}`);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Agent ${args.sessionId} unregistered successfully`,
      },
    ],
  };
}
