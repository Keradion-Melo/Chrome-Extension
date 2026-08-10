import { api } from './api';
import { store } from '../store/store';
import { logout as logoutAction, setUser } from '../store/slices/userSlice';
import { clearTokens } from './tokenService';
import { type UserProfile } from '../types';

export { getAuthToken, setTokens, clearTokens } from './tokenService';

export const getCurrentUser = async (): Promise<UserProfile> => {
  const response = await api.get('/users/me');
  const user = response.data?.data || response.data;
  store.dispatch(setUser(user));
  return user;
};

export const updateProfile = async (data: {
  profile?: { displayName?: string; bio?: string };
  preferences?: any;
}): Promise<UserProfile> => {
  const sanitizedData: any = {};

  if (data.profile) {
    sanitizedData.profile = data.profile;
  }

  if (data.preferences) {
    const { defaultService, theme, autoplay, quality } = data.preferences;
    const cleanPrefs: any = {};
    if (defaultService !== undefined) cleanPrefs.defaultService = defaultService;
    if (theme !== undefined) {
      cleanPrefs.theme =
        theme === 'system'
          ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light')
          : theme;
    }
    if (autoplay !== undefined) cleanPrefs.autoplay = autoplay;
    if (quality !== undefined) cleanPrefs.quality = quality;
    sanitizedData.preferences = cleanPrefs;
  }

  const response = await api.patch('/users/me', sanitizedData);
  const user = response.data?.data || response.data;
  store.dispatch(setUser(user));
  return user;
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (err) {
    // Ignore logout network failure
  }
  await clearTokens();
  store.dispatch(logoutAction());
};
