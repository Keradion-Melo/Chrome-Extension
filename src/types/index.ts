export type StreamingService = 'jamendo' | 'youtube';

export interface Track {
  id?: string;
  trackId: string;
  service: StreamingService;
  title: string;
  artist: string;
  albumArt?: string;
  duration?: number;
  streamUrl?: string;
  genre?: string[];
  addedAt?: string;
  addedBy?: string;
}

export interface UserPreferences {
  defaultService?: StreamingService;
  theme?: 'dark' | 'light';
  autoplay?: boolean;
  quality?: string;
  youtubeEnabled?: boolean;
}

export interface UserProfile {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  profile?: {
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  preferences?: UserPreferences;
  createdAt?: string;
}

export interface Playlist {
  _id: string;
  id?: string;
  userId: string;
  name: string;
  description?: string;
  coverArt?: string;
  isPublic?: boolean;
  isCollaborative?: boolean;
  playCount?: number;
  tracks: Track[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QueueTrack extends Track {
  position?: number;
  requestedBy?: string;
}

export interface QueueSession {
  _id?: string;
  userId?: string;
  sessionId: string;
  tracks: QueueTrack[];
  currentIndex: number;
  status: 'playing' | 'paused' | 'stopped';
  currentTime: number;
  updatedAt?: string;
}

export interface FavoriteItem {
  _id: string;
  userId: string;
  trackId: string;
  service: StreamingService;
  title: string;
  artist: string;
  albumArt?: string;
  addedAt: string;
}

export interface HistoryItem {
  _id: string;
  userId: string;
  trackId: string;
  service: StreamingService;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  playedDuration: number;
  playedAt: string;
}

export interface RecommendationItem {
  _id: string;
  trackId: string;
  service: StreamingService;
  title: string;
  artist: string;
  albumArt?: string;
  duration?: number;
  genre?: string[];
  popularity?: number;
}
