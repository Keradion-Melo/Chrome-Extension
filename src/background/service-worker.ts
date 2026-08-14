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

  // Flush any pending commands
  if (pendingAudioMessages.length > 0) {
    pendingAudioMessages.forEach((msg) => {
      try {
        port.postMessage(msg);
      } catch {}
    });
    pendingAudioMessages.length = 0;
  }

  port.onMessage.addListener((message: any) => {
    if (message?.type === 'AUDIO_EVENT') {
      broadcastToTabs(message);
    }
  });

  port.onDisconnect.addListener(() => {
    console.log('[Melo SW] Offscreen port disconnected.');
    audioPort = null;
  });
});

function broadcastToTabs(message: any) {
  try {
    chrome.tabs.query({}, (tabs) => {
      if (!tabs) return;
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, message).catch(() => {});
        }
      });
    });
  } catch (err) {
    console.warn('[Melo SW] Broadcast error:', err);
  }
}

// Forward audio command to offscreen document (via both Port and direct runtime message)
async function sendAudioCommand(type: string, payload?: any) {
  await ensureOffscreenDocument().catch(() => {});

  const msg = { target: 'offscreen', type, payload };

  // 1. Send via direct runtime message
  chrome.runtime.sendMessage(msg).catch(() => {});

  // 2. Send via port if active, or queue if pending
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

// ─── Extension Icon Click ─────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Melo] Music Extension installed and active.');
  ensureOffscreenDocument().catch(() => {});
});

chrome.action.onClicked.addListener(async (tab: chrome.tabs.Tab) => {
  if (!tab.id) return;
  const url = tab.url || '';
  if (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.includes('chromewebstore.google.com')
  ) {
    return;
  }
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_SIDEBAR' });
  } catch {
    // Tab not ready
  }
});

// ─── Main Message Router ──────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
    const { type } = message || {};

    // 1. Audio event relay (from offscreen to content script tabs)
    if (type === 'AUDIO_EVENT') {
      broadcastToTabs(message);
      sendResponse({ status: 'relayed' });
      return false;
    }

    // 2. Tab-to-Tab state sync broadcast
    if (type === 'BROADCAST_STATE') {
      chrome.tabs.query({}, (tabs) => {
        if (!tabs) return;
        tabs.forEach((tab) => {
          if (tab.id && tab.id !== sender.tab?.id) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {});
          }
        });
      });
      sendResponse({ status: 'broadcasted' });
      return false;
    }

    // 3. Audio commands → offscreen document
    if (
      type === 'AUDIO_LOAD' ||
      type === 'AUDIO_PLAY' ||
      type === 'AUDIO_PAUSE' ||
      type === 'AUDIO_SEEK' ||
      type === 'AUDIO_VOLUME' ||
      type === 'AUDIO_GET_STATUS'
    ) {
      sendAudioCommand(type, message.payload)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => sendResponse({ ok: false, error: String(err) }));
      return true; // async
    }

    // 4. Background API Fetch Proxy
    if (type === 'API_REQUEST') {
      const { url, method = 'GET', headers = {}, data, params } = message.payload || {};

      let fullUrl = url;
      if (params && typeof params === 'object' && Object.keys(params).length > 0) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + new URLSearchParams(params).toString();
      }

      const fetchOptions: RequestInit = {
        method: method.toUpperCase(),
        headers: { 'Content-Type': 'application/json', ...headers },
      };

      if (data && !['GET', 'HEAD'].includes(method.toUpperCase())) {
        fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
      }

      fetch(fullUrl, fetchOptions)
        .then(async (res) => {
          const text = await res.text();
          let resData: any;
          try {
            resData = JSON.parse(text);
          } catch {
            resData = text;
          }
          sendResponse({
            success: res.ok,
            status: res.status,
            statusText: res.statusText,
            data: resData,
          });
        })
        .catch((err) => {
          sendResponse({ success: false, status: 0, error: err?.message || 'Network error' });
        });

      return true;
    }

    return false;
  },
);
