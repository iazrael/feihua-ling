<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <div id="app-container">
        <RouterView />
    </div>
</template>

<style scoped>
#app-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
