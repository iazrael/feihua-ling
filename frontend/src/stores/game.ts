import { defineStore } from 'pinia';
import type { GameState, HistoryItem } from '@/types/game';

const API_BASE_URL = 'http://localhost:3000/api/v1';

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
    },
    currentHintLevel: 0,
  }),

  getters: {
    gameDuration: (state): number => {
      if (!state.stats.startTime) return 0;
      const endTime = state.stats.endTime || Date.now();
      return Math.floor((endTime - state.stats.startTime) / 1000);
    },
  },

  actions: {
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
        };

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

        return data;
      } catch (error) {
        console.error('AI出句失败:', error);
        throw error;
      }
    },

    // 获取提示
    async getHint() {
      try {
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
        return data;
      } catch (error) {
        console.error('获取提示失败:', error);
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
  },
});
