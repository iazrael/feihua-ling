<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';

const router = useRouter();
const gameStore = useGameStore();

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
};

const evaluation = computed(() => {
  const correct = gameStore.stats.correct;
  if (correct >= 10) return { text: '诗词大师！🎊', color: 'text-yellow-600' };
  if (correct >= 7) return { text: '诗词高手！🎉', color: 'text-green-600' };
  if (correct >= 5) return { text: '略有小成！👏', color: 'text-blue-600' };
  if (correct >= 3) return { text: '继续加油！💪', color: 'text-purple-600' };
  return { text: '多多练习！📚', color: 'text-gray-600' };
});

const handlePlayAgain = () => {
  gameStore.resetGame();
  router.push('/');
};

const handleBackHome = () => {
  gameStore.resetGame();
  router.push('/');
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-accent-light via-white to-primary-light flex items-center justify-center p-6">
    <div class="max-w-2xl w-full">
      <!-- 结果卡片 -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <!-- 标题 -->
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-primary-dark mb-2">游戏结束</h1>
          <p :class="['text-3xl font-bold', evaluation.color]">{{ evaluation.text }}</p>
        </div>

        <!-- 关键字 -->
        <div class="text-center mb-8 p-6 bg-gradient-to-br from-primary-light to-accent-light rounded-lg">
          <div class="text-sm text-gray-600 mb-2">本局关键字</div>
          <div class="text-5xl font-bold text-accent font-serif">{{ gameStore.keyword }}</div>
        </div>

        <!-- 统计数据 -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-sm text-gray-600">总回合数</div>
            <div class="text-3xl font-bold text-blue-600">{{ gameStore.stats.totalRounds }}</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-sm text-gray-600">答对</div>
            <div class="text-3xl font-bold text-green-600">{{ gameStore.stats.correct }}</div>
          </div>
          <div class="text-center p-4 bg-red-50 rounded-lg">
            <div class="text-sm text-gray-600">答错</div>
            <div class="text-3xl font-bold text-red-600">{{ gameStore.stats.wrong }}</div>
          </div>
          <div class="text-center p-4 bg-yellow-50 rounded-lg">
            <div class="text-sm text-gray-600">使用提示</div>
            <div class="text-3xl font-bold text-yellow-600">{{ gameStore.stats.hintsUsed }}次</div>
          </div>
        </div>

        <!-- 游戏时长 -->
        <div class="text-center p-4 bg-purple-50 rounded-lg mb-8">
          <div class="text-sm text-gray-600">游戏时长</div>
          <div class="text-2xl font-bold text-purple-600">{{ formatDuration(gameStore.gameDuration) }}</div>
        </div>

        <!-- 按钮 -->
        <div class="flex gap-4">
          <button
            @click="handlePlayAgain"
            class="flex-1 py-4 bg-primary text-white rounded-lg font-semibold text-lg hover:bg-primary-dark transition-all duration-300 transform hover:scale-105"
          >
            再来一局
          </button>
          <button
            @click="handleBackHome"
            class="flex-1 py-4 bg-gray-500 text-white rounded-lg font-semibold text-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
          >
            返回首页
          </button>
        </div>
      </div>

      <!-- 历史记录（可选展开） -->
      <div class="mt-6 bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold text-primary-dark mb-4">📜 本局对战记录</h3>
        <div class="max-h-96 overflow-y-auto space-y-2">
          <div
            v-for="item in gameStore.history"
            :key="`${item.round}-${item.speaker}`"
            class="p-3 rounded-lg"
            :class="item.speaker === 'AI' ? 'bg-green-50' : 'bg-blue-50'"
          >
            <div class="text-sm font-semibold mb-1" :class="item.speaker === 'AI' ? 'text-green-700' : 'text-blue-700'">
              {{ item.speaker }} - 第{{ item.round }}回合
            </div>
            <div class="text-gray-800 font-serif">{{ item.sentence }}</div>
            <div v-if="item.title && item.author" class="text-xs text-gray-600 mt-1">
              《{{ item.title }}》 - {{ item.author }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
