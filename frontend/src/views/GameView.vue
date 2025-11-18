<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import PoemDisplay from '@/components/PoemDisplay.vue';
import InputPanel from '@/components/InputPanel.vue';
import HistoryList from '@/components/HistoryList.vue';
import TimerDisplay from '@/components/TimerDisplay.vue';
import { soundService, SoundType } from '@/services/soundService';
import { audioService } from '@/services/audioService';

const router = useRouter();
const gameStore = useGameStore();
const inputPanelRef = ref<InstanceType<typeof InputPanel> | null>(null);

// 初始化音效服务和申请麦克风权限
onMounted(async () => {
  await soundService.init();
  
  // 申请麦克风权限并显示提示信息
  const permissionGranted = await audioService.requestMicrophonePermission();
  if (!permissionGranted) {
    // 如果权限被拒绝，显示提示信息
    inputPanelRef.value?.showError('麦克风权限被拒绝，无法使用语音输入功能。请在浏览器设置中允许麦克风权限，然后刷新页面。');
  }
});

// 如果游戏未开始，跳转回首页
if (!gameStore.isPlaying) {
  router.push('/');
}

const currentAIPoem = computed(() => {
  const aiHistory = gameStore.history.filter(h => h.speaker === 'AI');
  return aiHistory[aiHistory.length - 1];
});

const handleSubmit = async (sentence: string) => {
  try {
    const result = await gameStore.verifyUserSentence(sentence);
    
    if (!result.valid) {
      // 播放错误音效
      if (gameStore.remainingChances > 0) {
        soundService.play(SoundType.WRONG);
      } else {
        soundService.play(SoundType.GAME_OVER);
      }
      
      // 显示错误消息
      const errorMessage = result.message || '答案错误';
      inputPanelRef.value?.showError(errorMessage);
      
      if (gameStore.remainingChances <= 0) {
        // 游戏结束
        setTimeout(() => {
          router.push('/result');
        }, 1500);
      }
    } else {
      // 播放正确音效
      soundService.play(SoundType.CORRECT);
      
      // 如果是模糊匹配，显示提示
      if (result.matchType === 'homophone' || result.matchType === 'fuzzy') {
        const hint = result.message + '\n' + 
          (result.correctedSentence ? `标准诗句：${result.correctedSentence}` : '');
        inputPanelRef.value?.showHint(hint);
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('你赢了')) {
      // AI输了，玩家获胜
      soundService.play(SoundType.CORRECT);
      setTimeout(() => {
        router.push('/result');
      }, 1500);
    } else {
      inputPanelRef.value?.showError(error instanceof Error ? error.message : '提交失败');
    }
  }
};

const handleHint = async () => {
  try {
    const result = await gameStore.getHint();
    inputPanelRef.value?.showHint(result.hint);
  } catch {
    inputPanelRef.value?.showError('获取提示失败');
  }
};

const handleSkip = () => {
  gameStore.skipRound();
  if (gameStore.remainingChances <= 0) {
    soundService.play(SoundType.GAME_OVER);
    router.push('/result');
  }
};

const handleQuit = () => {
  if (confirm('确定要退出游戏吗？')) {
    gameStore.endGame();
    router.push('/');
  }
};

const handleTimeout = () => {
  // 超时后立即结束游戏，忽略剩余机会
  soundService.play(SoundType.GAME_OVER);
  gameStore.endGame();
  router.push('/result');
};
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-accent-light via-white to-primary-light p-6">
    <div class="max-w-6xl mx-auto">
      <!-- 顶部状态栏 -->
      <div class="bg-white rounded-lg shadow-lg p-4 mb-6 flex justify-between items-center">
        <div class="flex gap-6">
          <div class="text-center">
            <div class="text-sm text-gray-600">回合</div>
            <div class="text-2xl font-bold text-primary">{{ gameStore.currentRound }}</div>
          </div>
          <div class="text-center">
            <div class="text-sm text-gray-600">关键字</div>
            <div class="text-3xl font-bold text-accent font-serif">{{ gameStore.keyword }}</div>
          </div>
          <div class="text-center">
            <div class="text-sm text-gray-600">剩余机会</div>
            <div class="text-2xl font-bold" :class="gameStore.remainingChances <= 1 ? 'text-red-500' : 'text-green-500'">
              {{ gameStore.remainingChances }}
            </div>
          </div>
        </div>
        <button
          @click="handleQuit"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          退出游戏
        </button>
      </div>

      <!-- 倒计时显示 -->
      <TimerDisplay @timeout="handleTimeout" />

      <!-- 主游戏区域 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- 左侧：AI诗句展示和玩家输入 -->
        <div class="lg:col-span-2 space-y-6">
          <!-- AI的诗句 -->
          <div v-if="currentAIPoem">
            <PoemDisplay
              :speaker="currentAIPoem.speaker"
              :sentence="currentAIPoem.sentence"
              :title="currentAIPoem.title || ''"
              :author="currentAIPoem.author || ''"
            />
          </div>

          <!-- 玩家输入区 -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <InputPanel
              ref="inputPanelRef"
              @submit="handleSubmit"
              @hint="handleHint"
              @skip="handleSkip"
            />
          </div>

          <!-- 游戏统计 -->
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-xl font-bold text-primary-dark mb-4">📊 游戏统计</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <div class="text-sm text-gray-600">答对</div>
                <div class="text-2xl font-bold text-green-600">{{ gameStore.stats.correct }}</div>
              </div>
              <div class="text-center p-3 bg-red-50 rounded-lg">
                <div class="text-sm text-gray-600">答错</div>
                <div class="text-2xl font-bold text-red-600">{{ gameStore.stats.wrong }}</div>
              </div>
              <div class="text-center p-3 bg-yellow-50 rounded-lg">
                <div class="text-sm text-gray-600">提示</div>
                <div class="text-2xl font-bold text-yellow-600">{{ gameStore.stats.hintsUsed }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：历史记录 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow-lg p-6 sticky top-6">
            <HistoryList :history="gameStore.history" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>