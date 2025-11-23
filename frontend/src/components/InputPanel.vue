<template>
  <div class="input-panel">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">你的诗句</label>
      <div class="flex gap-3">
        <input
          v-model="userInput"
          @keyup.enter="handleSubmit"
          :disabled="disabled"
          placeholder="请输入包含关键字的诗句..."
          class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          @click="handleSubmit"
          :disabled="!userInput.trim() || disabled"
          class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          提交
        </button>
      </div>
    </div>

    <div class="flex gap-3">
      <button
        @click="handleHint"
        :disabled="disabled"
        class="flex-1 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        💡 提示
      </button>
      <button
        @click="handleSkip"
        :disabled="disabled"
        class="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ⏭️ 跳过
      </button>
      <button
        @mousedown="startRecording"
        @mouseup="stopRecording"
        @touchstart="startRecording"
        @touchend="stopRecording"
        :disabled="disabled || !isRecordingSupported"
        class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="{ 'bg-red-500 hover:bg-red-600': isRecording }"
      >
        🎤 {{ isRecording ? '松开结束' : '按住说话' }}
      </button>
    </div>

    <!-- 录音状态指示器 -->
    <div v-if="isRecording" class="mt-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
      🎤 录音中...请说话
    </div>

    <!-- 语音识别状态 -->
    <div v-if="isRecognizing" class="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg animate-pulse">
      🔍 语音识别中...
    </div>

    <!-- 验证状态 -->
    <div v-if="isVerifying" class="mt-4 p-3 bg-purple-100 text-purple-800 rounded-lg animate-pulse">
      🧠 智能判断中...
    </div>

    <!-- 麦克风权限提示 -->
    <div v-if="!isRecordingSupported" class="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
      您的浏览器不支持录音功能或未授权麦克风权限，请使用最新版Chrome、Firefox或Safari浏览器，并允许麦克风权限。
    </div>

    <!-- 提示信息 -->
    <div v-if="hintMessage" class="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">
      {{ hintMessage }}
    </div>

    <!-- 错误信息 -->
    <div v-if="errorMessage" class="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useGameStore } from '@/stores/game';
import { audioService } from '@/services/audioService';
import { recognizeSpeech } from '@/services/speechRecognitionService';

const props = defineProps<{
  disabled?: boolean;
  keyword?: string;        // 当前令字
  usedPoems?: string[];    // 已使用诗句
}>();

const emit = defineEmits<{
  submit: [sentence: string];
  hint: [];
  skip: [];
  voiceRecognitionStart: [];  // 语音识别开始
  voiceRecognitionEnd: [];    // 语音识别结束
}>();

const gameStore = useGameStore();

const userInput = ref('');
const hintMessage = ref('');
const errorMessage = ref('');
const isRecording = ref(false);
const isRecognizing = ref(false);  // 语音识别中
const isVerifying = ref(false);     // LLM 验证中
const isRecordingSupported = ref(false);

// 检查录音支持情况
onMounted(() => {
  isRecordingSupported.value = audioService.isRecordingSupported();
});

const handleSubmit = () => {
  if (userInput.value.trim() && !props.disabled) {
    emit('submit', userInput.value.trim());
    userInput.value = '';
    hintMessage.value = '';
    errorMessage.value = '';
  }
};

const handleHint = () => {
  if (!props.disabled) {
    emit('hint');
  }
};

const handleSkip = () => {
  if (!props.disabled) {
    emit('skip');
    userInput.value = '';
    hintMessage.value = '';
    errorMessage.value = '';
  }
};

// 开始录音
const startRecording = async () => {
  if (props.disabled || !isRecordingSupported.value) return;
  
  try {
    // 暂停计时器
    gameStore.pauseTimerForVoice();
    
    await audioService.startRecording();
    isRecording.value = true;
    errorMessage.value = '';
    
    emit('voiceRecognitionStart');
  } catch (error) {
    console.error('录音启动失败:', error);
    errorMessage.value = error instanceof Error ? error.message : '录音启动失败';
    // 错误时恢复计时器
    gameStore.resumeTimerAfterVoice();
  }
};

// 停止录音并进行语音识别 + LLM 验证
const stopRecording = async () => {
  if (!isRecording.value) return;
  
  try {
    isRecording.value = false;
    const audioBlob = await audioService.stopRecording();
    
    // 显示识别状态
    isRecognizing.value = true;
    
    // 调用语音识别服务（内部包含 ASR + LLM 验证）
    const result = await recognizeSpeech(audioBlob, {
      keyword: props.keyword || '',
      usedPoems: props.usedPoems || [],
      conversationContext: gameStore.getConversationContext(),
      useBrowserFallback: true  // 允许降级到浏览器识别
    });
    
    isRecognizing.value = false;
    
    if (result.success && result.recognizedText) {
      // 显示识别结果
      userInput.value = result.recognizedText;
      
      // 如果 LLM 判断正确，使用修正后的诗句
      if (result.isCorrect && result.correctedSentence) {
        userInput.value = result.correctedSentence;
      }
      
      // 更新会话上下文
      if (result.recognizedText && result.correctedSentence) {
        gameStore.updateConversationContext(
          result.recognizedText,
          result.correctedSentence,
          result.isCorrect || false
        );
      }
      
      // 自动提交识别结果
      if (result.isCorrect) {
        handleSubmit();
      } else {
        // 答错了，显示提示并恢复计时器
        errorMessage.value = result.message || '答案不正确，请重试';
        gameStore.resumeTimerAfterVoice();
      }
    } else {
      // 识别失败
      errorMessage.value = result.error || '语音识别失败，请重试';
      gameStore.resumeTimerAfterVoice();
    }
    
    emit('voiceRecognitionEnd');
  } catch (error) {
    console.error('录音识别失败:', error);
    errorMessage.value = error instanceof Error ? error.message : '录音识别失败';
    isRecognizing.value = false;
    isVerifying.value = false;
    // 错误时恢复计时器
    gameStore.resumeTimerAfterVoice();
    emit('voiceRecognitionEnd');
  }
};

const showHint = (message: string) => {
  hintMessage.value = message;
};

const showError = (message: string) => {
  errorMessage.value = message;
};

defineExpose({
  showHint,
  showError,
});
</script>