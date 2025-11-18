<script setup lang="ts">
import { computed } from 'vue';
import type { GameStats } from '@/types/game';

interface Props {
  keyword: string;
  stats: GameStats;
}

const props = defineProps<Props>();

// 等级称号
const titleInfo = computed(() => {
  const correct = props.stats.correct;
  if (correct >= 10) return { title: '诗词小状元', emoji: '🏆', color: 'text-yellow-500' };
  if (correct >= 7) return { title: '诗词小秀才', emoji: '📖', color: 'text-blue-500' };
  if (correct >= 5) return { title: '诗词小童生', emoji: '✨', color: 'text-purple-500' };
  if (correct >= 3) return { title: '诗词小学徒', emoji: '🌱', color: 'text-green-500' };
  return { title: '诗词小萌新', emoji: '🌸', color: 'text-pink-500' };
});

// 鼓励语
const encouragement = computed(() => {
  const correct = props.stats.correct;
  if (correct >= 7) return '太棒了！你是诗词小天才！';
  if (correct >= 5) return '很不错哦！继续加油就能成为高手！';
  if (correct >= 3) return '好的开始！熟能生巧，多练习就会更厉害！';
  return '每一次尝试都是进步！继续努力！';
});

// 格式化时间
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}分${secs}秒` : `${secs}秒`;
};

// 计算正确率
const accuracyRate = computed(() => {
  const total = props.stats.correct + props.stats.wrong;
  if (total === 0) return 0;
  return Math.round((props.stats.correct / total) * 100);
});
</script>

<template>
  <div class="share-card w-[750px] bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 p-8 rounded-3xl relative overflow-hidden">
    <!-- 装饰星星 -->
    <div class="absolute top-4 right-4 text-4xl animate-spin-slow">⭐</div>
    <div class="absolute bottom-4 left-4 text-3xl animate-spin-slow" style="animation-delay: 0.5s;">✨</div>
    <div class="absolute top-1/2 left-8 text-2xl animate-bounce" style="animation-delay: 1s;">🌟</div>
    
    <!-- 顶部勋章区 -->
    <div class="text-center mb-6 animate-bounce-in">
      <div class="text-8xl mb-3">{{ titleInfo.emoji }}</div>
      <h2 :class="['text-4xl font-bold mb-2', titleInfo.color]">
        {{ titleInfo.title }}
      </h2>
      <p class="text-2xl text-gray-700 font-medium">{{ encouragement }}</p>
    </div>

    <!-- 关键字展示 -->
    <div class="bg-white/80 rounded-2xl p-6 mb-6 shadow-xl">
      <div class="text-center">
        <div class="text-lg text-gray-600 mb-2">本局关键字</div>
        <div class="text-7xl font-bold text-accent font-serif">{{ keyword }}</div>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-gradient-to-br from-green-100 to-green-50 rounded-xl p-5 text-center shadow-lg transform hover:scale-105 transition-transform">
        <div class="text-6xl mb-2">{{ stats.correct }}</div>
        <div class="text-lg text-gray-700 font-semibold">答对题数</div>
      </div>
      <div class="bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl p-5 text-center shadow-lg transform hover:scale-105 transition-transform">
        <div class="text-6xl mb-2">{{ accuracyRate }}%</div>
        <div class="text-lg text-gray-700 font-semibold">正确率</div>
      </div>
    </div>

    <!-- 附加信息 -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="bg-white/70 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold text-purple-600">{{ stats.totalRounds }}</div>
        <div class="text-sm text-gray-600">总回合</div>
      </div>
      <div class="bg-white/70 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold text-orange-600">{{ stats.hintsUsed }}</div>
        <div class="text-sm text-gray-600">使用提示</div>
      </div>
      <div class="bg-white/70 rounded-lg p-4 text-center">
        <div class="text-3xl font-bold text-pink-600">{{ formatDuration(stats.endTime ? Math.floor((stats.endTime - stats.startTime) / 1000) : 0) }}</div>
        <div class="text-sm text-gray-600">用时</div>
      </div>
    </div>

    <!-- 特殊成就 -->
    <div v-if="stats.perfectRounds > 0 || stats.fastestResponse < 3" class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-4 mb-6">
      <div class="text-center">
        <div class="text-2xl font-bold text-orange-700 mb-2">🎉 特殊成就 🎉</div>
        <div class="flex justify-center gap-4 flex-wrap">
          <div v-if="stats.perfectRounds > 0" class="bg-white px-4 py-2 rounded-lg">
            <span class="text-lg">⚡ 完美回合 × {{ stats.perfectRounds }}</span>
          </div>
          <div v-if="stats.fastestResponse > 0 && stats.fastestResponse < 3" class="bg-white px-4 py-2 rounded-lg">
            <span class="text-lg">🚀 闪电回答</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部品牌 -->
    <div class="text-center text-gray-500 text-sm mt-6 pt-4 border-t border-gray-300">
      <p class="font-medium">飞花令 - 诗词对战游戏</p>
      <p class="text-xs mt-1">让孩子爱上古诗词</p>
    </div>
  </div>
</template>

<style scoped>
@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-spin-slow {
  animation: spin-slow 10s linear infinite;
}
</style>
