// 游戏类型定义

export interface PoemSentence {
  content: string;
  title: string;
  author: string;
}

export interface HistoryItem {
  round: number;
  speaker: 'AI' | '玩家';
  sentence: string;
  title?: string;
  author?: string;
  isCorrect?: boolean;
}

export interface GameStats {
  totalRounds: number;
  correct: number;
  wrong: number;
  hintsUsed: number;
  startTime: number;
  endTime?: number;
  timeoutCount: number;
  fuzzyMatchCount: number;
  averageResponseTime: number;
  fastestResponse: number;
  perfectRounds: number;
}

export interface GameState {
  keyword: string;
  isPlaying: boolean;
  currentRound: number;
  remainingChances: number;
  history: HistoryItem[];
  usedPoems: string[];
  stats: GameStats;
  currentHintLevel: number;
  timeRemaining: number;
  timerActive: boolean;
  roundStartTime: number;
  soundEnabled: boolean;
  soundVolume: number;
  timerDuration: number; // 倒计时时长（秒）
}
