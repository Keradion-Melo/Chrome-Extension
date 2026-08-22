import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Sparkles, Play, Plus, Loader2 } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setRecommendations } from '../../../store/slices/librarySlice';
import { setCurrentTrack } from '../../../store/slices/playerSlice';
import { addToQueue } from '../../../store/slices/queueSlice';
import { getRecommendations } from '../../../services/library';
import { resolveTrackStream } from '../../../services/stream';
import { type Track } from '../../../types';

const Recommendations: React.FC = () => {
  const dispatch = useDispatch();
  const recommendations = useSelector((state: RootState) => state.library.recommendations);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
  const [loading, setLoading] = useState(false);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const playRequestIdRef = useRef<number>(0);

  useEffect(() => {
    setLoading(true);
    getRecommendations()
      .then((data) => dispatch(setRecommendations(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handlePlay = async (item: any) => {
    const track: Track = {
      trackId: item.trackId,
      service: item.service,
      title: item.title,
      artist: item.artist,
      albumArt: item.albumArt,
      duration: item.duration,
    };
    const requestId = ++playRequestIdRef.current;
    setResolvingTrackId(track.trackId);
    try {
      const resolved = await resolveTrackStream(track);
      if (playRequestIdRef.current === requestId) {
        dispatch(setCurrentTrack(resolved));
      }
    } catch (err) {
      console.error('Play recommendation failed:', err);
    } finally {
      if (playRequestIdRef.current === requestId) {
        setResolvingTrackId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-melo-text-subdued space-x-2">
        <Loader2 size={18} className="animate-spin text-melo-primary" />
        <span className="text-xs">Finding music for you...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-1.5 px-1 text-xs text-melo-text-secondary-dark">
        <Sparkles size={14} className="text-melo-primary" />
        <span>Picks based on your listening taste</span>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {recommendations.map((rec) => {
            const isCurrent = currentTrack?.trackId === rec.trackId && isPlaying;
            const isResolving = resolvingTrackId === rec.trackId;
            return (
              <div
                key={rec._id || rec.trackId}
                onClick={() => handlePlay(rec)}
                className="group relative bg-melo-dark-surface hover:bg-melo-dark-hover border border-melo-border hover:border-melo-primary/50 p-2.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-melo-dark-hover mb-2">
                  <img
                    src={rec.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200'}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200';
                    }}
                  />
                  <div className={`absolute inset-0 bg-black/40 ${isResolving ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} flex items-center justify-center transition-opacity`}>
                    {isResolving ? (
                      <Loader2 size={20} className="text-white animate-spin" />
                    ) : (
                      <Play size={20} className="text-white fill-white" />
                    )}
                  </div>
                  {rec.service === 'youtube' && (
                    <span className="absolute top-1 right-1 text-[8px] bg-red-600/90 text-white font-bold px-1 rounded">
                      YT
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-melo-primary' : 'text-melo-text-primary-dark'}`}>
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-melo-text-secondary-dark truncate mt-0.5">
                    {rec.artist}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch(addToQueue({
                      trackId: rec.trackId,
                      service: rec.service,
                      title: rec.title,
                      artist: rec.artist,
                      albumArt: rec.albumArt,
                      duration: rec.duration,
                    }));
                  }}
                  className="mt-2 flex items-center justify-center space-x-1 py-1 px-2 bg-melo-dark hover:bg-melo-primary text-melo-text-secondary-dark hover:text-white rounded-lg text-[10px] transition-colors"
                >
                  <Plus size={11} />
                  <span>Queue</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-melo-text-subdued space-y-2">
          <Sparkles size={28} className="text-melo-text-subdued/40" />
          <p className="text-xs">No recommendations yet.</p>
          <p className="text-[11px] text-melo-text-subdued/70">
            Listen to more tracks to generate recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(Recommendations);
