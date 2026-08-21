import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search as SearchIcon, X, Loader2, Sparkles, PlusCircle, ArrowRight } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setQuery, setResults, setLoading, setSelectedService } from '../../../store/slices/searchSlice';
import { setCurrentTrack } from '../../../store/slices/playerSlice';
import { addToQueue } from '../../../store/slices/queueSlice';
import { addFavoriteState, removeFavoriteState, addPlaylist } from '../../../store/slices/librarySlice';
import { searchTracks } from '../../../services/search';
import { resolveTrackStream } from '../../../services/stream';
import { addFavorite, removeFavorite } from '../../../services/library';
import { addTrackToQueue } from '../../../services/queue';
import { addTrackToPlaylist, getPlaylists, createPlaylist } from '../../../services/playlist';
import ServiceToggle from './ServiceToggle';
import TrackItem from '../common/TrackItem';
import { type Track, type Playlist } from '../../../types';

const GENRE_SUGGESTIONS = ['Drake', 'Lofi', 'Synthwave', 'Rock', 'Ambient', 'Jazz', 'Chill'];

const Search: React.FC = () => {
  const dispatch = useDispatch();
  const { query, results, loading, selectedService } = useSelector((state: RootState) => state.search);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
  const favorites = useSelector((state: RootState) => state.library.favorites);
  const sessionId = useSelector((state: RootState) => state.queue.sessionId);

  const [searchInput, setSearchInput] = useState(query);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [targetTrackForPlaylist, setTargetTrackForPlaylist] = useState<Track | null>(null);
  const [playlists, setPlaylistsList] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    getPlaylists().then(setPlaylistsList).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (q: string, srv = selectedService) => {
    if (!q.trim()) {
      dispatch(setResults([]));
      return;
    }
    dispatch(setLoading(true));
    try {
      const tracks = await searchTracks(q, srv);
      dispatch(setResults(tracks));
    } catch (err) {
      dispatch(setResults([]));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, selectedService]);

  const onInputChange = (val: string) => {
    setSearchInput(val);
    dispatch(setQuery(val));
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      handleSearch(val);
    }, 400);
  };

  const handleManualSearch = () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    handleSearch(searchInput);
  };

  const handleServiceChange = (service: 'jamendo' | 'youtube') => {
    dispatch(setSelectedService(service));
    if (searchInput.trim()) {
      handleSearch(searchInput, service);
    }
  };

  const playRequestIdRef = useRef<number>(0);

  const handlePlayTrack = async (track: Track) => {
    const requestId = ++playRequestIdRef.current;
    setStreamError(null);
    setResolvingTrackId(track.trackId);
    try {
      const resolved = await resolveTrackStream(track);
      if (playRequestIdRef.current === requestId) {
        dispatch(setCurrentTrack(resolved));
      }
    } catch (err: any) {
      if (playRequestIdRef.current === requestId) {
        console.error('Failed to stream track:', err);
        setStreamError(`Failed to load stream for "${track.title}".`);
      }
    } finally {
      if (playRequestIdRef.current === requestId) {
        setResolvingTrackId(null);
      }
    }
  };

  const handleAddToQueue = async (track: Track) => {
    dispatch(addToQueue(track));
    if (sessionId) {
      addTrackToQueue(sessionId, track).catch(() => {});
    }
  };

  const handleToggleFavorite = async (track: Track) => {
    const isFav = favorites.some((f) => f.trackId === track.trackId);
    if (isFav) {
      dispatch(removeFavoriteState(track.trackId));
      await removeFavorite(track.trackId, track.service).catch(() => {});
    } else {
      dispatch(addFavoriteState({
        _id: 'fav_' + Date.now(),
        userId: 'me',
        trackId: track.trackId,
        service: track.service,
        title: track.title,
        artist: track.artist,
        albumArt: track.albumArt,
        addedAt: new Date().toISOString(),
      }));
      await addFavorite(track).catch(() => {});
    }
  };

  const handleSelectPlaylistForTrack = async (playlistId: string) => {
    if (!targetTrackForPlaylist) return;
    try {
      await addTrackToPlaylist(playlistId, targetTrackForPlaylist);
      setTargetTrackForPlaylist(null);
    } catch (err) {
      console.error('Failed to add track to playlist:', err);
    }
  };

  const handleCreateNewPlaylistWithTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !targetTrackForPlaylist) return;
    try {
      const created = await createPlaylist(newPlaylistName.trim());
      dispatch(addPlaylist(created));
      await addTrackToPlaylist(created._id, targetTrackForPlaylist);
      setPlaylistsList([created, ...playlists]);
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
      setTargetTrackForPlaylist(null);
    } catch (err) {
      console.error('Failed to create playlist:', err);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-3.5">
      {/* Service Selector */}
      <ServiceToggle selectedService={selectedService} onSelect={handleServiceChange} />

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <SearchIcon size={16} className="absolute left-3.5 text-melo-text-subdued pointer-events-none" />
        <input
          type="text"
          name="melo_search_input"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          data-bwignore="true"
          spellCheck={false}
          value={searchInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              handleManualSearch();
            }
          }}
          onKeyUp={(e) => e.stopPropagation()}
          onKeyPress={(e) => e.stopPropagation()}
          placeholder={`Search ${selectedService === 'youtube' ? 'YouTube' : 'Jamendo'} songs, artists...`}
          className="w-full bg-melo-dark-surface border border-melo-border rounded-xl pl-9 pr-16 py-2.5 text-xs text-melo-text-primary-dark placeholder-melo-text-subdued/50 focus:outline-none focus:border-melo-primary transition-colors"
        />
        <div className="absolute right-2 flex items-center space-x-1">
          {searchInput && (
            <button
              onClick={() => onInputChange('')}
              className="p-1 text-melo-text-subdued hover:text-melo-text-primary-dark transition-colors"
            >
              <X size={13} />
            </button>
          )}
          <button
            onClick={handleManualSearch}
            className="p-1 bg-melo-primary/20 hover:bg-melo-primary text-melo-primary hover:text-white rounded-lg transition-colors"
            title="Search"
          >
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Stream Error Alert */}
      {streamError && (
        <div className="p-2 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs flex items-center justify-between">
          <span className="truncate">{streamError}</span>
          <button onClick={() => setStreamError(null)} className="ml-2 text-red-300 hover:text-white">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Suggestion Chips */}
      {!searchInput && (
        <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] text-melo-text-subdued flex items-center shrink-0 mr-1">
            <Sparkles size={12} className="mr-1 text-melo-primary" /> Quick:
          </span>
          {GENRE_SUGGESTIONS.map((genre) => (
            <button
              key={genre}
              onClick={() => {
                setSearchInput(genre);
                handleSearch(genre);
              }}
              className="px-2.5 py-1 text-[11px] bg-melo-dark-hover/60 hover:bg-melo-primary/20 hover:text-melo-primary text-melo-text-secondary-dark rounded-full transition-colors shrink-0 border border-melo-border/50"
            >
              {genre}
            </button>
          ))}
        </div>
      )}

      {/* Results Container */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-2 text-melo-text-subdued">
            <Loader2 size={24} className="animate-spin text-melo-primary" />
            <p className="text-xs">Searching tracks...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((track) => (
            <TrackItem
              key={track.trackId + track.service}
              track={track}
              isPlaying={currentTrack?.trackId === track.trackId && isPlaying}
              isLoadingStream={resolvingTrackId === track.trackId}
              isFavorite={favorites.some((f) => f.trackId === track.trackId)}
              onPlay={handlePlayTrack}
              onAddToQueue={handleAddToQueue}
              onToggleFavorite={handleToggleFavorite}
              onAddToPlaylist={(t) => setTargetTrackForPlaylist(t)}
            />
          ))
        ) : searchInput ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-melo-text-subdued">
            <p className="text-xs">No tracks found for "{searchInput}"</p>
            <p className="text-[11px] mt-1 text-melo-text-subdued/80">
              Try another query or switch between Jamendo and YouTube above.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-melo-text-subdued">
            <p className="text-xs">Type a search query above to discover music</p>
          </div>
        )}
      </div>

      {/* Add to Playlist Modal */}
      {targetTrackForPlaylist && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-melo-dark-surface border border-melo-border rounded-2xl w-full max-w-xs p-4 shadow-elevated animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-melo-border mb-3">
              <h3 className="text-sm font-bold text-melo-text-primary-dark truncate">
                Add to Playlist
              </h3>
              <button
                onClick={() => {
                  setTargetTrackForPlaylist(null);
                  setIsCreatingPlaylist(false);
                }}
                className="text-melo-text-subdued hover:text-melo-text-primary-dark"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-melo-text-secondary-dark truncate mb-3">
              Track: <span className="font-semibold text-melo-text-primary-dark">{targetTrackForPlaylist.title}</span>
            </p>

            {!isCreatingPlaylist ? (
              <div className="space-y-2">
                <button
                  onClick={() => setIsCreatingPlaylist(true)}
                  className="w-full flex items-center justify-center space-x-2 py-2 bg-melo-primary text-white text-xs font-semibold rounded-xl hover:bg-melo-primary-hover transition-colors"
                >
                  <PlusCircle size={14} />
                  <span>Create New Playlist</span>
                </button>

                <div className="max-h-40 overflow-y-auto space-y-1 pt-2">
                  {playlists.length > 0 ? (
                    playlists.map((pl) => (
                      <button
                        key={pl._id}
                        onClick={() => handleSelectPlaylistForTrack(pl._id)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-melo-text-secondary-dark hover:text-melo-text-primary-dark hover:bg-melo-dark-hover transition-colors truncate"
                      >
                        📁 {pl.name} ({pl.tracks?.length || 0})
                      </button>
                    ))
                  ) : (
                    <p className="text-[11px] text-center text-melo-text-subdued py-2">
                      No playlists created yet.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateNewPlaylistWithTrack} className="space-y-3">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Playlist Name"
                  autoFocus
                  className="w-full bg-melo-dark border border-melo-border rounded-xl px-3 py-2 text-xs text-melo-text-primary-dark focus:outline-none focus:border-melo-primary"
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingPlaylist(false)}
                    className="flex-1 py-1.5 bg-melo-dark-hover text-xs text-melo-text-secondary-dark rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-melo-primary text-white text-xs font-semibold rounded-xl hover:bg-melo-primary-hover"
                  >
                    Save & Add
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Search);
