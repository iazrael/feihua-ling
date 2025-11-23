// 腾讯云语音识别服务模块（前端直调版本）
import { 
  startBrowserRecognition, 
  isBrowserSpeechSupported, 
  stopBrowserRecognition 
} from './browserSpeechService';

// 语音识别配置
interface RecognitionOptions {
  keyword: string;           // 当前令字
  usedPoems: string[];      // 已使用的诗句列表
  conversationContext?: any; // 会话上下文（可选）
  useBrowserFallback?: boolean; // 是否允许降级到浏览器识别
}

// 语音识别结果
interface RecognitionResult {
  success: boolean;
  recognizedText?: string;  // ASR 识别的原始文本
  isCorrect?: boolean;      // LLM 判断是否正确
  correctedSentence?: string; // LLM 修正后的诗句
  matchType?: string;       // 匹配类型：exact/llm_fuzzy/none
  poem?: {                  // 诗词信息
    id: number;
    title: string;
    author: string;
  };
  message?: string;         // 提示信息
  error?: string;          // 错误信息
}

// 腾讯云 ASR 失败计数器（用于降级判断）
let tencentAsrFailCount = 0;
const MAX_ASR_FAIL_COUNT = 2;

// 主函数：语音识别 + LLM 验证
export async function recognizeSpeech(
  audioBlob: Blob,
  options: RecognitionOptions
): Promise<RecognitionResult> {
  try {
    let recognizedText: string;
    
    // 尝试使用腾讯云 ASR
    try {
      recognizedText = await recognizeSpeechWithTencent(audioBlob);
      tencentAsrFailCount = 0; // 成功后重置计数器
    } catch (tencentError) {
      console.warn('腾讯云 ASR 识别失败:', tencentError);
      tencentAsrFailCount++;
      
      // 判断是否需要降级到浏览器识别
      if (
        options.useBrowserFallback !== false && 
        (tencentAsrFailCount >= MAX_ASR_FAIL_COUNT || options.useBrowserFallback === true)
      ) {
        if (isBrowserSpeechSupported()) {
          console.log('降级到浏览器 Web Speech API');
          recognizedText = await startBrowserRecognition();
        } else {
          throw new Error('语音识别服务不可用，且浏览器不支持 Web Speech API');
        }
      } else {
        throw tencentError;
      }
    }
    
    // 使用 LLM 验证识别结果
    const verifyResult = await verifyWithLLM(
      recognizedText,
      options.keyword,
      options.usedPoems,
      options.conversationContext
    );
    
    return {
      success: true,
      recognizedText,
      ...verifyResult
    };
  } catch (error) {
    console.error('语音识别错误:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '语音识别失败'
    };
  }
}

// 使用腾讯云 ASR 进行语音识别
async function recognizeSpeechWithTencent(audioBlob: Blob): Promise<string> {
  // 步骤 1: 从后端获取签名
  const signatureResponse = await fetch('/api/v1/speech/get-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioLength: audioBlob.size })
  });
  
  if (!signatureResponse.ok) {
    throw new Error('获取签名失败');
  }
  
  const signatureData = await signatureResponse.json();
  
  if (!signatureData.success) {
    throw new Error(signatureData.error || '签名生成失败');
  }
  
  const { headers, payload, endpoint } = signatureData;
  
  // 步骤 2: 将音频转换为 Base64
  const base64Audio = await convertBlobToBase64(audioBlob);
  
  // 步骤 3: 构造完整请求体（合并签名 payload + 音频数据）
  const asrPayload = {
    ...payload,
    Data: base64Audio,
    DataLen: audioBlob.size
  };
  
  // 步骤 4: 直接调用腾讯云 ASR 接口
  const asrResponse = await fetch(endpoint, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(asrPayload),
    signal: AbortSignal.timeout(10000) // 10秒超时
  });
  
  if (!asrResponse.ok) {
    throw new Error(`腾讯云 ASR 调用失败: ${asrResponse.status}`);
  }
  
  const asrResult = await asrResponse.json();
  
  // 步骤 5: 解析识别结果
  if (asrResult.Response?.Result) {
    return asrResult.Response.Result;
  } else if (asrResult.Response?.Error) {
    throw new Error(`ASR 错误: ${asrResult.Response.Error.Message}`);
  } else {
    throw new Error('ASR 返回格式错误');
  }
}

// 调用后端 LLM 验证服务
async function verifyWithLLM(
  recognizedText: string,
  keyword: string,
  usedPoems: string[],
  conversationContext?: any
): Promise<Partial<RecognitionResult>> {
  try {
    const response = await fetch('/api/v1/game/verify-with-llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recognizedText,
        keyword,
        usedPoems,
        conversationContext
      }),
      signal: AbortSignal.timeout(8000) // 8秒超时
    });
    
    if (!response.ok) {
      throw new Error(`验证服务异常: ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      isCorrect: result.valid || result.isCorrect || false,
      correctedSentence: result.correctedSentence,
      matchType: result.matchType,
      poem: result.poem,
      message: result.message
    };
  } catch (error) {
    console.error('LLM 验证失败:', error);
    // 返回失败结果，但不抛出异常
    return {
      isCorrect: false,
      message: '验证服务暂时不可用，请重试'
    };
  }
}

// 手动触发浏览器识别（供用户主动选择）
export async function recognizeSpeechWithBrowser(): Promise<string> {
  if (!isBrowserSpeechSupported()) {
    throw new Error('当前浏览器不支持 Web Speech API');
  }
  
  return await startBrowserRecognition();
}

// 停止浏览器识别
export function stopBrowserSpeech(): void {
  stopBrowserRecognition();
}

// 将Blob转换为Base64
function convertBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // 移除Base64数据URL前缀
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data || '');
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}