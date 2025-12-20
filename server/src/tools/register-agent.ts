import { z } from 'zod';
import { storage } from '../storage.js';

export const registerAgentSchema = {
  sessionId: z.string().describe('Session ID of the agent'),
  baseFolder: z.string().describe('Base folder path of the agent'),
  name: z.string().optional().describe('Optional custom name for the agent'),
};

export async function registerAgent(args: { sessionId: string; baseFolder: string; name?: string }) {
  const agent = storage.registerAgent(args.sessionId, args.baseFolder, args.name);
  console.log(`✓ Agent registered: ${agent.name} (${agent.sessionId.substring(0, 8)}...) from ${agent.baseFolder}`);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Agent registered successfully:\n- Session ID: ${agent.sessionId}\n- Name: ${agent.name}\n- Base Folder: ${agent.baseFolder}`,
      },
    ],
  };
}
