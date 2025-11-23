import { defineStore } from 'pinia';
import type { GameState, HistoryItem } from '@/types/game';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const DEFAULT_TIMER_DURATION = 60; // 默认倒计时20秒

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    keyword: '',
    isPlaying: false,
    currentRound: 0,
    remainingChances: 3,
    history: [],
    usedPoems: [],
    stats: {
      totalRounds: 0,
      correct: 0,
      wrong: 0,
      hintsUsed: 0,
      startTime: 0,
      timeoutCount: 0,
      fuzzyMatchCount: 0,
      averageResponseTime: 0,
      fastestResponse: 0,
      perfectRounds: 0,
    },
    currentHintLevel: 0,
    timeRemaining: DEFAULT_TIMER_DURATION,
    timerActive: false,
    roundStartTime: 0,
    soundEnabled: localStorage.getItem('soundEnabled') !== 'false',
    soundVolume: parseFloat(localStorage.getItem('soundVolume') || '0.8'),
    timerDuration: parseInt(localStorage.getItem('timerDuration') || String(DEFAULT_TIMER_DURATION)),
    // 语音输入相关状态
    timerPausedByVoice: false,
    pausedTimeRemaining: 0,
    voiceInputInProgress: false,
    // 多轮对话上下文
    conversationContext: {
      recentHistory: [],
      userStyle: {
        commonErrors: [],
        accuracyRate: 0,
        averageConfidence: 'medium',
      },
    },
  }),

  getters: {
    gameDuration: (state): number => {
      if (!state.stats.startTime) return 0;
      const endTime = state.stats.endTime || Date.now();
      return Math.floor((endTime - state.stats.startTime) / 1000);
    },
  },

  actions: {
    // 设置音效
    setSoundEnabled(enabled: boolean) {
      this.soundEnabled = enabled;
      localStorage.setItem('soundEnabled', String(enabled));
    },

    setSoundVolume(volume: number) {
      this.soundVolume = volume;
      localStorage.setItem('soundVolume', String(volume));
    },

    // 设置倒计时时长
    setTimerDuration(duration: number) {
      this.timerDuration = duration;
      localStorage.setItem('timerDuration', String(duration));
    },

    // 启动倒计时
    startTimer() {
      this.timeRemaining = this.timerDuration;
      this.timerActive = true;
      this.roundStartTime = Date.now();
    },

    // 停止倒计时
    stopTimer() {
      this.timerActive = false;
    },

    // 更新剩余时间
    updateTimeRemaining(time: number) {
      this.timeRemaining = time;
    },

    // 暂停计时器（语音输入）
    pauseTimerForVoice() {
      if (this.timerActive) {
        this.stopTimer();
        this.pausedTimeRemaining = this.timeRemaining;
        this.timerPausedByVoice = true;
        this.voiceInputInProgress = true;
      }
    },

    // 恢复计时器（语音输入完成）
    resumeTimerAfterVoice() {
      if (this.timerPausedByVoice) {
        this.timeRemaining = this.pausedTimeRemaining;
        this.timerActive = true;
        this.timerPausedByVoice = false;
        this.voiceInputInProgress = false;
      }
    },

    // 取消语音暂停状态
    cancelVoicePause() {
      this.timerPausedByVoice = false;
      this.voiceInputInProgress = false;
      this.pausedTimeRemaining = 0;
    },

    // 处理超时
    handleTimeout() {
      this.stopTimer();
      this.remainingChances--;
      this.stats.timeoutCount++;
      this.stats.wrong++;
    },
    // 开始新游戏
    async startGame(keyword: string) {
      try {
        const response = await fetch(`${API_BASE_URL}/game/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '无法开始游戏');
        }

        const data = await response.json();
        
        // 重置游戏状态
        this.keyword = data.keyword;
        this.isPlaying = true;
        this.currentRound = 1;
        this.remainingChances = 3;
        this.history = [];
        this.usedPoems = [];
        this.currentHintLevel = 0;
        this.stats = {
          totalRounds: 0,
          correct: 0,
          wrong: 0,
          hintsUsed: 0,
          startTime: Date.now(),
          timeoutCount: 0,
          fuzzyMatchCount: 0,
          averageResponseTime: 0,
          fastestResponse: 0,
          perfectRounds: 0,
        };
        
        // 重置会话上下文
        this.resetConversationContext();

        // 添加AI的首句
        const aiSentence: HistoryItem = {
          round: 1,
          speaker: 'AI',
          sentence: data.firstSentence.content,
          title: data.firstSentence.title,
          author: data.firstSentence.author,
        };
        this.history.push(aiSentence);
        this.usedPoems.push(data.firstSentence.content);

        // 启动倒计时
        this.startTimer();

        return data;
      } catch (error) {
        console.error('开始游戏失败:', error);
        throw error;
      }
    },

    // 验证用户诗句
    async verifyUserSentence(sentence: string) {
      try {
        const response = await fetch(`${API_BASE_URL}/game/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sentence,
            char: this.keyword,
            usedPoems: this.usedPoems,
          }),
        });

        const data = await response.json();

        if (data.valid) {
          // 停止计时器并计算响应时间
          this.stopTimer();
          const responseTime = (Date.now() - this.roundStartTime) / 1000;
          
          // 答对了
          const userSentence: HistoryItem = {
            round: this.currentRound,
            speaker: '玩家',
            sentence,
            title: data.poem?.title,
            author: data.poem?.author,
            isCorrect: true,
          };
          this.history.push(userSentence);
          this.usedPoems.push(sentence);
          this.stats.correct++;
          this.stats.totalRounds++;
          
          // 记录模糊匹配
          if (data.matchType === 'homophone' || data.matchType === 'fuzzy') {
            this.stats.fuzzyMatchCount++;
          }
          
          // 更新响应时间统计
          if (this.stats.averageResponseTime === 0) {
            this.stats.averageResponseTime = responseTime;
          } else {
            this.stats.averageResponseTime = 
              (this.stats.averageResponseTime * (this.stats.correct - 1) + responseTime) / this.stats.correct;
          }
          
          if (this.stats.fastestResponse === 0 || responseTime < this.stats.fastestResponse) {
            this.stats.fastestResponse = responseTime;
          }
          
          // 记录完美回合（无提示、无错误、首次答对）
          if (this.currentHintLevel === 0 && this.remainingChances === 3) {
            this.stats.perfectRounds++;
          }
          
          this.currentHintLevel = 0; // 重置提示级别
          this.remainingChances = 3; // 重置机会

          // AI回合
          await this.aiTurn();
        } else {
          // 答错了
          this.remainingChances--;
          this.stats.wrong++;
          
          if (this.remainingChances <= 0) {
            // 游戏结束
            this.stopTimer();
            this.endGame();
          }
        }

        return data;
      } catch (error) {
        console.error('验证诗句失败:', error);
        throw error;
      }
    },

    // AI回合
    async aiTurn() {
      try {
        const response = await fetch(`${API_BASE_URL}/game/ai-turn`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            char: this.keyword,
            usedPoems: this.usedPoems,
          }),
        });

        if (!response.ok) {
          // AI输了
          this.stopTimer();
          this.endGame(true);
          throw new Error('AI也想不出来了，你赢了！');
        }

        const data = await response.json();
        
        this.currentRound++;
        const aiSentence: HistoryItem = {
          round: this.currentRound,
          speaker: 'AI',
          sentence: data.sentence,
          title: data.title,
          author: data.author,
        };
        this.history.push(aiSentence);
        this.usedPoems.push(data.sentence);

        // AI出句后启动倒计时
        this.startTimer();

        return data;
      } catch (error) {
        console.error('AI出句失败:', error);
        throw error;
      }
    },

    // 获取随机关键字
    async getRandomKeyword() {
      try {
        const response = await fetch(`${API_BASE_URL}/game/random-char`);
        if (!response.ok) throw new Error('无法获取随机关键字');
        
        const data = await response.json();
        return data.char;
      } catch (error) {
        console.error('获取随机关键字失败:', error);
        throw error;
      }
    },

    // 获取提示
    async getHint() {
      try {
        // 暂停倒计时
        this.stopTimer();
        
        this.currentHintLevel++;
        this.stats.hintsUsed++;

        const response = await fetch(`${API_BASE_URL}/game/hint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: this.keyword,
            hintLevel: this.currentHintLevel,
          }),
        });

        const data = await response.json();
        
        // 显示提示后恢复倒计时
        setTimeout(() => {
          this.startTimer();
        }, 2000);
        
        return data;
      } catch (error) {
        console.error('获取提示失败:', error);
        // 错误时也恢复倒计时
        this.startTimer();
        throw error;
      }
    },

    // 跳过当前回合
    skipRound() {
      this.remainingChances--;
      if (this.remainingChances <= 0) {
        this.endGame();
      }
    },

    // 结束游戏
    endGame(playerWin = false) {
      this.isPlaying = false;
      this.stats.endTime = Date.now();
      if (playerWin) {
        // 玩家获胜特殊标记
        this.stats.totalRounds = this.currentRound;
      }
    },

    // 重置游戏
    resetGame() {
      this.$reset();
    },

    // 更新会话上下文
    updateConversationContext(recognizedText: string, correctedSentence: string, isCorrect: boolean) {
      const historyLimit = 3; // 保留最近3轮记录
      
      // 添加本轮记录
      this.conversationContext.recentHistory.push({
        round: this.currentRound,
        recognizedText,
        correctedSentence,
        isCorrect,
      });
      
      // 只保留最近N轮记录
      if (this.conversationContext.recentHistory.length > historyLimit) {
        this.conversationContext.recentHistory.shift();
      }
      
      // 更新用户答题风格统计
      this.updateUserStyle(recognizedText, correctedSentence, isCorrect);
    },

    // 更新用户答题风格
    updateUserStyle(recognizedText: string, correctedSentence: string, isCorrect: boolean) {
      // 统计常见识别错误
      if (recognizedText !== correctedSentence) {
        // 找出字符差异
        for (let i = 0; i < Math.min(recognizedText.length, correctedSentence.length); i++) {
          if (recognizedText[i] !== correctedSentence[i]) {
            const errorPattern = `${correctedSentence[i]}->${recognizedText[i]}`;
            if (!this.conversationContext.userStyle.commonErrors.includes(errorPattern)) {
              this.conversationContext.userStyle.commonErrors.push(errorPattern);
              // 只保留最常见的10个错误模式
              if (this.conversationContext.userStyle.commonErrors.length > 10) {
                this.conversationContext.userStyle.commonErrors.shift();
              }
            }
          }
        }
      }
      
      // 计算识别准确率
      const totalAttempts = this.conversationContext.recentHistory.length;
      const correctAttempts = this.conversationContext.recentHistory.filter((h: any) => h.isCorrect).length;
      this.conversationContext.userStyle.accuracyRate = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;
      
      // 更新平均置信度
      if (this.conversationContext.userStyle.accuracyRate >= 0.8) {
        this.conversationContext.userStyle.averageConfidence = 'high';
      } else if (this.conversationContext.userStyle.accuracyRate >= 0.5) {
        this.conversationContext.userStyle.averageConfidence = 'medium';
      } else {
        this.conversationContext.userStyle.averageConfidence = 'low';
      }
    },

    // 获取会话上下文（供LLM调用）
    getConversationContext() {
      return this.conversationContext;
    },

    // 重置会话上下文（新游戏开始时）
    resetConversationContext() {
      this.conversationContext = {
        recentHistory: [],
        userStyle: {
          commonErrors: [],
          accuracyRate: 0,
          averageConfidence: 'medium',
        },
      };
    },
  },
});
