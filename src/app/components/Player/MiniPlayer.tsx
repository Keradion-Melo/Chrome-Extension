import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Play, Pause, SkipBack, SkipForward, Disc } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setIsPlaying, setCurrentTrack } from '../../../store/slices/playerSlice';
import { nextTrack as nextQueueTrack, previousTrack as prevQueueTrack } from '../../../store/slices/queueSlice';
import { resolveTrackStream } from '../../../services/stream';
import { audioManager } from '../../../background/audio-manager';

interface MiniPlayerProps {
  onExpand?: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, progress } = useSelector((state: RootState) => state.player);
  const queue = useSelector((state: RootState) => state.queue.tracks);
  const currentIndex = useSelector((state: RootState) => state.queue.currentIndex);
  const shuffle = useSelector((state: RootState) => state.player.shuffle);
  const repeat = useSelector((state: RootState) => state.player.repeat);

  const duration = currentTrack?.duration || 1;
  const progressPercent = Math.min(100, Math.max(0, (progress / duration) * 100));

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPlaying) {
      audioManager.play();
      dispatch(setIsPlaying(true));
    } else {
      audioManager.pause();
      dispatch(setIsPlaying(false));
    }
  }, [dispatch, isPlaying]);

  const handleNext = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (nextIdx >= queue.length) {
      if (repeat === 'all') nextIdx = 0;
      else return;
    }
    const nextTrackItem = queue[nextIdx];
    if (nextTrackItem) {
      dispatch(nextQueueTrack());
      try {
        const resolved = await resolveTrackStream(nextTrackItem);
        dispatch(setCurrentTrack(resolved));
      } catch (err) {
        console.error('Next track failed:', err);
      }
    }
  }, [currentIndex, dispatch, queue, repeat, shuffle]);

  const handlePrevious = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (queue.length === 0) return;
    const prevIdx = currentIndex > 0 ? currentIndex - 1 : 0;
    const prevTrackItem = queue[prevIdx];
    if (prevTrackItem) {
      dispatch(prevQueueTrack());
      try {
        const resolved = await resolveTrackStream(prevTrackItem);
        dispatch(setCurrentTrack(resolved));
      } catch (err) {
        console.error('Previous track failed:', err);
      }
    }
  }, [currentIndex, dispatch, queue]);

  if (!currentTrack) {
    return null;
  }

  return (
    <div
      onClick={onExpand}
      className="relative bg-[#1A1A26]/95 hover:bg-[#222232] backdrop-blur-md border-t border-white/10 px-3.5 py-2 flex items-center justify-between cursor-pointer transition-colors select-none group shrink-0"
    >
      {/* Top Thin Progress Line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-melo-primary transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Track Info */}
      <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-[#282C38] border border-white/10">
          {currentTrack.albumArt ? (
            <img
              src={currentTrack.albumArt}
              alt={currentTrack.title}
              className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-melo-primary">
              <Disc size={16} className={isPlaying ? 'animate-spin-slow' : ''} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-white truncate group-hover:text-melo-primary transition-colors">
            {currentTrack.title}
          </h4>
          <p className="text-[10px] text-gray-400 truncate">
            {currentTrack.artist}
          </p>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center space-x-1 shrink-0">
        <button
          onClick={handlePrevious}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Previous track"
        >
          <SkipBack size={14} />
        </button>

        <button
          onClick={handlePlayPause}
          className="w-7 h-7 rounded-full bg-melo-primary text-white flex items-center justify-center shadow-glow hover:scale-105 active:scale-95 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" className="ml-0.5" />}
        </button>

        <button
          onClick={handleNext}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Next track"
        >
          <SkipForward size={14} />
        </button>
      </div>
    </div>
  );
};

export default React.memo(MiniPlayer);
