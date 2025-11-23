// DeepSeek LLM 集成服务

import axios from 'axios';
import NodeCache from 'node-cache';

// DeepSeek API 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_BASE_URL = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const DEEPSEEK_TIMEOUT = parseInt(process.env.DEEPSEEK_TIMEOUT || '5000');

// 缓存配置
const LLM_CACHE_TTL = parseInt(process.env.LLM_CACHE_TTL || '3600');
const LLM_CACHE_MAX_SIZE = parseInt(process.env.LLM_CACHE_MAX_SIZE || '1000');

// 多轮对话配置
const CONVERSATION_HISTORY_LIMIT = parseInt(process.env.CONVERSATION_HISTORY_LIMIT || '3');
const ENABLE_CONVERSATION_CONTEXT = process.env.ENABLE_CONVERSATION_CONTEXT !== 'false';

// 创建缓存实例
const llmCache = new NodeCache({ stdTTL: LLM_CACHE_TTL, maxKeys: LLM_CACHE_MAX_SIZE });

// 会话上下文数据结构
export interface ConversationContext {
  recentHistory: Array<{
    round: number;
    recognizedText: string;
    correctedSentence: string;
    isCorrect: boolean;
  }>;
  userStyle: {
    commonErrors: string[];
    accuracyRate: number;
    averageConfidence: string;
  };
}

// LLM 验证结果
export interface LLMVerifyResult {
  isCorrect: boolean;
  correctedSentence?: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

// 构造 Prompt
function buildPrompt(
  recognizedText: string,
  keyword: string,
  usedPoems: string[],
  conversationContext?: ConversationContext
): string {
  let prompt = `你是一个古诗词专家，负责判断儿童语音识别的答题内容是否正确。

**判断规则**：
1. 儿童说话可能存在口音、咬字不清等问题，识别结果可能有误
2. 如果识别文本与某句诗词的意思、韵律、字数基本一致，即可判定正确
3. 允许个别字词的谐音、同音字替换（如"晓"识别为"小"）
4. 允许1-2个字的识别错误，只要能推断出正确诗句
5. 必须包含指定的令字（关键字）
6. 不能与已使用的诗句重复

**当前游戏信息**：
- 令字：${keyword}
- 已使用诗句：${usedPoems.join('、') || '无'}
- 识别文本：${recognizedText}`;

  // 如果启用多轮对话且有上下文
  if (ENABLE_CONVERSATION_CONTEXT && conversationContext) {
    prompt += `\n\n**历史上下文（多轮对话）**：`;
    
    if (conversationContext.recentHistory.length > 0) {
      prompt += `\n- 前几轮答题记录：\n`;
      conversationContext.recentHistory.forEach(h => {
        prompt += `  第${h.round}轮: 识别"${h.recognizedText}" -> 修正"${h.correctedSentence}" (${h.isCorrect ? '正确' : '错误'})\n`;
      });
    }
    
    if (conversationContext.userStyle.commonErrors.length > 0) {
      prompt += `- 用户常见识别错误：${conversationContext.userStyle.commonErrors.join('、')}\n`;
    }
    
    prompt += `- 用户识别准确率：${(conversationContext.userStyle.accuracyRate * 100).toFixed(1)}%\n`;
    prompt += `- 平均置信度：${conversationContext.userStyle.averageConfidence}`;
  }

  prompt += `\n\n**输出要求**：
请以 JSON 格式返回判断结果，格式如下：
\`\`\`json
{
  "isCorrect": true/false,
  "correctedSentence": "修正后的标准诗句（如果正确的话）",
  "confidence": "high/medium/low",
  "reason": "判断理由"
}
\`\`\`

注意：只返回 JSON，不要有其他文字。`;

  return prompt;
}

// 生成缓存键
function generateCacheKey(
  recognizedText: string,
  keyword: string,
  conversationContext?: ConversationContext
): string {
  // 如果有上下文，计算上下文的简单哈希
  let contextHash = '';
  if (ENABLE_CONVERSATION_CONTEXT && conversationContext) {
    const contextStr = JSON.stringify({
      historyCount: conversationContext.recentHistory.length,
      errors: conversationContext.userStyle.commonErrors,
      accuracy: conversationContext.userStyle.accuracyRate
    });
    contextHash = '_' + Buffer.from(contextStr).toString('base64').slice(0, 16);
  }
  
  return `${recognizedText}_${keyword}${contextHash}`;
}

// 调用 DeepSeek API
export async function verifyWithLLM(
  recognizedText: string,
  keyword: string,
  usedPoems: string[],
  conversationContext?: ConversationContext
): Promise<LLMVerifyResult> {
  try {
    // 检查缓存
    const cacheKey = generateCacheKey(recognizedText, keyword, conversationContext);
    const cached = llmCache.get<LLMVerifyResult>(cacheKey);
    if (cached) {
      console.log('LLM 缓存命中:', cacheKey);
      return cached;
    }

    // 检查 API Key
    if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === '') {
      throw new Error('DeepSeek API Key 未配置');
    }

    // 构造 Prompt
    const prompt = buildPrompt(recognizedText, keyword, usedPoems, conversationContext);

    // 调用 DeepSeek API
    const response = await axios.post(
      `${DEEPSEEK_API_BASE_URL}/v1/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: DEEPSEEK_TIMEOUT
      }
    );

    // 解析 LLM 返回结果
    const content = response.data.choices[0]?.message?.content || '';
    
    // 提取 JSON（可能被包裹在 ```json ... ``` 中）
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM 返回格式错误：未找到 JSON');
    }

    const result: LLMVerifyResult = JSON.parse(jsonMatch[0]);

    // 验证返回结果的结构
    if (typeof result.isCorrect !== 'boolean' || typeof result.reason !== 'string') {
      throw new Error('LLM 返回格式错误：缺少必要字段');
    }

    // 存入缓存
    llmCache.set(cacheKey, result);
    console.log('LLM 验证完成:', { recognizedText, isCorrect: result.isCorrect });

    return result;
  } catch (error) {
    console.error('LLM 验证错误:', error);
    
    // 如果是超时错误
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      throw new Error('LLM 服务响应超时');
    }
    
    // 其他错误
    throw new Error('LLM 验证失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
}

// 清除缓存（用于测试或管理）
export function clearLLMCache(): void {
  llmCache.flushAll();
  console.log('LLM 缓存已清空');
}

// 获取缓存统计
export function getLLMCacheStats(): {
  keys: number;
  hits: number;
  misses: number;
  hitRate: string;
} {
  const stats = llmCache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits + stats.misses > 0
      ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) + '%'
      : '0%'
  };
}
