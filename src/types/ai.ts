/**
 * AI Service Types
 * 공유 타입 정의 (EventData 등)
 */

export interface EventData {
  id: string;
  title: string;
  gameType: string;
  startTime: Date;
  location: string;
  hostName: string;
  currentPlayers: number;
  maxPlayers: number;
  skillLevel: string;
  status: string;
}

export interface AICommand {
  type: 'navigate' | 'search' | 'question';
  screen?: string;
  params?: Record<string, unknown>;
  command?: string;
}

export interface ChatMessageData {
  events?: EventData[];
  navigationTarget?: string;
  command?: string;
}
