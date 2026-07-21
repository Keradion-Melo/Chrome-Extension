import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type UserProfile, type StreamingService } from '../../types';

export type AppTheme = 'system' | 'dark' | 'light';

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  preferences: {
    theme: AppTheme;
    autoplay: boolean;
    defaultService: StreamingService;
    youtubeEnabled: boolean;
  };
}

const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
  preferences: {
    theme: 'system',
    autoplay: true,
    defaultService: 'jamendo',
    youtubeEnabled: true,
  },
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.profile = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload?.preferences?.theme) {
        state.preferences.theme = action.payload.preferences.theme as AppTheme;
      }
      if (action.payload?.preferences?.defaultService) {
        state.preferences.defaultService = action.payload.preferences.defaultService;
      }
      if (typeof action.payload?.preferences?.autoplay === 'boolean') {
        state.preferences.autoplay = action.payload.preferences.autoplay;
      }
    },
    logout: (state) => {
      state.profile = null;
      state.isAuthenticated = false;
    },
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.preferences.theme = action.payload;
    },
    setAutoplay: (state, action: PayloadAction<boolean>) => {
      state.preferences.autoplay = action.payload;
    },
    setDefaultService: (state, action: PayloadAction<StreamingService>) => {
      state.preferences.defaultService = action.payload;
    },
    setYoutubeEnabled: (state, action: PayloadAction<boolean>) => {
      state.preferences.youtubeEnabled = action.payload;
    },
  },
});

export const { setUser, logout, setTheme, setAutoplay, setDefaultService, setYoutubeEnabled } = userSlice.actions;

export default userSlice.reducer;
