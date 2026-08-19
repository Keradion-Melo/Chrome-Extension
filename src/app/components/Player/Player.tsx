import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../../../store/store';
import {
  setIsPlaying,
  setProgress,
  setVolume,
  toggleShuffle,
  setRepeat,
  setCurrentTrack,
} from '../../../store/slices/playerSlice';
import { nextTrack as nextQueueTrack, previousTrack as prevQueueTrack } from '../../../store/slices/queueSlice';
import { resolveTrackStream } from '../../../services/stream';
import { audioManager } from '../../../background/audio-manager';
import Disc from './Disc';
import ProgressBar from './ProgressBar';
import Controls from './Controls';

const Player: React.FC = () => {
  const dispatch = useDispatch();
  const { currentTrack, isPlaying, progress, volume, shuffle, repeat } = useSelector(
    (state: RootState) => state.player,
  );
  const queue = useSelector((state: RootState) => state.queue.tracks);
  const currentIndex = useSelector((state: RootState) => state.queue.currentIndex);

  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioManager.pause();
      dispatch(setIsPlaying(false));
    } else {
      audioManager.play();
      dispatch(setIsPlaying(true));
    }
  }, [currentTrack, dispatch, isPlaying]);

  const handleSeek = useCallback(
    (time: number) => {
      dispatch(setProgress(time));
      audioManager.seek(time);
    },
    [dispatch],
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      dispatch(setVolume(val));
      audioManager.setVolume(val);
    },
    [dispatch],
  );

  const handleNext = useCallback(async () => {
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

  const handlePrevious = useCallback(async () => {
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

  const handleToggleShuffle = useCallback(() => {
    dispatch(toggleShuffle());
  }, [dispatch]);

  const handleToggleRepeat = useCallback(() => {
    dispatch(setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none'));
  }, [dispatch, repeat]);

  return (
    <div className="w-full bg-[#1A1A24]/95 backdrop-blur-md p-4 flex flex-col justify-center items-center">
      <Disc src={currentTrack?.albumArt} isPlaying={isPlaying} />

      <div className="text-center my-3 px-2 w-full max-w-[320px]">
        <h3 className="text-sm font-bold text-white truncate">
          {currentTrack?.title || 'No track selected'}
        </h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">
          {currentTrack?.artist || 'Search or select a song from library'}
        </p>
      </div>

      <ProgressBar
        progress={progress}
        duration={currentTrack?.duration || 0}
        onSeek={handleSeek}
      />

      <Controls
        isPlaying={isPlaying}
        shuffle={shuffle}
        repeat={repeat}
        volume={volume}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
};

export default React.memo(Player);
