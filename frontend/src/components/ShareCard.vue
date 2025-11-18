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
  if (correct >= 10) return { title: '诗词小状元', emoji: '🏆', color: '#eab308' }; // yellow-500
  if (correct >= 7) return { title: '诗词小秀才', emoji: '📖', color: '#3b82f6' }; // blue-500
  if (correct >= 5) return { title: '诗词小童生', emoji: '✨', color: '#a855f7' }; // purple-500
  if (correct >= 3) return { title: '诗词小学徒', emoji: '🌱', color: '#22c55e' }; // green-500
  return { title: '诗词小萌新', emoji: '🌸', color: '#ec4899' }; // pink-500
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
  <div class="share-card w-[750px] p-8 rounded-3xl relative overflow-hidden" style="background: linear-gradient(to bottom right, #fdf2f8, #fefce8, #eff6ff);">
    <!-- 装饰星星 -->
    <div class="absolute top-4 right-4 text-4xl">⭐</div>
    <div class="absolute bottom-4 left-4 text-3xl">✨</div>
    <div class="absolute top-1/2 left-8 text-2xl">🌟</div>
    
    <!-- 顶部勋章区 -->
    <div class="text-center mb-6">
      <div class="text-8xl mb-3">{{ titleInfo.emoji }}</div>
      <h2 class="text-4xl font-bold mb-2" :style="{ color: titleInfo.color }">
        {{ titleInfo.title }}
      </h2>
      <p class="text-2xl font-medium" style="color: #374151;">{{ encouragement }}</p>
    </div>

    <!-- 关键字展示 -->
    <div class="rounded-2xl p-6 mb-6 shadow-xl" style="background: rgba(255, 255, 255, 0.8);">
      <div class="text-center">
        <div class="text-lg mb-2" style="color: #4b5563;">本局关键字</div>
        <div class="text-7xl font-bold font-serif" style="color: #d4af37;">{{ keyword }}</div>
      </div>
    </div>

    <!-- 统计数据 -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="rounded-xl p-5 text-center shadow-lg transform hover:scale-105 transition-transform" style="background: linear-gradient(to bottom right, #dcfce7, #f0fdf4);">
        <div class="text-6xl mb-2">{{ stats.correct }}</div>
        <div class="text-lg font-semibold" style="color: #374151;">答对题数</div>
      </div>
      <div class="rounded-xl p-5 text-center shadow-lg transform hover:scale-105 transition-transform" style="background: linear-gradient(to bottom right, #dbeafe, #eff6ff);">
        <div class="text-6xl mb-2">{{ accuracyRate }}%</div>
        <div class="text-lg font-semibold" style="color: #374151;">正确率</div>
      </div>
    </div>

    <!-- 附加信息 -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <div class="rounded-lg p-4 text-center" style="background: rgba(255, 255, 255, 0.7);">
        <div class="text-3xl font-bold" style="color: #9333ea;">{{ stats.totalRounds }}</div>
        <div class="text-sm" style="color: #4b5563;">总回合</div>
      </div>
      <div class="rounded-lg p-4 text-center" style="background: rgba(255, 255, 255, 0.7);">
        <div class="text-3xl font-bold" style="color: #ea580c;">{{ stats.hintsUsed }}</div>
        <div class="text-sm" style="color: #4b5563;">使用提示</div>
      </div>
      <div class="rounded-lg p-4 text-center" style="background: rgba(255, 255, 255, 0.7);">
        <div class="text-3xl font-bold" style="color: #db2777;">{{ formatDuration(stats.endTime ? Math.floor((stats.endTime - stats.startTime) / 1000) : 0) }}</div>
        <div class="text-sm" style="color: #4b5563;">用时</div>
      </div>
    </div>

    <!-- 特殊成就 -->
    <div v-if="stats.perfectRounds > 0 || stats.fastestResponse < 3" class="rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #fef3c7, #fed7aa);">
      <div class="text-center">
        <div class="text-2xl font-bold mb-2" style="color: #c2410c;">🎉 特殊成就 🎉</div>
        <div class="flex justify-center gap-4 flex-wrap">
          <div v-if="stats.perfectRounds > 0" class="px-4 py-2 rounded-lg" style="background: #ffffff;">
            <span class="text-lg">⚡ 完美回合 × {{ stats.perfectRounds }}</span>
          </div>
          <div v-if="stats.fastestResponse > 0 && stats.fastestResponse < 3" class="px-4 py-2 rounded-lg" style="background: #ffffff;">
            <span class="text-lg">🚀 闪电回答</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部品牌 -->
    <div class="text-center text-sm mt-6 pt-4" style="color: #6b7280; border-top: 1px solid #d1d5db;">
      <p class="font-medium">飞花令 - 诗词对战游戏</p>
      <p class="text-xs mt-1">让孩子爱上古诗词</p>
    </div>
  </div>
</template>
