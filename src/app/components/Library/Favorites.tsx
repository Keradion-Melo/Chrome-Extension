import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, Loader2 } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setFavorites, removeFavoriteState } from '../../../store/slices/librarySlice';
import { setCurrentTrack } from '../../../store/slices/playerSlice';
import { addToQueue } from '../../../store/slices/queueSlice';
import { getFavorites, removeFavorite } from '../../../services/library';
import { resolveTrackStream } from '../../../services/stream';
import TrackItem from '../common/TrackItem';
import { type Track } from '../../../types';

const Favorites: React.FC = () => {
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.library.favorites);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
  const [loading, setLoading] = useState(false);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const playRequestIdRef = useRef<number>(0);

  useEffect(() => {
    setLoading(true);
    getFavorites()
      .then((data) => dispatch(setFavorites(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handlePlayTrack = async (track: Track) => {
    const requestId = ++playRequestIdRef.current;
    setResolvingTrackId(track.trackId);
    try {
      const resolved = await resolveTrackStream(track);
      if (playRequestIdRef.current === requestId) {
        dispatch(setCurrentTrack(resolved));
      }
    } catch (err) {
      console.error('Stream failed:', err);
    } finally {
      if (playRequestIdRef.current === requestId) {
        setResolvingTrackId(null);
      }
    }
  };

  const handleToggleFavorite = async (track: Track) => {
    dispatch(removeFavoriteState(track.trackId));
    await removeFavorite(track.trackId, track.service).catch(() => {});
  };

  const handleAddToQueue = (track: Track) => {
    dispatch(addToQueue(track));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-melo-text-subdued space-x-2">
        <Loader2 size={18} className="animate-spin text-melo-primary" />
        <span className="text-xs">Loading favorites...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {favorites.length > 0 ? (
        favorites.map((fav) => {
          const track: Track = {
            trackId: fav.trackId,
            service: fav.service,
            title: fav.title,
            artist: fav.artist,
            albumArt: fav.albumArt,
          };
          return (
            <TrackItem
              key={fav._id || fav.trackId}
              track={track}
              isPlaying={currentTrack?.trackId === fav.trackId && isPlaying}
              isLoadingStream={resolvingTrackId === fav.trackId}
              isFavorite={true}
              onPlay={handlePlayTrack}
              onToggleFavorite={handleToggleFavorite}
              onAddToQueue={handleAddToQueue}
            />
          );
        })
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-melo-text-subdued space-y-2">
          <Heart size={28} className="text-melo-text-subdued/40" />
          <p className="text-xs">No favorite tracks yet.</p>
          <p className="text-[11px] text-melo-text-subdued/70">
            Click the heart icon on any song to save it here.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(Favorites);
