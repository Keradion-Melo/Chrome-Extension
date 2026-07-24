import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Track } from '../../types';

interface SearchState {
  query: string;
  results: Track[];
  loading: boolean;
  selectedService: 'jamendo' | 'youtube';
}

const initialState: SearchState = {
  query: '',
  results: [],
  loading: false,
  selectedService: 'jamendo',
};

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setResults: (state, action: PayloadAction<Track[]>) => {
      state.results = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setSelectedService: (state, action: PayloadAction<'jamendo' | 'youtube'>) => {
      state.selectedService = action.payload;
    },
  },
});

export const { setQuery, setResults, setLoading, setSelectedService } = searchSlice.actions;

export default searchSlice.reducer;
