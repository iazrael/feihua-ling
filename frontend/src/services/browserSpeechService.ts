// 浏览器 Web Speech API 语音识别服务

// 检测浏览器是否支持 Web Speech API
export function isBrowserSpeechSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// 创建 SpeechRecognition 实例
function createRecognition(): any {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return null;
  }
  
  const recognition = new SpeechRecognition();
  
  // 配置参数
  recognition.lang = 'zh-CN'; // 中文普通话
  recognition.continuous = false; // 单次识别
  recognition.interimResults = false; // 仅返回最终结果
  recognition.maxAlternatives = 1; // 仅返回最佳结果
  
  return recognition;
}

let currentRecognition: any = null;

// 开始识别
export function startBrowserRecognition(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isBrowserSpeechSupported()) {
      reject(new Error('您的浏览器不支持语音识别功能'));
      return;
    }

    try {
      currentRecognition = createRecognition();
      
      if (!currentRecognition) {
        reject(new Error('无法创建语音识别实例'));
        return;
      }

      // 识别成功
      currentRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      // 识别错误
      currentRecognition.onerror = (event: any) => {
        let errorMessage = '语音识别失败';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = '未检测到语音，请重试';
            break;
          case 'audio-capture':
            errorMessage = '未检测到麦克风';
            break;
          case 'not-allowed':
            errorMessage = '麦克风权限被拒绝';
            break;
          case 'network':
            errorMessage = '网络错误，请检查网络连接';
            break;
          default:
            errorMessage = `语音识别失败: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      // 识别结束（无结果时触发）
      currentRecognition.onend = () => {
        // 如果没有触发 onresult，可能是超时或无输入
        // 这里不做处理，因为 onerror 会捕获错误
      };

      // 开始识别
      currentRecognition.start();
    } catch (error) {
      reject(error instanceof Error ? error : new Error('启动语音识别失败'));
    }
  });
}

// 停止识别
export function stopBrowserRecognition(): void {
  if (currentRecognition) {
    try {
      currentRecognition.stop();
    } catch (error) {
      console.error('停止语音识别失败:', error);
    }
    currentRecognition = null;
  }
}

// 取消识别
export function abortBrowserRecognition(): void {
  if (currentRecognition) {
    try {
      currentRecognition.abort();
    } catch (error) {
      console.error('取消语音识别失败:', error);
    }
    currentRecognition = null;
  }
}

// 获取浏览器语音识别功能说明
export function getBrowserSpeechInfo(): {
  supported: boolean;
  browser: string;
  note: string;
} {
  const userAgent = navigator.userAgent;
  let browser = 'Unknown';
  let note = '';

  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    browser = 'Chrome';
    note = 'Chrome 浏览器语音识别效果较好，但部分数据可能发送到 Google 服务器';
  } else if (userAgent.indexOf('Edg') > -1) {
    browser = 'Edge';
    note = 'Edge 浏览器语音识别效果较好，但部分数据可能发送到 Microsoft 服务器';
  } else if (userAgent.indexOf('Safari') > -1 && userAgent.indexOf('Chrome') === -1) {
    browser = 'Safari';
    note = 'Safari 浏览器支持语音识别，数据由 Apple 处理';
  } else if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    note = 'Firefox 浏览器对语音识别支持有限';
  }

  return {
    supported: isBrowserSpeechSupported(),
    browser,
    note
  };
}
