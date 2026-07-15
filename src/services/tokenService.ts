const TOKEN_KEY = 'melo_access_token';
const REFRESH_TOKEN_KEY = 'melo_refresh_token';

const isExtensionValid = (): boolean => {
  try {
    return typeof chrome !== 'undefined' && !!chrome.runtime?.id && !!chrome.storage?.local;
  } catch {
    return false;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (isExtensionValid()) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(TOKEN_KEY, (result) => {
          if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
            resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
          } else {
            resolve((result && (result[TOKEN_KEY] as string)) || null);
          }
        });
      });
    } catch {
      // Fallback
    }
  }
  return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (isExtensionValid()) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.get(REFRESH_TOKEN_KEY, (result) => {
          if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
            resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null);
          } else {
            resolve((result && (result[REFRESH_TOKEN_KEY] as string)) || null);
          }
        });
      });
    } catch {
      // Fallback
    }
  }
  return typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
};

export const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  if (isExtensionValid()) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.set(
          {
            [TOKEN_KEY]: accessToken,
            [REFRESH_TOKEN_KEY]: refreshToken,
          },
          () => resolve(),
        );
      });
    } catch {
      // Fallback
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {
      // Ignore
    }
  }
};

export const clearTokens = async (): Promise<void> => {
  if (isExtensionValid()) {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.remove([TOKEN_KEY, REFRESH_TOKEN_KEY], () => resolve());
      });
    } catch {
      // Fallback
    }
  }
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore
    }
  }
};
