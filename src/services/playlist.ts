import { api } from './api';
import { type Playlist, type Track } from '../types';

export const getPlaylists = async (): Promise<Playlist[]> => {
  const response = await api.get('/playlists');
  return response.data?.data || response.data || [];
};

export const getPlaylistById = async (id: string): Promise<Playlist> => {
  const response = await api.get(`/playlists/${id}`);
  return response.data?.data || response.data;
};

export const createPlaylist = async (name: string, description = '', isPublic = true): Promise<Playlist> => {
  const response = await api.post('/playlists', { name, description, isPublic });
  return response.data?.data || response.data;
};

export const updatePlaylist = async (id: string, updates: Partial<Playlist>): Promise<Playlist> => {
  const response = await api.patch(`/playlists/${id}`, updates);
  return response.data?.data || response.data;
};

export const deletePlaylist = async (id: string): Promise<void> => {
  await api.delete(`/playlists/${id}`);
};

export const addTrackToPlaylist = async (playlistId: string, track: Track): Promise<Playlist> => {
  const response = await api.post(`/playlists/${playlistId}/tracks`, {
    trackId: track.trackId,
    service: track.service,
    title: track.title,
    artist: track.artist,
    albumArt: track.albumArt || '',
    duration: track.duration || 0,
  });
  return response.data?.data || response.data;
};

export const removeTrackFromPlaylist = async (playlistId: string, trackId: string): Promise<Playlist> => {
  const response = await api.delete(`/playlists/${playlistId}/tracks/${trackId}`);
  return response.data?.data || response.data;
};

export const reorderPlaylistTracks = async (playlistId: string, oldIndex: number, newIndex: number): Promise<Playlist> => {
  const response = await api.put(`/playlists/${playlistId}/tracks/reorder`, { oldIndex, newIndex });
  return response.data?.data || response.data;
};
