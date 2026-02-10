
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface CalculationState {
  expression: string;
  result: string;
  error: string | null;
}
