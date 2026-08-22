import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { History as HistoryIcon, Trash2, Loader2 } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setHistory } from '../../../store/slices/librarySlice';
import { setCurrentTrack } from '../../../store/slices/playerSlice';
import { addToQueue } from '../../../store/slices/queueSlice';
import { getHistory, deleteHistoryItem, clearAllHistory } from '../../../services/library';
import { resolveTrackStream } from '../../../services/stream';
import TrackItem from '../common/TrackItem';
import { type Track } from '../../../types';

const History: React.FC = () => {
  const dispatch = useDispatch();
  const history = useSelector((state: RootState) => state.library.history);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
  const [loading, setLoading] = useState(false);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const playRequestIdRef = useRef<number>(0);

  useEffect(() => {
    setLoading(true);
    getHistory(30)
      .then((data) => dispatch(setHistory(data)))
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

  const handleClearAll = async () => {
    try {
      await clearAllHistory();
      dispatch(setHistory([]));
    } catch (err) {
      console.error('Clear history failed:', err);
    }
  };

  const handleRemoveHistoryItem = async (historyId: string) => {
    try {
      await deleteHistoryItem(historyId);
      dispatch(setHistory(history.filter((h) => h._id !== historyId)));
    } catch (err) {
      console.error('Remove history item failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-melo-text-subdued space-x-2">
        <Loader2 size={18} className="animate-spin text-melo-primary" />
        <span className="text-xs">Loading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearAll}
            className="flex items-center space-x-1 text-[11px] text-melo-text-subdued hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
            <span>Clear History</span>
          </button>
        </div>
      )}

      {history.length > 0 ? (
        <div className="space-y-1">
          {history.map((item) => {
            const track: Track = {
              trackId: item.trackId,
              service: item.service,
              title: item.title,
              artist: item.artist,
              albumArt: item.albumArt,
              duration: item.duration,
            };
            return (
              <TrackItem
                key={item._id}
                track={track}
                isPlaying={currentTrack?.trackId === item.trackId && isPlaying}
                isLoadingStream={resolvingTrackId === item.trackId}
                onPlay={handlePlayTrack}
                onAddToQueue={(t) => dispatch(addToQueue(t))}
                onRemove={() => handleRemoveHistoryItem(item._id)}
                showRemove
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center text-melo-text-subdued space-y-2">
          <HistoryIcon size={28} className="text-melo-text-subdued/40" />
          <p className="text-xs">No listening history yet.</p>
          <p className="text-[11px] text-melo-text-subdued/70">
            Songs you stream will automatically appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(History);
