<script setup lang="ts">
import { useRouter } from 'vue-router';
import KeywordSelector from '@/components/KeywordSelector.vue';
import { useGameStore } from '@/stores/game';
import { ref } from 'vue';

const router = useRouter();
const gameStore = useGameStore();
const loading = ref(false);
const errorMessage = ref('');

const handleStart = async (keyword: string) => {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    await gameStore.startGame(keyword);
    router.push('/game');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '开始游戏失败';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-accent-light via-white to-primary-light flex items-center justify-center p-6">
    <div class="max-w-2xl w-full">
      <!-- 标题 -->
      <div class="text-center mb-12">
        <h1 class="text-6xl font-bold text-primary-dark mb-4 font-serif">
          飞花令
        </h1>
        <p class="text-lg text-gray-600">
          与 AI 对局，体验中国传统诗词游戏
        </p>
      </div>

      <!-- 关键字选择器 -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <KeywordSelector @start="handleStart" />
        
        <!-- 加载提示 -->
        <div v-if="loading" class="mt-4 text-center text-primary">
          正在准备游戏...
        </div>
        
        <!-- 错误提示 -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {{ errorMessage }}
        </div>
      </div>

      <!-- 游戏规则 -->
      <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h3 class="text-xl font-bold text-primary-dark mb-3">📜 游戏规则</h3>
        <ul class="space-y-2 text-gray-700">
          <li>• 选择一个汉字作为关键字，开始游戏</li>
          <li>• AI 先出一句包含关键字的诗句</li>
          <li>• 你需要接着回答一句包含该关键字的诗句</li>
          <li>• 每轮有 3 次机会，答错三次游戏结束</li>
          <li>• 可以使用提示功能获取帮助</li>
          <li>• 若 AI 无法回答，则你获胜！</li>
        </ul>
      </div>
    </div>
  </div>
</template>