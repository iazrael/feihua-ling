<template>
  <div class="keyword-selector">
    <h2 class="text-2xl font-bold mb-6 text-primary-dark text-center">选择关键字开始游戏</h2>
    
    <!-- 热门关键字 -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-3 text-gray-700">热门关键字</h3>
      <div class="grid grid-cols-5 gap-3">
        <button
          v-for="char in popularKeywords"
          :key="char"
          @click="selectKeyword(char)"
          class="keyword-btn bg-primary text-white hover:bg-primary-dark transition-all duration-300 transform hover:scale-105"
        >
          {{ char }}
        </button>
      </div>
    </div>

    <!-- 随机选择 -->
    <div class="mb-6">
      <button
        @click="selectRandomKeyword"
        :disabled="loading"
        class="w-full py-4 px-6 bg-gradient-to-r from-accent to-accent-dark text-white rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="!loading">🎲 随机选择关键字</span>
        <span v-else>正在获取...</span>
      </button>
    </div>

    <!-- 自定义输入 -->
    <div>
      <h3 class="text-lg font-semibold mb-3 text-gray-700">自定义输入</h3>
      <div class="flex gap-3">
        <input
          v-model="customKeyword"
          @keyup.enter="startWithCustom"
          maxlength="1"
          placeholder="输入一个汉字"
          class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors"
        />
        <button
          @click="startWithCustom"
          :disabled="!customKeyword || loading"
          class="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          开始
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '@/stores/game';

const emit = defineEmits<{
  start: [keyword: string]
}>();

const gameStore = useGameStore();

const popularKeywords = ['春', '花', '月', '夜', '风', '雨', '云', '水', '山', '雪'];
const customKeyword = ref('');
const loading = ref(false);
const errorMessage = ref('');

const selectKeyword = (char: string) => {
  emit('start', char);
};

const selectRandomKeyword = async () => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const char = await gameStore.getRandomKeyword();
    emit('start', char);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '获取随机关键字失败';
  } finally {
    loading.value = false;
  }
};

const startWithCustom = () => {
  if (customKeyword.value) {
    emit('start', customKeyword.value);
    customKeyword.value = '';
  }
};
</script>

<style scoped>
.keyword-btn {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
  font-size: 1.25rem;
}
</style>