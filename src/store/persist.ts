import { type Storage } from 'redux-persist';

const isExtensionValid = (): boolean => {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id && !!chrome.storage?.local;
  } catch {
    return false;
  }
};

const createChromeStorage = (): Storage => {
  return {
    getItem: (key: string): Promise<string | null> => {
      if (isExtensionValid()) {
        try {
          return new Promise((resolve) => {
            chrome.storage.local.get(key, (result) => {
              if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
                resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
              } else {
                resolve((result && (result[key] as string)) || null);
              }
            });
          });
        } catch {
          // Extension context invalidated fallback
        }
      }
      return Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null);
    },
    setItem: (key: string, item: string): Promise<void> => {
      if (isExtensionValid()) {
        try {
          return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: item }, () => {
              resolve();
            });
          });
        } catch {
          // Extension context invalidated fallback
        }
      }
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem(key, item);
        } catch {
          // LocalStorage quota/access fallback
        }
      }
      return Promise.resolve();
    },
    removeItem: (key: string): Promise<void> => {
      if (isExtensionValid()) {
        try {
          return new Promise((resolve) => {
            chrome.storage.local.remove(key, () => {
              resolve();
            });
          });
        } catch {
          // Extension context invalidated fallback
        }
      }
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.removeItem(key);
        } catch {
          // Safe ignore
        }
      }
      return Promise.resolve();
    },
  };
};

export const chromeStorage = createChromeStorage();
