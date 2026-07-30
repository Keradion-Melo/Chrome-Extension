/**
 * Melo AudioManager (Content Script Side)
 *
 * Coordinates playback with the Background Service Worker & Offscreen Document,
 * and maintains a local HTMLAudioElement fallback for guaranteed sound reproduction.
 */

type AudioEventCallback = (data?: any) => void;

class AudioManager {
  private static instance: AudioManager;
  private callbacks: Map<string, AudioEventCallback[]> = new Map();
  private currentUrl: string = '';
  private fallbackAudio: HTMLAudioElement | null = null;
  private offscreenActive: boolean = false;
  private offscreenCheckTimer: any = null;

  private constructor() {
    this.setupMessageListener();
    this.setupFallbackAudio();
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupFallbackAudio() {
    try {
      if (typeof window !== 'undefined' && typeof Audio !== 'undefined') {
        this.fallbackAudio = new Audio();
        this.fallbackAudio.preload = 'auto';

        this.fallbackAudio.addEventListener('timeupdate', () => {
          if (!this.offscreenActive && this.fallbackAudio && isFinite(this.fallbackAudio.currentTime)) {
            this.emit('timeupdate', this.fallbackAudio.currentTime);
          }
        });

        this.fallbackAudio.addEventListener('play', () => {
          if (!this.offscreenActive) this.emit('play');
        });

        this.fallbackAudio.addEventListener('pause', () => {
          if (!this.offscreenActive) this.emit('pause');
        });

        this.fallbackAudio.addEventListener('ended', () => {
          if (!this.offscreenActive) this.emit('ended');
        });

        this.fallbackAudio.addEventListener('loadedmetadata', () => {
          if (!this.offscreenActive && this.fallbackAudio && isFinite(this.fallbackAudio.duration)) {
            this.emit('loadedmetadata', this.fallbackAudio.duration);
          }
        });

        this.fallbackAudio.addEventListener('error', () => {
          if (!this.offscreenActive) {
            console.warn('[Melo AudioManager] Fallback audio error:', this.fallbackAudio?.error);
            this.emit('error', this.fallbackAudio?.error);
          }
        });
      }
    } catch (err) {
      console.warn('[Melo AudioManager] Could not init fallback audio:', err);
    }
  }

  private setupMessageListener() {
    const isExtension =
      typeof chrome !== 'undefined' &&
      !!chrome.runtime?.id &&
      typeof chrome.runtime?.onMessage?.addListener === 'function';

    if (!isExtension) return;

    chrome.runtime.onMessage.addListener((message: any) => {
      if (message?.type !== 'AUDIO_EVENT') return;
      const { event, data } = message.payload || {};

      if (event) {
        // Offscreen document is alive and active
        this.offscreenActive = true;
        if (this.offscreenCheckTimer) {
          clearTimeout(this.offscreenCheckTimer);
          this.offscreenCheckTimer = null;
        }

        // Mute/pause fallback audio so there is no echo
        if (this.fallbackAudio && !this.fallbackAudio.paused) {
          this.fallbackAudio.pause();
        }

        this.emit(event, data);
      }
    });
  }

  private send(type: string, payload?: any) {
    const isExtension =
      typeof chrome !== 'undefined' &&
      !!chrome.runtime?.id &&
      typeof chrome.runtime?.sendMessage === 'function';

    if (isExtension) {
      chrome.runtime.sendMessage({ type, payload }).catch(() => {});
    }
  }

  getCurrentUrl(): string {
    return this.currentUrl;
  }

  async load(url: string): Promise<void> {
    if (!url) return;
    this.currentUrl = url;
    this.send('AUDIO_LOAD', { url });
  }

  async playTrack(url: string): Promise<void> {
    if (!url) return;
    this.currentUrl = url;
    this.offscreenActive = false;

    // 1. Send to offscreen audio engine
    this.send('AUDIO_LOAD', { url });

    // 2. Set watchdog timer: if offscreen doesn't report playing within 2.5s, activate in-tab audio
    if (this.offscreenCheckTimer) clearTimeout(this.offscreenCheckTimer);
    this.offscreenCheckTimer = setTimeout(() => {
      if (!this.offscreenActive && this.fallbackAudio) {
        console.log('[Melo AudioManager] Offscreen response timed out, starting direct in-tab audio fallback...');
        this.fallbackAudio.src = url;
        this.fallbackAudio.load();
        this.fallbackAudio.play().catch((err) => {
          console.warn('[Melo AudioManager] Direct playback error:', err);
        });
      }
    }, 2200);
  }

  async play(): Promise<void> {
    this.send('AUDIO_PLAY');
    if (!this.offscreenActive && this.fallbackAudio && this.fallbackAudio.src) {
      this.fallbackAudio.play().catch(() => {});
    }
  }

  pause() {
    this.send('AUDIO_PAUSE');
    if (this.fallbackAudio && !this.fallbackAudio.paused) {
      this.fallbackAudio.pause();
    }
  }

  seek(time: number) {
    if (typeof time === 'number' && isFinite(time)) {
      this.send('AUDIO_SEEK', { time });
      if (this.fallbackAudio) {
        try {
          this.fallbackAudio.currentTime = time;
        } catch {}
      }
    }
  }

  setVolume(volume: number) {
    if (typeof volume === 'number' && isFinite(volume)) {
      const v = Math.max(0, Math.min(1, volume));
      this.send('AUDIO_VOLUME', { volume: v });
      if (this.fallbackAudio) {
        this.fallbackAudio.volume = v;
      }
    }
  }

  on(event: string, callback: AudioEventCallback) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: AudioEventCallback) {
    const cbs = this.callbacks.get(event);
    if (cbs) {
      this.callbacks.set(
        event,
        cbs.filter((c) => c !== callback),
      );
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.callbacks.get(event) || [];
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.warn(`[Melo AudioManager] Callback error for ${event}:`, err);
      }
    });
  }
}

export const audioManager = AudioManager.getInstance();
