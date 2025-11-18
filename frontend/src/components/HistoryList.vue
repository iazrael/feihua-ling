<template>
  <div class="history-list">
    <h3 class="text-xl font-bold mb-4 text-primary-dark">对战记录</h3>
    <div ref="scrollContainer" class="space-y-3 max-h-96 overflow-y-auto">
      <div
        v-for="item in history"
        :key="`${item.round}-${item.speaker}`"
        class="p-4 rounded-lg transition-all duration-300"
        :class="item.speaker === 'AI' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-blue-50 border-l-4 border-blue-500'"
      >
        <div class="flex justify-between items-start mb-2">
          <span class="font-semibold text-sm" :class="item.speaker === 'AI' ? 'text-green-700' : 'text-blue-700'">
            {{ item.speaker }} - 第{{ item.round }}回合
          </span>
          <span v-if="item.isCorrect !== undefined" class="text-xs">
            {{ item.isCorrect ? '✓ 正确' : '✗ 错误' }}
          </span>
        </div>
        <div class="text-gray-800 mb-1 poem-text">{{ item.sentence }}</div>
        <div v-if="item.title && item.author" class="text-xs text-gray-600">
          《{{ item.title }}》 - {{ item.author }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { HistoryItem } from '@/types/game';

const props = defineProps<{
  history: HistoryItem[];
}>();

const scrollContainer = ref<HTMLElement | null>(null);

// 监听历史记录变化，自动滚动到底部
watch(() => props.history.length, async () => {
  await nextTick();
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: scrollContainer.value.scrollHeight,
      behavior: 'smooth'
    });
  }
});
</script>

<style scoped>
.poem-text {
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
}
</style>
