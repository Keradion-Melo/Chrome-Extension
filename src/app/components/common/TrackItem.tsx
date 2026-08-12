import React, { useState } from 'react';
import { Play, Plus, Heart, MoreVertical, ListPlus, Loader2 } from 'lucide-react';
import { type Track } from '../../../types';

interface TrackItemProps {
  track: Track;
  isPlaying?: boolean;
  isLoadingStream?: boolean;
  isFavorite?: boolean;
  onPlay: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onRemove?: (track: Track) => void;
  showRemove?: boolean;
}

const formatDuration = (seconds?: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const TrackItem: React.FC<TrackItemProps> = ({
  track,
  isPlaying = false,
  isLoadingStream = false,
  isFavorite = false,
  onPlay,
  onAddToQueue,
  onToggleFavorite,
  onAddToPlaylist,
  onRemove,
  showRemove = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`group relative flex items-center justify-between p-2 rounded-xl transition-all duration-200 ${
        isPlaying
          ? 'bg-melo-primary/10 border border-melo-primary/30'
          : 'hover:bg-melo-dark-hover/60 border border-transparent'
      }`}
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {/* Album Art with Hover Play / Loading State */}
        <div
          onClick={() => !isLoadingStream && onPlay(track)}
          className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-melo-dark-hover border border-melo-border group/art"
        >
          <img
            src={track.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/art:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100';
            }}
          />
          <div
            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${
              isLoadingStream ? 'opacity-100' : isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
            }`}
          >
            {isLoadingStream ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <Play size={16} className="text-white fill-white" />
            )}
          </div>
        </div>

        {/* Title, Artist, & Service Badge */}
        <div className="min-w-0 flex-1">
          <h4
            onClick={() => !isLoadingStream && onPlay(track)}
            className={`text-xs font-semibold truncate cursor-pointer transition-colors ${
              isPlaying ? 'text-melo-primary font-bold' : 'text-melo-text-primary-dark group-hover:text-melo-primary'
            }`}
          >
            {track.title}
          </h4>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className="text-[11px] text-melo-text-secondary-dark truncate max-w-[120px]">
              {track.artist}
            </span>
            <span className="text-melo-border text-[8px]">•</span>
            <span
              className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                track.service === 'youtube'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {track.service === 'youtube' ? 'YouTube' : 'Jamendo'}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls & Duration */}
      <div className="flex items-center space-x-1 shrink-0 ml-2">
        <span className="text-[10px] text-melo-text-subdued hidden sm:inline mr-1">
          {formatDuration(track.duration)}
        </span>

        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(track)}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite ? 'text-melo-primary' : 'text-melo-text-subdued hover:text-melo-primary'
            }`}
            title={isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          >
            <Heart size={14} className={isFavorite ? 'fill-melo-primary' : ''} />
          </button>
        )}

        {onAddToQueue && (
          <button
            onClick={() => onAddToQueue(track)}
            className="p-1.5 rounded-lg text-melo-text-subdued hover:text-melo-text-primary-dark hover:bg-melo-dark-hover transition-colors"
            title="Add to Queue"
          >
            <Plus size={14} />
          </button>
        )}

        {/* Overflow Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg text-melo-text-subdued hover:text-melo-text-primary-dark hover:bg-melo-dark-hover transition-colors"
          >
            <MoreVertical size={14} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-36 bg-melo-dark-surface border border-melo-border rounded-xl shadow-elevated p-1 z-50 animate-fadeIn">
                {onAddToPlaylist && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onAddToPlaylist(track);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-left text-melo-text-secondary-dark hover:text-melo-text-primary-dark hover:bg-melo-dark-hover rounded-lg transition-colors"
                  >
                    <ListPlus size={13} />
                    <span>Add to Playlist</span>
                  </button>
                )}
                {showRemove && onRemove && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onRemove(track);
                    }}
                    className="w-full flex items-center space-x-2 px-2.5 py-1.5 text-xs text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <span>Remove</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TrackItem);
