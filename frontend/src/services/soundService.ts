// 音效服务模块

export enum SoundType {
  CORRECT = 'correct',           // 答对音效
  WRONG = 'wrong',               // 单次答错音效
  GAME_OVER = 'gameOver',        // 游戏失败音效
  RESULT = 'result',             // 结算音效
  TICK = 'tick',                 // 倒计时滴答音
}

class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.8;
  private initialized: boolean = false;

  // 音效文件路径映射
  private soundPaths: Record<SoundType, string> = {
    [SoundType.CORRECT]: '/sounds/correct.mp3',
    [SoundType.WRONG]: '/sounds/wrong.mp3',
    [SoundType.GAME_OVER]: '/sounds/game-over.mp3',
    [SoundType.RESULT]: '/sounds/result.mp3',
    [SoundType.TICK]: '/sounds/tick.mp3',
  };

  constructor() {
    // 从 localStorage 读取设置
    const savedEnabled = localStorage.getItem('soundEnabled');
    const savedVolume = localStorage.getItem('soundVolume');
    
    if (savedEnabled !== null) {
      this.enabled = savedEnabled === 'true';
    }
    
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }
  }

  // 初始化并预加载所有音效
  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      for (const [type, path] of Object.entries(this.soundPaths)) {
        const audio = new Audio(path);
        audio.volume = this.volume;
        audio.preload = 'auto';
        
        // 预加载音频
        await new Promise<void>((resolve) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.addEventListener('error', () => {
            console.warn(`Failed to load sound: ${path}`);
            resolve(); // 即使失败也继续
          }, { once: true });
          audio.load();
        });
        
        this.sounds.set(type as SoundType, audio);
      }
      
      this.initialized = true;
      console.log('Sound service initialized');
    } catch (error) {
      console.error('Failed to initialize sound service:', error);
    }
  }

  // 播放指定音效
  play(type: SoundType): void {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Sound not found: ${type}`);
      return;
    }

    try {
      // 重置播放位置并播放
      sound.currentTime = 0;
      sound.volume = this.volume;
      sound.play().catch(err => {
        console.warn(`Failed to play sound ${type}:`, err);
      });
    } catch (error) {
      console.warn(`Error playing sound ${type}:`, error);
    }
  }

  // 停止指定音效
  stop(type: SoundType): void {
    const sound = this.sounds.get(type);
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
    }
  }

  // 停止所有音效
  stopAll(): void {
    this.sounds.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
  }

  // 设置音效开关
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', String(enabled));
    
    if (!enabled) {
      this.stopAll();
    }
  }

  // 设置音量（0-1）
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', String(this.volume));
    
    // 更新所有音效的音量
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  // 获取当前音效状态
  isEnabled(): boolean {
    return this.enabled;
  }

  // 获取当前音量
  getVolume(): number {
    return this.volume;
  }

  // 切换静音
  toggleMute(): void {
    this.setEnabled(!this.enabled);
  }
}

// 导出单例
export const soundService = new SoundService();
