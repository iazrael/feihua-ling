<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/stores/game';
import { soundService, SoundType } from '@/services/soundService';

const gameStore = useGameStore();
const emit = defineEmits<{
  timeout: []
}>();

let timerInterval: number | null = null;

// 倒计时颜色类
const timerColorClass = computed(() => {
  // 语音识别中，显示蓝色
  if (gameStore.timerPausedByVoice || gameStore.voiceInputInProgress) {
    return 'text-blue-500';
  }
  
  const time = gameStore.timeRemaining;
  if (time <= 2) return 'text-red-500 animate-pulse';
  if (time <= 5) return 'text-yellow-500 animate-bounce';
  return 'text-green-500';
});

// 倒计时进度百分比
const progressPercentage = computed(() => {
  return (gameStore.timeRemaining / gameStore.timerDuration) * 100;
});

// 进度条颜色
const progressColorClass = computed(() => {
  // 语音识别中，显示蓝色
  if (gameStore.timerPausedByVoice || gameStore.voiceInputInProgress) {
    return 'bg-blue-500';
  }
  
  const time = gameStore.timeRemaining;
  if (time <= 2) return 'bg-red-500';
  if (time <= 5) return 'bg-yellow-500';
  return 'bg-green-500';
});

// 组件挂载时检查是否需要启动倒计时
onMounted(() => {
  if (gameStore.timerActive) {
    startCountdown();
  }
});

// 监听计时器激活状态
watch(() => gameStore.timerActive, (active) => {
  if (active) {
    startCountdown();
  } else {
    stopCountdown();
  }
});

// 启动倒计时
function startCountdown() {
  stopCountdown(); // 清除之前的计时器
  
  timerInterval = window.setInterval(() => {
    if (!gameStore.timerActive) {
      stopCountdown();
      return;
    }

    const elapsed = (Date.now() - gameStore.roundStartTime) / 1000;
    const remaining = Math.max(0, gameStore.timerDuration - elapsed);
    
    gameStore.updateTimeRemaining(Math.ceil(remaining));

    // 播放滴答音（最后3秒）
    if (remaining <= 3 && remaining > 0 && Math.ceil(remaining) !== Math.ceil(remaining - 0.1)) {
      soundService.play(SoundType.TICK);
    }

    // 超时处理
    if (remaining <= 0) {
      stopCountdown();
      handleTimeout();
    }
  }, 100);
}

// 停止倒计时
function stopCountdown() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// 处理超时
function handleTimeout() {
  soundService.play(SoundType.GAME_OVER);
  gameStore.handleTimeout();
  emit('timeout');
}

// 组件卸载时清理
onUnmounted(() => {
  stopCountdown();
});
</script>

<template>
  <div class="timer-container bg-white rounded-lg shadow-lg p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm text-gray-600">
        {{ gameStore.timerPausedByVoice || gameStore.voiceInputInProgress ? '语音识别中' : '剩余时间' }}
      </span>
      <div :class="['text-4xl font-bold tabular-nums', timerColorClass]">
        {{ gameStore.timeRemaining }}秒
      </div>
    </div>
    
    <!-- 进度条 -->
    <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
      <div
        :class="['h-full transition-all duration-300 ease-linear', progressColorClass]"
        :style="{ width: `${progressPercentage}%` }"
      />
    </div>

    <!-- 语音识别状态提示 -->
    <div v-if="gameStore.timerPausedByVoice || gameStore.voiceInputInProgress" class="mt-2 text-center">
      <span class="text-blue-500 text-sm font-semibold animate-pulse">
        🎤 语音识别中...计时器已暂停
      </span>
    </div>

    <!-- 超时警告 -->
    <div v-else-if="gameStore.timeRemaining <= 3 && gameStore.timerActive" class="mt-2 text-center">
      <span class="text-red-500 text-sm font-semibold animate-pulse">
        ⚠️ 时间不多了！
      </span>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.animate-pulse {
  animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce {
  animation: bounce 0.5s ease-in-out infinite;
}
</style>
