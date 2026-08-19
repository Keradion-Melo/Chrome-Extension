import React, { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ListMusic, Trash2, ArrowUp, ArrowDown, X, Save, Play, Loader2 } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { removeFromQueue, clearQueue as clearQueueAction, setQueue, setCurrentIndex } from '../../../store/slices/queueSlice';
import { setCurrentTrack } from '../../../store/slices/playerSlice';
import { addPlaylist } from '../../../store/slices/librarySlice';
import { resolveTrackStream } from '../../../services/stream';
import { clearQueue as clearRemoteQueue, removeTrackFromQueue, syncQueue } from '../../../services/queue';
import { createPlaylist } from '../../../services/playlist';

const Queue: React.FC = () => {
  const dispatch = useDispatch();
  const queue = useSelector((state: RootState) => state.queue.tracks);
  const sessionId = useSelector((state: RootState) => state.queue.sessionId);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [resolvingIndex, setResolvingIndex] = useState<number | null>(null);
  const playRequestIdRef = useRef<number>(0);

  const handlePlayTrackAt = async (index: number) => {
    const track = queue[index];
    if (!track) return;
    const requestId = ++playRequestIdRef.current;
    setResolvingIndex(index);
    try {
      const resolved = await resolveTrackStream(track);
      if (playRequestIdRef.current === requestId) {
        dispatch(setCurrentIndex(index));
        dispatch(setCurrentTrack(resolved));
      }
    } catch (err) {
      console.error('Play queue track failed:', err);
    } finally {
      if (playRequestIdRef.current === requestId) {
        setResolvingIndex(null);
      }
    }
  };

  const handleRemove = async (index: number) => {
    dispatch(removeFromQueue(index));
    if (sessionId) {
      removeTrackFromQueue(sessionId, index).catch(() => {});
    }
  };

  const handleClear = async () => {
    dispatch(clearQueueAction());
    if (sessionId) {
      clearRemoteQueue(sessionId).catch(() => {});
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= queue.length) return;

    const updated = [...queue];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;

    dispatch(setQueue(updated));
    if (sessionId) {
      syncQueue(sessionId, updated).catch(() => {});
    }
  };

  const handleSaveAsPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim() || queue.length === 0) return;
    try {
      const pl = await createPlaylist(playlistName.trim(), 'Saved from active queue');
      dispatch(addPlaylist({ ...pl, tracks: queue }));
      setPlaylistName('');
      setShowSaveModal(false);
    } catch (err) {
      console.error('Save queue as playlist failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between pb-2 border-b border-melo-border">
        <div>
          <h2 className="text-sm font-bold text-melo-text-primary-dark">Playing Queue</h2>
          <p className="text-[11px] text-melo-text-subdued">{queue.length} tracks queued</p>
        </div>

        {queue.length > 0 && (
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-melo-dark-hover hover:bg-melo-dark-hover/80 text-melo-text-secondary-dark hover:text-melo-primary rounded-lg text-xs transition-colors"
              title="Save as Playlist"
            >
              <Save size={13} />
              <span className="text-[11px]">Save</span>
            </button>
            <button
              onClick={handleClear}
              className="p-1.5 text-melo-text-subdued hover:text-red-400 rounded-lg transition-colors"
              title="Clear Queue"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {queue.length > 0 ? (
          queue.map((track, idx) => {
            const isCurrent = currentTrack?.trackId === track.trackId;
            const isResolving = resolvingIndex === idx;
            return (
              <div
                key={`${track.trackId}-${idx}`}
                className={`group flex items-center justify-between p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-melo-primary/10 border border-melo-primary/30'
                    : 'bg-melo-dark-surface hover:bg-melo-dark-hover/70 border border-melo-border'
                }`}
              >
                {/* Number & Track Info */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <span className={`text-[11px] font-bold w-4 text-center ${isCurrent ? 'text-melo-primary' : 'text-melo-text-subdued'}`}>
                    {idx + 1}
                  </span>

                  <div
                    onClick={() => handlePlayTrackAt(idx)}
                    className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0 cursor-pointer bg-melo-dark-hover border border-melo-border"
                  >
                    <img
                      src={track.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100';
                      }}
                    />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isResolving ? 'opacity-100' : isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isResolving ? (
                        <Loader2 size={13} className="text-white animate-spin" />
                      ) : (
                        <Play size={13} className="text-white fill-white" />
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => handlePlayTrackAt(idx)}
                      className={`text-xs font-semibold truncate cursor-pointer ${isCurrent ? 'text-melo-primary' : 'text-melo-text-primary-dark group-hover:text-melo-primary'}`}
                    >
                      {track.title}
                    </h4>
                    <p className="text-[10px] text-melo-text-secondary-dark truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                {/* Actions: Move Up / Down / Remove */}
                <div className="flex items-center space-x-0.5 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, 'up')}
                    className="p-1 text-melo-text-subdued hover:text-melo-text-primary-dark disabled:opacity-20 disabled:hover:text-melo-text-subdued transition-colors"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    disabled={idx === queue.length - 1}
                    onClick={() => handleMove(idx, 'down')}
                    className="p-1 text-melo-text-subdued hover:text-melo-text-primary-dark disabled:opacity-20 disabled:hover:text-melo-text-subdued transition-colors"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-melo-text-subdued hover:text-red-400 transition-colors ml-0.5"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-melo-text-subdued space-y-2">
            <ListMusic size={32} className="text-melo-text-subdued/40" />
            <p className="text-xs">Your queue is empty</p>
            <p className="text-[11px] text-melo-text-subdued/70">
              Add songs from Search or Library to start playing.
            </p>
          </div>
        )}
      </div>

      {/* Save Queue Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAsPlaylist}
            className="bg-melo-dark-surface border border-melo-border rounded-2xl w-full max-w-xs p-4 shadow-elevated space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-2 border-b border-melo-border">
              <h3 className="text-sm font-bold text-melo-text-primary-dark">Save Queue as Playlist</h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-melo-text-subdued hover:text-melo-text-primary-dark"
              >
                <X size={15} />
              </button>
            </div>
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist Name"
              autoFocus
              className="w-full bg-melo-dark border border-melo-border rounded-xl px-3 py-2 text-xs text-melo-text-primary-dark focus:outline-none focus:border-melo-primary"
            />
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 bg-melo-dark-hover text-xs text-melo-text-secondary-dark rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-melo-primary text-white text-xs font-semibold rounded-xl hover:bg-melo-primary-hover shadow-glow"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default React.memo(Queue);
