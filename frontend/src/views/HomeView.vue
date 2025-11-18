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

// 新增的搜索功能相关变量
const searchChar = ref('');
const searchResults = ref<{ id: number; title: string; author: string; content: string }[]>([]);
const showSearch = ref(false);

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
    } catch (error: unknown) {
        if (error instanceof Error) {
            message.value = error.message;
        } else {
            message.value = '未知错误';
        }
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
    } catch (error: unknown) {
        if (error instanceof Error) {
            message.value = error.message;
        } else {
            message.value = '未知错误';
        }
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
    } catch (error: unknown) {
        if (error instanceof Error) {
            message.value = error.message;
        } else {
            message.value = '未知错误';
        }
        gameStarted.value = false; // 游戏结束
    }
}

// 新增的搜索功能
async function searchPoems() {
    if (!searchChar.value.trim()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/game/search-poems`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ char: searchChar.value.trim(), limit: 10 }),
        });
        const data = await response.json();
        searchResults.value = data.poems;
        showSearch.value = true;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('搜索失败:', error.message);
        } else {
            console.error('搜索失败: 未知错误');
        }
    }
}

function closeSearch() {
    showSearch.value = false;
    searchResults.value = [];
}
</script>

<template>
  <div class="home">
    <h1 class="text-3xl font-bold mb-6">飞花令游戏</h1>
    
    <!-- 搜索功能 -->
    <div class="mb-8 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-xl font-semibold mb-3">搜索诗句</h2>
      <div class="flex">
        <input 
          v-model="searchChar" 
          @keyup.enter="searchPoems"
          placeholder="输入要搜索的字" 
          class="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          @click="searchPoems"
          class="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
        >
          搜索
        </button>
      </div>
      
      <!-- 搜索结果 -->
      <div v-if="showSearch" class="mt-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-lg font-medium">搜索结果</h3>
          <button @click="closeSearch" class="text-gray-500 hover:text-gray-700">
            关闭
          </button>
        </div>
        <div v-if="searchResults.length > 0" class="space-y-3">
          <div 
            v-for="poem in searchResults" 
            :key="poem.id"
            class="p-3 bg-white rounded-lg shadow"
          >
            <div class="font-medium">{{ poem.title }}</div>
            <div class="text-sm text-gray-600">{{ poem.author }}</div>
            <div class="mt-1 text-gray-800">{{ poem.content }}</div>
          </div>
        </div>
        <div v-else class="text-gray-500">
          未找到相关诗句
        </div>
      </div>
    </div>
    
    <!-- 游戏区域 -->
    <div class="game-area">
      <div v-if="!gameStarted" class="text-center">
        <button 
          @click="startGame"
          class="px-6 py-3 bg-green-500 text-white text-lg rounded-lg hover:bg-green-600 transition-colors"
        >
          开始游戏
        </button>
      </div>
      
      <div v-else>
        <div class="mb-4 text-center">
          <div class="text-2xl font-bold mb-2">令字：{{ ling }}</div>
          <div class="text-lg">{{ message }}</div>
        </div>
        
        <div class="mb-6">
          <div class="flex">
            <input 
              v-model="userInput" 
              @keyup.enter="submitSentence"
              :disabled="!isPlayerTurn"
              placeholder="请输入包含令字的诗句" 
              class="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <button 
              @click="submitSentence"
              :disabled="!isPlayerTurn"
              class="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400"
            >
              提交
            </button>
          </div>
        </div>
        
        <div class="history">
          <h3 class="text-lg font-semibold mb-2">游戏历史</h3>
          <div class="space-y-2">
            <div 
              v-for="(item, index) in history" 
              :key="index"
              class="p-3 rounded-lg"
              :class="item.author === '你' ? 'bg-blue-100' : 'bg-green-100'"
            >
              <span class="font-medium">{{ item.author }}：</span>
              <span>{{ item.text }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>