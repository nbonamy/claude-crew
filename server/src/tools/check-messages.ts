import { z } from 'zod';
import { storage } from '../storage.js';

export const checkMessagesSchema = {
  sessionId: z.string().describe('Session ID to check messages for'),
  markAsRead: z.boolean().optional().describe('Mark messages as read after retrieving (default: true)'),
};

export async function checkMessages(args: { sessionId: string; markAsRead?: boolean }) {
  const markAsRead = args.markAsRead ?? true;
  const messages = storage.getMessages(args.sessionId, markAsRead);

  const agent = storage.getAgent(args.sessionId);
  const agentName = agent?.name || args.sessionId.substring(0, 8) + '...';
  console.log(`📬 Check messages: ${agentName} (${messages.length} message${messages.length !== 1 ? 's' : ''}${messages.length > 0 && markAsRead ? ', marked as read' : ''})`);

  if (messages.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No messages',
        },
      ],
    };
  }

  const messageTexts = messages.map((msg) => {
    const sender = storage.getAgent(msg.from);
    const senderName = sender ? sender.name : msg.from;
    const timestamp = new Date(msg.timestamp).toLocaleString();
    const status = msg.read ? '[READ]' : '[UNREAD]';

    return `${status} From: ${senderName} (${msg.from})\nTime: ${timestamp}\nMessage: ${msg.content}\n---`;
  });

  return {
    content: [
      {
        type: 'text' as const,
        text: `Messages (${messages.length}):\n\n${messageTexts.join('\n\n')}`,
      },
    ],
  };
}
