import { api } from './api';
import { type Track, type QueueSession } from '../types';

export const getQueue = async (sessionId: string): Promise<QueueSession> => {
  const response = await api.get('/queue', { params: { sessionId } });
  return response.data?.data || response.data;
};

export const addTrackToQueue = async (sessionId: string, track: Track): Promise<QueueSession> => {
  const response = await api.post('/queue/add', {
    trackId: track.trackId,
    service: track.service,
    title: track.title,
    artist: track.artist,
    albumArt: track.albumArt || '',
    duration: track.duration || 0,
  }, { params: { sessionId } });
  return response.data?.data || response.data;
};

export const updateQueueState = async (
  sessionId: string,
  currentIndex: number,
  status: 'playing' | 'paused' | 'stopped',
  currentTime: number
): Promise<QueueSession> => {
  const response = await api.patch('/queue/current', {
    currentIndex,
    status,
    currentTime,
  }, { params: { sessionId } });
  return response.data?.data || response.data;
};

export const reorderQueue = async (sessionId: string, order: number[]): Promise<QueueSession> => {
  const response = await api.put('/queue/reorder', { order }, { params: { sessionId } });
  return response.data?.data || response.data;
};

export const syncQueue = async (sessionId: string, tracks: Track[]): Promise<QueueSession> => {
  const response = await api.put('/queue/sync', { tracks }, { params: { sessionId } });
  return response.data?.data || response.data;
};

export const removeTrackFromQueue = async (sessionId: string, position: number): Promise<QueueSession> => {
  const response = await api.delete(`/queue/remove/${position}`, { params: { sessionId } });
  return response.data?.data || response.data;
};

export const clearQueue = async (sessionId: string): Promise<QueueSession> => {
  const response = await api.delete('/queue/clear', { params: { sessionId } });
  return response.data?.data || response.data;
};
