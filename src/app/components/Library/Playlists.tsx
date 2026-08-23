import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Trash2, ArrowLeft, Play, Music2, Loader2 } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setPlaylists, addPlaylist, removePlaylistState, setSelectedPlaylist } from '../../../store/slices/librarySlice';
import { setCurrentTrack } from '../../../store/slices/playerSlice';
import { setQueue } from '../../../store/slices/queueSlice';
import { getPlaylists, createPlaylist, deletePlaylist, removeTrackFromPlaylist } from '../../../services/playlist';
import { resolveTrackStream } from '../../../services/stream';
import TrackItem from '../common/TrackItem';
import { type Playlist, type Track } from '../../../types';

const Playlists: React.FC = () => {
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.library.playlists);
  const selectedPlaylist = useSelector((state: RootState) => state.library.selectedPlaylist);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);

  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setLoading(true);
    getPlaylists()
      .then((data) => dispatch(setPlaylists(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [dispatch]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const pl = await createPlaylist(name.trim(), description.trim());
      dispatch(addPlaylist(pl));
      setName('');
      setDescription('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Create playlist failed:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deletePlaylist(id);
      dispatch(removePlaylistState(id));
    } catch (err) {
      console.error('Delete playlist failed:', err);
    }
  };

  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const playRequestIdRef = React.useRef<number>(0);

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

  const handlePlayAll = async (playlist: Playlist) => {
    if (!playlist.tracks || playlist.tracks.length === 0) return;
    dispatch(setQueue(playlist.tracks));
    const firstTrack = playlist.tracks[0];
    const requestId = ++playRequestIdRef.current;
    setResolvingTrackId(firstTrack.trackId);
    try {
      const first = await resolveTrackStream(firstTrack);
      if (playRequestIdRef.current === requestId) {
        dispatch(setCurrentTrack(first));
      }
    } catch (err) {
      console.error('Play all failed:', err);
    } finally {
      if (playRequestIdRef.current === requestId) {
        setResolvingTrackId(null);
      }
    }
  };

  const handleRemoveTrack = async (track: Track) => {
    if (!selectedPlaylist) return;
    try {
      const updated = await removeTrackFromPlaylist(selectedPlaylist._id, track.trackId);
      dispatch(setSelectedPlaylist(updated));
      dispatch(setPlaylists(playlists.map(p => p._id === updated._id ? updated : p)));
    } catch (err) {
      console.error('Remove track failed:', err);
    }
  };

  // Detailed Playlist View
  if (selectedPlaylist) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => dispatch(setSelectedPlaylist(null))}
            className="flex items-center space-x-1.5 text-xs text-melo-text-secondary-dark hover:text-melo-primary transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Playlists</span>
          </button>

          {selectedPlaylist.tracks?.length > 0 && (
            <button
              onClick={() => handlePlayAll(selectedPlaylist)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-melo-primary text-white text-xs font-semibold rounded-xl hover:bg-melo-primary-hover shadow-glow transition-colors"
            >
              <Play size={14} className="fill-white" />
              <span>Play All</span>
            </button>
          )}
        </div>

        <div className="bg-melo-dark-surface border border-melo-border p-3.5 rounded-2xl">
          <h2 className="text-base font-bold text-melo-text-primary-dark truncate">
            {selectedPlaylist.name}
          </h2>
          {selectedPlaylist.description && (
            <p className="text-xs text-melo-text-secondary-dark mt-1">
              {selectedPlaylist.description}
            </p>
          )}
          <p className="text-[11px] text-melo-text-subdued mt-1">
            {selectedPlaylist.tracks?.length || 0} tracks
          </p>
        </div>

        <div className="space-y-1">
          {selectedPlaylist.tracks && selectedPlaylist.tracks.length > 0 ? (
            selectedPlaylist.tracks.map((track) => (
              <TrackItem
                key={track.trackId + track.service}
                track={track}
                isPlaying={currentTrack?.trackId === track.trackId && isPlaying}
                isLoadingStream={resolvingTrackId === track.trackId}
                onPlay={handlePlayTrack}
                onRemove={handleRemoveTrack}
                showRemove
              />
            ))
          ) : (
            <div className="text-center py-10 text-melo-text-subdued text-xs">
              This playlist is empty. Add songs from Search!
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full flex items-center justify-center space-x-2 py-2.5 bg-melo-dark-surface hover:bg-melo-dark-hover border border-dashed border-melo-border hover:border-melo-primary text-xs font-medium text-melo-text-secondary-dark hover:text-melo-primary rounded-xl transition-all"
      >
        <Plus size={16} />
        <span>Create New Playlist</span>
      </button>

      {/* Playlists List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-melo-text-subdued space-x-2">
          <Loader2 size={18} className="animate-spin text-melo-primary" />
          <span className="text-xs">Loading playlists...</span>
        </div>
      ) : playlists.length > 0 ? (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <div
              key={pl._id}
              onClick={() => dispatch(setSelectedPlaylist(pl))}
              className="group flex items-center justify-between p-3 bg-melo-dark-surface hover:bg-melo-dark-hover border border-melo-border rounded-xl cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-lg bg-melo-dark-hover flex items-center justify-center text-melo-primary shrink-0 border border-melo-border">
                  <Music2 size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-melo-text-primary-dark truncate group-hover:text-melo-primary transition-colors">
                    {pl.name}
                  </h4>
                  <p className="text-[11px] text-melo-text-subdued">
                    {pl.tracks?.length || 0} tracks
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayAll(pl);
                  }}
                  className="p-2 text-melo-text-subdued hover:text-melo-primary transition-colors"
                  title="Play all"
                >
                  <Play size={14} className="fill-current" />
                </button>
                <button
                  onClick={(e) => handleDelete(pl._id, e)}
                  className="p-2 text-melo-text-subdued hover:text-red-400 transition-colors"
                  title="Delete playlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-melo-text-subdued text-xs">
          No playlists created yet. Click above to create one!
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-melo-dark-surface border border-melo-border rounded-2xl w-full max-w-xs p-4 shadow-elevated space-y-3 animate-fadeIn"
          >
            <h3 className="text-sm font-bold text-melo-text-primary-dark">Create Playlist</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist Name (e.g. My Favorites)"
              autoFocus
              className="w-full bg-melo-dark border border-melo-border rounded-xl px-3 py-2 text-xs text-melo-text-primary-dark focus:outline-none focus:border-melo-primary"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full bg-melo-dark border border-melo-border rounded-xl px-3 py-2 text-xs text-melo-text-primary-dark focus:outline-none focus:border-melo-primary"
            />
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-melo-dark-hover text-xs text-melo-text-secondary-dark rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-melo-primary text-white text-xs font-semibold rounded-xl hover:bg-melo-primary-hover shadow-glow"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default React.memo(Playlists);
