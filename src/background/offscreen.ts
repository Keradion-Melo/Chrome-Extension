/**
 * Melo Offscreen Audio Engine (Manifest V3)
 *
 * Supports dual-channel communication:
 * 1. Persistent port with auto-reconnection on service worker sleep/wake.
 * 2. Direct chrome.runtime.onMessage listener for zero-latency command processing.
 */

const audio = new Audio();
audio.preload = 'auto';

let currentPlayPromise: Promise<void> | null = null;
let port: chrome.runtime.Port | null = null;

// Send audio event to both port and runtime broadcast
function sendEvent(event: string, data?: any) {
  const message = { type: 'AUDIO_EVENT', payload: { event, data } };

  // 1. Send via port if active
  if (port) {
    try {
      port.postMessage(message);
    } catch {
      port = null;
    }
  }

  // 2. Broadcast via runtime message as well
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(message).catch(() => {});
    }
  } catch {}
}

audio.addEventListener('timeupdate', () => {
  if (typeof audio.currentTime === 'number' && isFinite(audio.currentTime)) {
    sendEvent('timeupdate', audio.currentTime);
  }
});

audio.addEventListener('play', () => sendEvent('play'));
audio.addEventListener('playing', () => sendEvent('playing'));
audio.addEventListener('pause', () => sendEvent('pause'));
audio.addEventListener('ended', () => sendEvent('ended'));
audio.addEventListener('loadedmetadata', () => {
  if (typeof audio.duration === 'number' && isFinite(audio.duration)) {
    sendEvent('loadedmetadata', audio.duration);
  }
});

audio.addEventListener('waiting', () => sendEvent('waiting'));
audio.addEventListener('canplay', () => sendEvent('canplay'));

audio.addEventListener('error', () => {
  const code = audio.error?.code;
  const msg = audio.error?.message || 'Audio stream error';
  console.error('[Melo Offscreen] Audio element error:', code, msg, 'src:', audio.src);
  sendEvent('error', { code, msg, src: audio.src });
});

async function safePlay() {
  try {
    currentPlayPromise = audio.play();
    await currentPlayPromise;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return;
    }
    console.warn('[Melo Offscreen] Play blocked or failed:', err?.name, err?.message);
    sendEvent('error', { name: err?.name, message: err?.message });
  } finally {
    currentPlayPromise = null;
  }
}

function safePause() {
  try {
    audio.pause();
  } catch (err) {
    console.warn('[Melo Offscreen] Pause error:', err);
  }
}

// Unified Audio Command Handler
async function handleAudioCommand(message: any, _sender?: any, sendResponse?: (response?: any) => void) {
  const { type, payload } = message || {};

  if (type === 'AUDIO_LOAD') {
    const { url } = payload || {};
    if (!url) {
      sendResponse?.({ success: false, error: 'No URL provided' });
      return;
    }

    console.log('[Melo Offscreen] Loading and playing stream:', url);
    safePause();
    audio.currentTime = 0;
    audio.src = url;
    audio.load();
    await safePlay();
    sendResponse?.({ success: true, src: audio.src });
    return;
  }

  if (type === 'AUDIO_PLAY') {
    if (audio.src) {
      if (audio.error || audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE || audio.readyState === 0) {
        console.log('[Melo Offscreen] Audio stream stalled, reloading src:', audio.src);
        const currentSrc = audio.src;
        audio.load();
        audio.src = currentSrc;
      }
      await safePlay();
    }
    sendResponse?.({ success: true, isPlaying: !audio.paused });
    return;
  }

  if (type === 'AUDIO_PAUSE') {
    safePause();
    sendResponse?.({ success: true, isPlaying: false });
    return;
  }

  if (type === 'AUDIO_SEEK') {
    const { time } = payload || {};
    if (typeof time === 'number' && isFinite(time)) {
      try {
        audio.currentTime = Math.max(0, isFinite(audio.duration) ? Math.min(time, audio.duration) : time);
      } catch (err) {
        console.warn('[Melo Offscreen] Seek error:', err);
      }
    }
    sendResponse?.({ success: true, currentTime: audio.currentTime });
    return;
  }

  if (type === 'AUDIO_VOLUME') {
    const { volume } = payload || {};
    if (typeof volume === 'number' && isFinite(volume)) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
    sendResponse?.({ success: true, volume: audio.volume });
    return;
  }

  if (type === 'AUDIO_GET_STATUS') {
    sendResponse?.({
      success: true,
      src: audio.src,
      isPlaying: !audio.paused,
      currentTime: audio.currentTime,
      duration: audio.duration,
      volume: audio.volume,
    });
    return;
  }
}

// 1. Direct runtime message listener (always active)
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type?.startsWith('AUDIO_') && message?.type !== 'AUDIO_EVENT') {
      handleAudioCommand(message, sender, sendResponse);
      return true; // Keep sendResponse open for async
    }
    return false;
  });
}

// 2. Persistent Port with auto-reconnection
function connectPort() {
  try {
    if (typeof chrome === 'undefined' || !chrome.runtime?.connect) return;
    port = chrome.runtime.connect({ name: 'melo-audio' });

    port.onMessage.addListener((msg) => {
      handleAudioCommand(msg);
    });

    port.onDisconnect.addListener(() => {
      port = null;
      // Reconnect when service worker wakes up again
      setTimeout(connectPort, 1500);
    });
  } catch {
    port = null;
    setTimeout(connectPort, 2000);
  }
}

connectPort();

console.log('[Melo Offscreen] Audio engine ready with dual communication channels.');
