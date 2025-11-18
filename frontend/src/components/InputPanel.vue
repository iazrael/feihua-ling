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
import { ref } from 'vue';

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [sentence: string];
  hint: [];
  skip: [];
}>();

const userInput = ref('');
const hintMessage = ref('');
const errorMessage = ref('');

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
