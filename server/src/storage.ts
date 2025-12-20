/**
 * In-memory storage for agents and message queues
 */

export interface Agent {
  sessionId: string;
  name: string;
  baseFolder: string;
  registeredAt: number;
  lastActivity: number;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  read: boolean;
}

class Storage {
  private agents = new Map<string, Agent>();
  private messages: Message[] = [];
  private messageIdCounter = 0;

  // Agent management
  registerAgent(sessionId: string, baseFolder: string, customName?: string): Agent {
    const name = customName || this.deriveNameFromFolder(baseFolder);
    const agent: Agent = {
      sessionId,
      name,
      baseFolder,
      registeredAt: Date.now(),
      lastActivity: Date.now(),
    };
    this.agents.set(sessionId, agent);
    return agent;
  }

  unregisterAgent(sessionId: string): boolean {
    return this.agents.delete(sessionId);
  }

  getAgent(sessionId: string): Agent | undefined {
    return this.agents.get(sessionId);
  }

  findAgentByName(name: string): Agent | undefined {
    const lowerName = name.toLowerCase();
    for (const agent of this.agents.values()) {
      if (agent.name.toLowerCase().includes(lowerName)) {
        return agent;
      }
    }
    return undefined;
  }

  listAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  updateLastActivity(sessionId: string): void {
    const agent = this.agents.get(sessionId);
    if (agent) {
      agent.lastActivity = Date.now();
    }
  }

  // Message management
  sendMessage(from: string, to: string, content: string): Message {
    const message: Message = {
      id: `msg_${++this.messageIdCounter}`,
      from,
      to,
      content,
      timestamp: Date.now(),
      read: false,
    };
    this.messages.push(message);
    this.updateLastActivity(from);
    return message;
  }

  getMessages(sessionId: string, markAsRead = false): Message[] {
    const messages = this.messages.filter((m) => m.to === sessionId);
    if (markAsRead) {
      messages.forEach((m) => (m.read = true));
    }
    this.updateLastActivity(sessionId);
    return messages;
  }

  getUnreadCount(sessionId: string): number {
    return this.messages.filter((m) => m.to === sessionId && !m.read).length;
  }

  clearReadMessages(): number {
    const initialLength = this.messages.length;
    this.messages = this.messages.filter((m) => !m.read);
    return initialLength - this.messages.length;
  }

  // Helper methods
  private deriveNameFromFolder(baseFolder: string): string {
    const parts = baseFolder.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'unknown';
  }
}

export const storage = new Storage();
