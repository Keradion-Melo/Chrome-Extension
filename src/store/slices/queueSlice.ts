import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Track } from '../../types';

interface QueueState {
  tracks: Track[];
  currentIndex: number;
  sessionId: string;
}

const initialState: QueueState = {
  tracks: [],
  currentIndex: -1,
  sessionId: '',
};

export const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setQueue: (state, action: PayloadAction<Track[]>) => {
      state.tracks = action.payload;
      if (state.currentIndex >= action.payload.length) {
        state.currentIndex = action.payload.length > 0 ? 0 : -1;
      }
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    addToQueue: (state, action: PayloadAction<Track>) => {
      state.tracks.push(action.payload);
      if (state.currentIndex === -1) {
        state.currentIndex = 0;
      }
    },
    removeFromQueue: (state, action: PayloadAction<number>) => {
      state.tracks.splice(action.payload, 1);
      if (state.currentIndex > action.payload) {
        state.currentIndex -= 1;
      } else if (state.currentIndex >= state.tracks.length) {
        state.currentIndex = state.tracks.length - 1;
      }
    },
    nextTrack: (state) => {
      if (state.currentIndex < state.tracks.length - 1) {
        state.currentIndex += 1;
      }
    },
    previousTrack: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },
    clearQueue: (state) => {
      state.tracks = [];
      state.currentIndex = -1;
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
  },
});

export const { 
  setQueue, 
  setCurrentIndex,
  addToQueue, 
  removeFromQueue, 
  nextTrack, 
  previousTrack, 
  clearQueue,
  setSessionId
} = queueSlice.actions;

export default queueSlice.reducer;
