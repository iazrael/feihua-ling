<template>
  <div class="poem-display p-6 bg-gradient-to-br from-primary-light to-white rounded-lg shadow-lg border-2 border-primary">
    <div class="text-center">
      <div class="text-sm text-gray-600 mb-2">{{ speaker }}</div>
      <div class="text-2xl font-bold text-primary-dark mb-3 poem-text">
        {{ sentence }}
      </div>
      <div class="text-sm text-gray-700">
        <span>—— 《{{ title }}》</span>
        <span class="ml-2">{{ author }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  speaker: string;
  sentence: string;
  title: string;
  author: string;
}>();
</script>

<style scoped>
.poem-text {
  font-family: 'KaiTi', 'STKaiti', '楷体', serif;
  letter-spacing: 0.1em;
}
</style>
