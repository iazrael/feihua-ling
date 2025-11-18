<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores/game';
import ShareCard from '@/components/ShareCard.vue';
import { soundService, SoundType } from '@/services/soundService';
import html2canvas from 'html2canvas';

const router = useRouter();
const gameStore = useGameStore();
const shareCardRef = ref<HTMLElement | null>(null);
const isGenerating = ref(false);

// 初始化时播放结算音效
onMounted(() => {
  soundService.play(SoundType.RESULT);
});

const handlePlayAgain = () => {
  gameStore.resetGame();
  router.push('/');
};

const handleBackHome = () => {
  gameStore.resetGame();
  router.push('/');
};

// 生成并保存图片
const handleSaveImage = async () => {
  if (!shareCardRef.value || isGenerating.value) return;
  
  isGenerating.value = true;
  
  try {
    const canvas = await html2canvas(shareCardRef.value, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    
    // 转换为 Blob
    canvas.toBlob((blob) => {
      if (!blob) {
        alert('生成图片失败，请重试');
        return;
      }
      
      // 下载图片
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `飞花令-${gameStore.keyword}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('图片已保存！');
    }, 'image/png');
  } catch (error) {
    console.error('生成图片失败:', error);
    alert('生成图片失败，请重试');
  } finally {
    isGenerating.value = false;
  }
};

// 分享功能（使用 Web Share API）
const handleShare = async () => {
  if (!shareCardRef.value || isGenerating.value) return;
  
  // 检查浏览器是否支持 Web Share API
  if (!navigator.share) {
    // 降级为保存图片
    handleSaveImage();
    return;
  }
  
  isGenerating.value = true;
  
  try {
    const canvas = await html2canvas(shareCardRef.value, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert('生成图片失败，请重试');
        return;
      }
      
      try {
        const file = new File([blob], `飞花令-${gameStore.keyword}.png`, { type: 'image/png' });
        await navigator.share({
          title: '我的飞花令成绩',
          text: `我在飞花令游戏中答对了${gameStore.stats.correct}题！`,
          files: [file],
        });
      } catch (err) {
        // 用户取消分享或分享失败
        console.log('分享取消或失败:', err);
      }
    }, 'image/png');
  } catch (error) {
    console.error('生成分享内容失败:', error);
    alert('生成分享内容失败，请重试');
  } finally {
    isGenerating.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6" style="background: linear-gradient(to bottom right, #fce7f3, #fef9c3, #dbeafe);">
    <div class="max-w-4xl w-full">
      <!-- 结算卡片 -->
      <div ref="shareCardRef" class="mb-6 flex justify-center">
        <ShareCard :keyword="gameStore.keyword" :stats="gameStore.stats" />
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4 justify-center mb-6">
        <button
          @click="handleSaveImage"
          :disabled="isGenerating"
          class="px-8 py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style="background: linear-gradient(to right, #22c55e, #16a34a);"
        >
          {{ isGenerating ? '生成中...' : '💾 保存图片' }}
        </button>
        <button
          @click="handleShare"
          :disabled="isGenerating"
          class="px-8 py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          style="background: linear-gradient(to right, #3b82f6, #2563eb);"
        >
          📤 分享成绩
        </button>
      </div>

      <!-- 游戏控制按钮 -->
      <div class="flex gap-4 justify-center">
        <button
          @click="handlePlayAgain"
          class="flex-1 max-w-xs py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          style="background: linear-gradient(to right, #a855f7, #9333ea);"
        >
          🎮 再来一局
        </button>
        <button
          @click="handleBackHome"
          class="flex-1 max-w-xs py-4 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          style="background: linear-gradient(to right, #6b7280, #4b5563);"
        >
          🏠 返回首页
        </button>
      </div>

      <!-- 历史记录（可选展开） -->
      <div class="mt-8 bg-white rounded-2xl shadow-2xl p-6">
        <h3 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span class="text-3xl mr-2">📜</span>
          本局对战记录
        </h3>
        <div class="max-h-96 overflow-y-auto space-y-3">
          <div
            v-for="item in gameStore.history"
            :key="`${item.round}-${item.speaker}`"
            class="p-4 rounded-xl transition-transform hover:scale-102"
            :style="item.speaker === 'AI' ? 'background: linear-gradient(to right, #f0fdf4, #dcfce7);' : 'background: linear-gradient(to right, #eff6ff, #dbeafe);'"
          >
            <div class="text-sm font-semibold mb-2" :class="item.speaker === 'AI' ? 'text-green-700' : 'text-blue-700'">
              {{ item.speaker }} - 第{{ item.round }}回合
            </div>
            <div class="text-gray-800 font-serif text-lg">{{ item.sentence }}</div>
            <div v-if="item.title && item.author" class="text-sm text-gray-600 mt-2">
              《{{ item.title }}》 - {{ item.author }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
