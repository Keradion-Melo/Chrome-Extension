import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
import { type Track } from '../../types';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
}

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  volume: 0.8,
  shuffle: false,
  repeat: 'none',
};

export const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
      state.isPlaying = true;
      state.progress = 0;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.isPlaying = action.payload;
    },
    setProgress: (state, action: PayloadAction<number>) => {
      state.progress = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
    },
    setRepeat: (state, action: PayloadAction<'none' | 'one' | 'all'>) => {
      state.repeat = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(REHYDRATE, (state, action: any) => {
      if (action.payload?.player) {
        return {
          ...action.payload.player,
          isPlaying: false, // Ensure audio starts paused on tab initialization
        };
      }
      return state;
    });
  },
});

export const {
  setCurrentTrack,
  togglePlay,
  setIsPlaying,
  setProgress,
  setVolume,
  toggleShuffle,
  setRepeat,
} = playerSlice.actions;

export default playerSlice.reducer;
