import { api } from './api';
import { type Track, type StreamingService } from '../types';

export interface StreamResponse {
  streamUrl: string;
  metadata: {
    title: string;
    artist: string;
    albumArt?: string;
    duration?: number;
    genre?: string[];
  };
}

export const getStreamUrl = async (trackId: string, service: StreamingService): Promise<StreamResponse> => {
  const response = await api.post('/stream', { trackId, service });
  return response.data?.data || response.data;
};

export const resolveTrackStream = async (track: Track): Promise<Track> => {
  if (track.streamUrl) return track;
  const res = await getStreamUrl(track.trackId, track.service);
  return {
    ...track,
    streamUrl: res.streamUrl,
    albumArt: track.albumArt || res.metadata?.albumArt,
    duration: track.duration || res.metadata?.duration,
  };
};
