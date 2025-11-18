<script setup lang="ts">
import { ref } from 'vue';

const API_BASE_URL = 'http://localhost:3000/api/v1';

const gameStarted = ref(false);
const ling = ref('');
const userInput = ref('');
const history = ref<{ author: string, text: string }[]>([]);
const usedPoems = ref<string[]>([]);
const message = ref('');
const isPlayerTurn = ref(true);

async function startGame() {
    gameStarted.value = true;
    history.value = [];
    usedPoems.value = [];
    userInput.value = '';
    message.value = '游戏开始！正在获取令字...';

    try {
        const response = await fetch(`${API_BASE_URL}/game/random-char`);
        if (!response.ok) throw new Error('无法获取令字');
        const data = await response.json();
        ling.value = data.char;
        message.value = `本轮的令字是 "${ling.value}"`;
    } catch (error: any) {
        message.value = error.message;
    }
}

async function submitSentence() {
    if (!userInput.value.trim() || !isPlayerTurn.value) return;

    isPlayerTurn.value = false;
    message.value = '';
    const sentence = userInput.value.trim();
    history.value.push({ author: '你', text: sentence });

    try {
        const response = await fetch(`${API_BASE_URL}/game/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentence, char: ling.value, usedPoems: usedPoems.value }),
        });
        const data = await response.json();

        if (data.valid) {
            usedPoems.value.push(sentence);
            userInput.value = '';
            message.value = '不错！轮到AI了...';
            setTimeout(aiTurn, 1000);
        } else {
            message.value = data.message || '无效的诗句';
            history.value.pop(); // 移除无效的输入
            isPlayerTurn.value = true;
        }
    } catch (error) {
        message.value = '请求失败，请检查网络';
        isPlayerTurn.value = true;
    }
}

async function aiTurn() {
    try {
        const response = await fetch(`${API_BASE_URL}/game/ai-turn`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ char: ling.value, usedPoems: usedPoems.value }),
        });
        if (!response.ok) throw new Error('AI也想不出来了！你赢了！');
        
        const data = await response.json();
        const aiSentence = data.sentence;

        history.value.push({ author: 'AI', text: aiSentence });
        usedPoems.value.push(aiSentence);
        message.value = '该你了！';
        isPlayerTurn.value = true;
    } catch (error: any) {
        message.value = error.message;
        gameStarted.value = false; // 游戏结束
    }
}
</script>

<template>
    <main class="game-container">
        <h1>飞花令</h1>
        <p class="subtitle">挑战AI，看看谁才是诗词王者</p>

        <button v-if="!gameStarted" @click="startGame" class="start-button">
            开始游戏
        </button>

        <div v-if="gameStarted" class="game-area">
            <div class="status-message">{{ message }}</div>

            <div class="history">
                <div v-for="(item, index) in history" :key="index" class="history-item" :class="{ 'user-item': item.author === '你', 'ai-item': item.author === 'AI' }">
                    <strong>{{ item.author }}:</strong> {{ item.text }}
                </div>
            </div>

            <div class="input-area">
                <input
                    v-model="userInput"
                    @keyup.enter="submitSentence"
                    :disabled="!isPlayerTurn"
                    placeholder="请输入包含令字的诗句..."
                />
                <button @click="submitSentence" :disabled="!isPlayerTurn">
                    出招
                </button>
            </div>
        </div>
    </main>
</template>

<style scoped>
.game-container {
    text-align: center;
    color: #333;
}

h1 {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #2c3e50;
}

.subtitle {
    font-size: 1.2rem;
    color: #666;
    margin-bottom: 2rem;
}

.start-button {
    font-size: 1.5rem;
    padding: 1rem 2rem;
    border-radius: 8px;
    border: none;
    background-color: #42b983;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
}

.start-button:hover {
    background-color: #369f72;
}

.game-area {
    margin-top: 2rem;
    padding: 2rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: #f9f9f9;
}

.status-message {
    font-size: 1.2rem;
    font-weight: bold;
    min-height: 2rem;
    color: #3a8c6c;
}

.history {
    margin-top: 1.5rem;
    text-align: left;
    max-height: 40vh;
    overflow-y: auto;
    padding: 1rem;
    background: white;
    border-radius: 4px;
    border: 1px solid #eee;
}

.history-item {
    padding: 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.user-item {
    background-color: #e8f5e9;
}

.ai-item {
    background-color: #f1f8e9;
}

.input-area {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.5rem;
}

input {
    flex-grow: 1;
    padding: 0.8rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
}

input:disabled {
    background-color: #f5f5f5;
}

button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 4px;
    background-color: #42b983;
    color: white;
    cursor: pointer;
    transition: background-color 0.3s;
}

button:disabled {
    background-color: #a5d6a7;
    cursor: not-allowed;
}

button:hover:not(:disabled) {
    background-color: #369f72;
}
</style>
