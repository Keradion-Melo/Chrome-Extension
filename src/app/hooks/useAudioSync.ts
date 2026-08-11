import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProgress, setIsPlaying, setCurrentTrack } from '../../store/slices/playerSlice';
import { nextTrack as nextQueueTrack } from '../../store/slices/queueSlice';
import { audioManager } from '../../background/audio-manager';
import { resolveTrackStream } from '../../services/stream';
import { api } from '../../services/api';
import { type RootState } from '../../store/store';

export const useAudioSync = () => {
  const dispatch = useDispatch();
  const queue = useSelector((state: RootState) => state.queue.tracks);
  const currentIndex = useSelector((state: RootState) => state.queue.currentIndex);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
  const volume = useSelector((state: RootState) => state.player.volume);
  const repeat = useSelector((state: RootState) => state.player.repeat);
  const shuffle = useSelector((state: RootState) => state.player.shuffle);
  const autoplay = useSelector((state: RootState) => state.user.preferences.autoplay);

  const lastLoadedTrackUrl = useRef<string | null>(null);
  const recordedTrackIdRef = useRef<string | null>(null);
  const isRefreshingStreamRef = useRef<boolean>(false);

  // Store latest state in refs so callbacks don't have to be re-subscribed on every state change
  const stateRef = useRef({
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    autoplay,
    repeat,
    shuffle,
  });

  useEffect(() => {
    stateRef.current = {
      queue,
      currentIndex,
      currentTrack,
      isPlaying,
      autoplay,
      repeat,
      shuffle,
    };
  }, [queue, currentIndex, currentTrack, isPlaying, autoplay, repeat, shuffle]);

  // 1. Sync volume to audio engine
  useEffect(() => {
    audioManager.setVolume(volume);
  }, [volume]);

  // 2. Play new track stream when currentTrack or streamUrl changes
  useEffect(() => {
    if (currentTrack?.streamUrl && currentTrack.streamUrl !== lastLoadedTrackUrl.current) {
      lastLoadedTrackUrl.current = currentTrack.streamUrl;
      audioManager.playTrack(currentTrack.streamUrl);
    }
  }, [currentTrack?.streamUrl]);

  // 3. Audio manager event subscriptions (subscribed once with clean unmount cleanup)
  useEffect(() => {
    const handleTimeUpdate = (time: number) => {
      if (typeof time === 'number' && isFinite(time)) {
        dispatch(setProgress(time));
      }
    };

    const handlePlay = () => {
      dispatch(setIsPlaying(true));

      const active = stateRef.current.currentTrack;
      if (active && recordedTrackIdRef.current !== active.trackId) {
        recordedTrackIdRef.current = active.trackId;
        api
          .post('/stream/played', {
            trackId: active.trackId,
            service: active.service,
            title: active.title,
            artist: active.artist,
            albumArt: active.albumArt,
            position: 0,
            duration: active.duration || 0,
          })
          .catch(() => {});
      }
    };

    const handlePause = () => {
      dispatch(setIsPlaying(false));
    };

    const handleError = async (err: any) => {
      console.warn('[Melo useAudioSync] Audio error received:', err);
      const active = stateRef.current.currentTrack;

      // If playback failed on an active track and we haven't retried yet, fetch a fresh stream URL
      if (active && !isRefreshingStreamRef.current && stateRef.current.isPlaying) {
        isRefreshingStreamRef.current = true;
        console.log('[Melo useAudioSync] Attempting to refresh expired stream for track:', active.title);
        try {
          // Force stream re-resolution
          const fresh = await resolveTrackStream({ ...active, streamUrl: undefined });
          if (fresh?.streamUrl) {
            lastLoadedTrackUrl.current = fresh.streamUrl;
            dispatch(setCurrentTrack(fresh));
            audioManager.playTrack(fresh.streamUrl);
            return;
          }
        } catch (refreshErr) {
          console.error('[Melo useAudioSync] Stream refresh failed:', refreshErr);
        } finally {
          isRefreshingStreamRef.current = false;
        }
      }

      dispatch(setIsPlaying(false));
    };

    const handleEnded = async () => {
      dispatch(setIsPlaying(false));
      dispatch(setProgress(0));
      recordedTrackIdRef.current = null;

      const { repeat: rep, queue: q, currentIndex: idx, shuffle: shuf, autoplay: auto, currentTrack: curr } = stateRef.current;

      // Single repeat mode
      if (rep === 'one' && curr?.streamUrl) {
        audioManager.seek(0);
        audioManager.play();
        return;
      }

      // Autoplay or repeat-all with queue
      if (q.length > 0 && (auto || rep === 'all')) {
        let nextIdx = idx + 1;
        if (shuf) {
          nextIdx = Math.floor(Math.random() * q.length);
        } else if (nextIdx >= q.length) {
          if (rep === 'all') {
            nextIdx = 0;
          } else {
            return;
          }
        }

        const nextTrackItem = q[nextIdx];
        if (nextTrackItem) {
          dispatch(nextQueueTrack());
          try {
            const resolved = await resolveTrackStream(nextTrackItem);
            dispatch(setCurrentTrack(resolved));
          } catch (err) {
            console.error('[Melo useAudioSync] Autoplay next track failed:', err);
          }
        }
      }
    };

    audioManager.on('timeupdate', handleTimeUpdate);
    audioManager.on('play', handlePlay);
    audioManager.on('pause', handlePause);
    audioManager.on('ended', handleEnded);
    audioManager.on('error', handleError);

    return () => {
      audioManager.off('timeupdate', handleTimeUpdate);
      audioManager.off('play', handlePlay);
      audioManager.off('pause', handlePause);
      audioManager.off('ended', handleEnded);
      audioManager.off('error', handleError);
    };
  }, [dispatch]);
};
