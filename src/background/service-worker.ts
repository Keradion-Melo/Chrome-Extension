// Melo Background Service Worker (Manifest V3)

const OFFSCREEN_URL = chrome.runtime.getURL('offscreen.html');

let audioPort: chrome.runtime.Port | null = null;
const pendingAudioMessages: any[] = [];
let creatingOffscreenPromise: Promise<void> | null = null;

// ─── Offscreen Document Management ───────────────────────────────────────────

async function hasOffscreenDocument(): Promise<boolean> {
  if (typeof (chrome as any).offscreen?.hasDocument === 'function') {
    try {
      return await (chrome as any).offscreen.hasDocument();
    } catch {
      // Fallback to getContexts
    }
  }

  try {
    const existingContexts = await (chrome.runtime as any).getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [OFFSCREEN_URL],
    });
    return existingContexts && existingContexts.length > 0;
  } catch {
    return false;
  }
}

async function ensureOffscreenDocument(): Promise<void> {
  if (creatingOffscreenPromise) {
    return creatingOffscreenPromise;
  }

  creatingOffscreenPromise = (async () => {
    try {
      const exists = await hasOffscreenDocument();
      if (exists) return;

      console.log('[Melo SW] Creating offscreen document for audio playback...');
      await (chrome as any).offscreen.createDocument({
        url: OFFSCREEN_URL,
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Melo requires an offscreen document to play audio in Chrome MV3 extensions.',
      });
      console.log('[Melo SW] Offscreen document created.');
    } catch (err: any) {
      if (!err?.message?.includes('Only a single offscreen document may be created')) {
        console.error('[Melo SW] Failed to create offscreen document:', err);
        throw err;
      }
    } finally {
      creatingOffscreenPromise = null;
    }
  })();

  return creatingOffscreenPromise;
}

// ─── Port Connection from Offscreen ──────────────────────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'melo-audio') return;

  console.log('[Melo SW] Offscreen port connected.');
  audioPort = port;

  if (pendingAudioMessages.length > 0) {
    pendingAudioMessages.forEach((msg) => {
      try {
        port.postMessage(msg);
      } catch {}
    });
    pendingAudioMessages.length = 0;
  }

  port.onDisconnect.addListener(() => {
    console.log('[Melo SW] Offscreen port disconnected.');
    audioPort = null;
  });
});

async function sendAudioCommand(type: string, payload?: any) {
  await ensureOffscreenDocument().catch(() => {});
  const msg = { target: 'offscreen', type, payload };

  chrome.runtime.sendMessage(msg).catch(() => {});

  if (audioPort) {
    try {
      audioPort.postMessage(msg);
    } catch {
      audioPort = null;
      pendingAudioMessages.push(msg);
    }
  } else {
    pendingAudioMessages.push(msg);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Melo] Music Extension installed and active.');
  ensureOffscreenDocument().catch(() => {});
});
