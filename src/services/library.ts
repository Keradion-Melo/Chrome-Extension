import { api } from './api';
import { type FavoriteItem, type HistoryItem, type RecommendationItem, type Track, type StreamingService } from '../types';

// Favorites
export const getFavorites = async (): Promise<FavoriteItem[]> => {
  const response = await api.get('/favorites');
  return response.data?.data || response.data || [];
};

export const addFavorite = async (track: Track): Promise<FavoriteItem> => {
  const response = await api.post('/favorites', {
    trackId: track.trackId,
    service: track.service,
    title: track.title,
    artist: track.artist,
    albumArt: track.albumArt || '',
  });
  return response.data?.data || response.data;
};

export const removeFavorite = async (trackId: string, service: StreamingService = 'jamendo'): Promise<void> => {
  await api.delete(`/favorites/${trackId}`, {
    params: { service },
  });
};

// History
export const getHistory = async (limit = 20): Promise<HistoryItem[]> => {
  const response = await api.get('/history', {
    params: { limit },
  });
  return response.data?.data || response.data || [];
};

export const deleteHistoryItem = async (historyId: string): Promise<void> => {
  await api.delete(`/history/${historyId}`);
};

export const clearAllHistory = async (): Promise<void> => {
  await api.delete('/history');
};

// Recommendations
export const getRecommendations = async (): Promise<RecommendationItem[]> => {
  const response = await api.get('/recommendations');
  return response.data?.data || response.data || [];
};
