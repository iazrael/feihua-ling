// 腾讯云语音识别服务模块

// 调用后端语音识别API
export async function recognizeSpeech(audioBlob: Blob): Promise<string> {
  try {
    // 将音频Blob转换为Base64
    const base64Audio = await convertBlobToBase64(audioBlob);
    
    // 构造请求参数
    const payload = {
      audioData: base64Audio,
      audioLength: audioBlob.size
    };
    
    // 发送请求到后端语音识别API
    const response = await fetch('/api/v1/speech/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 解析识别结果
    if (result.success && result.text) {
      return result.text;
    } else {
      throw new Error('语音识别失败: ' + (result.error || '未知错误'));
    }
  } catch (error) {
    console.error('语音识别错误:', error);
    throw new Error('语音识别失败: ' + (error instanceof Error ? error.message : '未知错误'));
  }
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