import { api } from './api';
import { type Track, type StreamingService } from '../types';

export const searchTracks = async (query: string, service: StreamingService = 'jamendo', limit = 20): Promise<Track[]> => {
  if (!query.trim()) return [];
  const response = await api.get('/search', {
    params: { q: query, service, limit },
  });
  const data = response.data?.data || response.data;
  return (data.results || []).map((t: any) => ({
    trackId: t.trackId,
    service: t.service,
    title: t.title,
    artist: t.artist,
    albumArt: t.albumArt,
    duration: t.duration,
  }));
};

export const searchJamendo = async (query: string): Promise<Track[]> => {
  return searchTracks(query, 'jamendo');
};

export const searchYoutube = async (query: string): Promise<Track[]> => {
  return searchTracks(query, 'youtube');
};
