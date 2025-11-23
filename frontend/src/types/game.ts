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

// 会话上下文历史记录项
export interface ConversationHistoryItem {
  round: number;
  recognizedText: string;
  correctedSentence: string;
  isCorrect: boolean;
}

// 用户答题风格
export interface UserStyle {
  commonErrors: string[];     // 常见识别错误（如"晓->小"）
  accuracyRate: number;        // 识别准确率
  averageConfidence: string;   // 平均置信度：high/medium/low
}

// 会话上下文
export interface ConversationContext {
  recentHistory: ConversationHistoryItem[];  // 最近3轮答题记录
  userStyle: UserStyle;                      // 用户答题风格统计
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
  // 语音输入相关状态
  timerPausedByVoice: boolean;    // 标记计时器是否因语音输入暂停
  pausedTimeRemaining: number;     // 暂停时的剩余时间
  voiceInputInProgress: boolean;   // 标记语音识别是否进行中
  // 多轮对话上下文
  conversationContext: ConversationContext;
}
