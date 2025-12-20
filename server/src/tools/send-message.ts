import { z } from 'zod';
import { storage } from '../storage.js';

export const sendMessageSchema = {
  from: z.string().describe('Session ID of the sender'),
  to: z.string().describe('Session ID or name of the recipient'),
  content: z.string().describe('Message content'),
};

export async function sendMessage(args: { from: string; to: string; content: string }) {
  // Resolve recipient (could be session ID or friendly name)
  let recipientId = args.to;
  const recipientByName = storage.findAgentByName(args.to);
  if (recipientByName) {
    recipientId = recipientByName.sessionId;
  }

  // Verify recipient exists
  const recipient = storage.getAgent(recipientId);
  if (!recipient) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Recipient not found: ${args.to}`,
        },
      ],
      isError: true,
    };
  }

  // Send message
  const message = storage.sendMessage(args.from, recipientId, args.content);

  const sender = storage.getAgent(args.from);
  const senderName = sender?.name || args.from.substring(0, 8) + '...';
  console.log(`✉ Message sent: ${senderName} → ${recipient.name} (${args.content.substring(0, 50)}${args.content.length > 50 ? '...' : ''})`);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Message sent to ${recipient.name} (${recipient.sessionId})\nMessage ID: ${message.id}`,
      },
    ],
  };
}
