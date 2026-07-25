import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Playlist, type FavoriteItem, type HistoryItem, type RecommendationItem } from '../../types';

interface LibraryState {
  playlists: Playlist[];
  favorites: FavoriteItem[];
  history: HistoryItem[];
  recommendations: RecommendationItem[];
  selectedPlaylist: Playlist | null;
  loading: boolean;
}

const initialState: LibraryState = {
  playlists: [],
  favorites: [],
  history: [],
  recommendations: [],
  selectedPlaylist: null,
  loading: false,
};

export const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setPlaylists: (state, action: PayloadAction<Playlist[]>) => {
      state.playlists = action.payload;
    },
    addPlaylist: (state, action: PayloadAction<Playlist>) => {
      state.playlists.unshift(action.payload);
    },
    removePlaylistState: (state, action: PayloadAction<string>) => {
      state.playlists = state.playlists.filter(p => p._id !== action.payload && p.id !== action.payload);
      if (state.selectedPlaylist?._id === action.payload) {
        state.selectedPlaylist = null;
      }
    },
    setSelectedPlaylist: (state, action: PayloadAction<Playlist | null>) => {
      state.selectedPlaylist = action.payload;
    },
    setFavorites: (state, action: PayloadAction<FavoriteItem[]>) => {
      state.favorites = action.payload;
    },
    addFavoriteState: (state, action: PayloadAction<FavoriteItem>) => {
      if (!state.favorites.some(f => f.trackId === action.payload.trackId)) {
        state.favorites.unshift(action.payload);
      }
    },
    removeFavoriteState: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter(f => f.trackId !== action.payload);
    },
    setHistory: (state, action: PayloadAction<HistoryItem[]>) => {
      state.history = action.payload;
    },
    setRecommendations: (state, action: PayloadAction<RecommendationItem[]>) => {
      state.recommendations = action.payload;
    },
    setLibraryLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setPlaylists,
  addPlaylist,
  removePlaylistState,
  setSelectedPlaylist,
  setFavorites,
  addFavoriteState,
  removeFavoriteState,
  setHistory,
  setRecommendations,
  setLibraryLoading,
} = librarySlice.actions;

export default librarySlice.reducer;
