
export interface TelegramGroup {
  id: string;
  name: string;
  memberCount: number;
  description: string;
  category: string;
  image: string;
  lastInteraction?: number; // Timestamp of last usage
}

export interface InviteLink {
  id: string;
  link: string;
  groupId: string;
  createdAt: string;
  isUsed: boolean;
  memberLimit: number;
  expiresIn?: number; // Minutes
}

export interface BotState {
  isConnected: boolean;
  botName: string;
  botToken: string;
  apiId: string;
  apiHash: string;
}

export interface GeminiInsight {
  title: string;
  summary: string;
  suggestion: string;
}
