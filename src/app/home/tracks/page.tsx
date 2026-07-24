'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Play, Pause, ChevronRight, Plus, Check, FolderPlus, X, Heart } from 'lucide-react';
import Image from "next/image";
import { BackingTrack } from '@/types/types';
import { useGetAllTracksQuery, useGetPlaylistQuery, useAddTrackToPlaylistMutation, useCreatePlaylistMutation, useGetFavoritesQuery, useAddToFavoritesMutation, useRemoveFromFavoritesMutation } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { toast } from 'react-toastify';

const ITEMS_PER_PAGE = 12;

type ApiPlaylist = {
  id: number;
  name: string;
  trackCount: number;
};

// Add to Playlist Modal Component
const AddToPlaylistModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  track: BackingTrack | null;
  onAddToPlaylist: (playlistId: number) => Promise<void>;
  onCreatePlaylist: (name: string) => Promise<void>;
  playlists: ApiPlaylist[];
  isLoading?: boolean;
}> = ({ isOpen, onClose, track, onAddToPlaylist, onCreatePlaylist, playlists, isLoading = false }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<number>>(new Set());
  const [addingToId, setAddingToId] = useState<number | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowCreateForm(false);
      setNewPlaylistName('');
      setAddedToPlaylists(new Set());
      setAddingToId(null);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleAddToPlaylist = async (playlistId: number) => {
    setAddingToId(playlistId);
    try {
      await onAddToPlaylist(playlistId);
      setAddedToPlaylists(prev => new Set([...prev, playlistId]));
    } catch (error) {
      // Error handled by parent toast
    } finally {
      setAddingToId(null);
    }
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateForm(false);
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Add to Playlist</h3>
            <p className="text-sm text-zinc-500 truncate">
              {track.track_title || track.title || 'Unknown Track'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                disabled={addedToPlaylists.has(playlist.id) || isLoading}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${addedToPlaylists.has(playlist.id)
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${addedToPlaylists.has(playlist.id)
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-indigo-100 dark:bg-indigo-900/30'
                    }`}>
                    {addedToPlaylists.has(playlist.id) ? (
                      <Check size={16} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <Plus size={16} className="text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-white">
                      {playlist.name}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {playlist.trackCount} tracks
                    </p>
                  </div>
                </div>
                {addedToPlaylists.has(playlist.id) ? (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Added
                  </span>
                ) : addingToId === playlist.id ? (
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                    Adding...
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-zinc-500">
              <p className="text-sm">No playlists yet.</p>
            </div>
          )}

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 transition-all"
              >
                <FolderPlus size={16} />
                <span className="font-medium">Create New Playlist</span>
              </button>
            ) : (
              <form onSubmit={handleCreatePlaylist} className="space-y-3">
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={!newPlaylistName.trim() || isLoading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? 'Creating...' : 'Create & Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-zinc-500 hover:text-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const getArtistName = (artist: BackingTrack['artist']): string => {
  if (artist && typeof artist === 'object') {
    return artist.artist_name || artist.name || 'Unknown Artist';
  }
  return typeof artist === 'string' ? artist : 'Unknown Artist';
};

const TrackPreviewRow: React.FC<{
  track: BackingTrack,
  isPlaying: boolean,
  onPlay: (track: BackingTrack) => void,
  onAddToPlaylist: (track: BackingTrack) => void,
  onToggleFavorite: (track: BackingTrack) => void,
  isFavorite: boolean
}> = ({ track, isPlaying, onPlay, onAddToPlaylist, onToggleFavorite, isFavorite }) => {
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = React.useState(false);

  React.useEffect(() => {
    if (titleRef.current && containerRef.current) {
      const isOverflowing = titleRef.current.scrollWidth > containerRef.current.clientWidth;
      setShouldAnimate(isOverflowing);
    }
  }, [track.track_title, track.title]);

  const trackTitle = track.track_title || track.title || 'Unknown Track';

  return (
    <div className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all group ${isPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
      <div
        onClick={() => onPlay(track)}
        className="flex items-center space-x-3 sm:space-x-4 flex-1 cursor-pointer min-w-0"
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden relative group/play shrink-0">
          <Image
            src={track.coverUrl || '/background-placeholder.webp'}
            alt={trackTitle}
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'}`}>
            {isPlaying ? <Pause size={14} fill="white" className="text-white sm:w-4 sm:h-4" /> : <Play size={14} fill="white" className="text-white ml-0.5 sm:w-4 sm:h-4" />}
          </div>
        </div>
        <div className="text-left min-w-0 flex-1">
          <div ref={containerRef} className="overflow-hidden relative">
            <h4
              ref={titleRef}
              className={`text-xs sm:text-sm font-bold mb-0.5 whitespace-nowrap inline-block ${isPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'} ${shouldAnimate && isPlaying ? 'animate-marquee' : shouldAnimate ? 'group-hover:animate-marquee' : ''}`}
            >
              {trackTitle}
              {shouldAnimate && <span className="inline-block px-8">{trackTitle}</span>}
            </h4>
          </div>
          <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
            {getArtistName(track.artist)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-6 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(track);
          }}
          className={`opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 rounded-lg transition-all ${isFavorite
            ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
            : 'text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            } ${isFavorite ? 'opacity-100' : ''}`}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={14} className="sm:w-4 sm:h-4" fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToPlaylist(track);
          }}
          className="opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
          title="Add to playlist"
        >
          <Plus size={14} className="sm:w-4 sm:h-4" />
        </button>
        <div className={`transition-opacity hidden sm:block ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isPlaying ? (
            <div className="flex items-center space-x-1">
              <div className="w-1 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '800ms' }}></div>
              <div className="w-1 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '600ms', animationDuration: '800ms' }}></div>
            </div>
          ) : (
            <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-indigo-600">
              Play
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TracksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<BackingTrack | null>(null);
  const [optimisticFavorites, setOptimisticFavorites] = useState<Record<string, boolean>>({});

  // Use global PlayerContext
  const { playerState, handlePlayTrack } = usePlayer();

  // API queries
  const { data: tracksData, isLoading: tracksLoading } = useGetAllTracksQuery();
  const { data: playlists = [], refetch: refetchPlaylists } = useGetPlaylistQuery();
  const { data: favoritesData = [] } = useGetFavoritesQuery();
  const [addTrackToPlaylist, { isLoading: isAddingToPlaylist }] = useAddTrackToPlaylistMutation();
  const [createPlaylist, { isLoading: isCreatingPlaylist }] = useCreatePlaylistMutation();
  const [addToFavorites] = useAddToFavoritesMutation();
  const [removeFromFavorites] = useRemoveFromFavoritesMutation();

  const tracks = useMemo(() => {
    if (!tracksData) return [];
    return tracksData.map(track => ({
      ...track,
      id: track.id.toString(),
      title: track.track_title || track.title || 'Unknown Track',
      audioUrl: track.track_url || '',
      coverUrl: '/background-placeholder.webp'
    }));
  }, [tracksData]);

  // Create a set of favorite track IDs for quick lookup
  const favoriteTrackIds = useMemo(() => {
    return new Set(favoritesData.map(fav => fav.id.toString()));
  }, [favoritesData]);

  // Sync optimistic favorites with server data
  useEffect(() => {
    if (Object.keys(optimisticFavorites).length === 0) return;

    setOptimisticFavorites(prev => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach(id => {
        if (next[id] === favoriteTrackIds.has(id)) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [favoriteTrackIds, optimisticFavorites]);

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      const artist = getArtistName(t.artist);
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tracks, searchQuery]);

  // Pagination calculations
  const totalTracks = filteredTracks.length;
  const totalPages = Math.max(1, Math.ceil(totalTracks / ITEMS_PER_PAGE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTracks = filteredTracks.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const handlePageClick = (page: number) => setCurrentPage(page);

  // Reset pagination when search query changes
  useEffect(() => setCurrentPage(1), [searchQuery]);

  // Handle track preview play using PlayerContext
  const handlePreviewPlay = (track: BackingTrack) => {
    // Ensure the track has the required properties for AudioPlayer
    const enhancedTrack = {
      ...track,
      title: track.track_title || track.title || 'Unknown Track',
      coverUrl: '/background-placeholder.webp'
    };
    handlePlayTrack(enhancedTrack);
  };

  // Handle add to playlist
  const handleAddToPlaylist = (track: BackingTrack) => {
    setSelectedTrack(track);
    setShowPlaylistModal(true);
  };

  // Handle adding track to existing playlist
  const handleAddTrackToExistingPlaylist = async (playlistId: number) => {
    if (!selectedTrack) return;

    try {
      await addTrackToPlaylist({
        playlistId,
        trackId: Number(selectedTrack.id)
      }).unwrap();
      toast.success('Track added to playlist')
      refetchPlaylists();
    } catch (error: any) {
      console.error('Failed to add track to playlist:', error);
      if (error?.status === 409 || error?.data?.error?.includes('already exists')) {
        toast.error('Track already exists in this playlist');
      } else {
        toast.error('Failed to add track to playlist');
      }
    }
  };

  // Handle creating new playlist and adding track
  const handleCreatePlaylistWithTrack = async (name: string) => {
    if (!selectedTrack) return;

    try {
      const newPlaylist = await createPlaylist({ name }).unwrap();
      await addTrackToPlaylist({
        playlistId: newPlaylist.id,
        trackId: Number(selectedTrack.id)
      }).unwrap();
      await refetchPlaylists();
      toast.success(`Playlist "${name}" created and track added`);
    } catch (error: any) {
      console.error('Failed to create playlist or add track:', error);
      if (error?.status === 409 || error?.data?.error?.includes('already exists')) {
        toast.error('Track already exists in this playlist');
      } else {
        toast.error('Failed to create playlist');
      }
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (track: BackingTrack) => {
    const trackIdStr = track.id.toString();
    const trackIdNum = Number(track.id);
    const currentlyFavorite = optimisticFavorites[trackIdStr] ?? favoriteTrackIds.has(trackIdStr);
    const newFavoriteStatus = !currentlyFavorite;

    // Set optimistic state immediately
    setOptimisticFavorites(prev => ({
      ...prev,
      [trackIdStr]: newFavoriteStatus
    }));

    try {
      if (currentlyFavorite) {
        await removeFromFavorites({ trackId: trackIdNum }).unwrap();
        toast.success('Removed from favorites');
      } else {
        await addToFavorites({ trackId: trackIdNum }).unwrap();
        toast.success('Added to favorites');
      }
      // The useEffect will clear the optimistic state once favoritesData updates
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // Revert optimistic state on error
      setOptimisticFavorites(prev => {
        const next = { ...prev };
        delete next[trackIdStr];
        return next;
      });
    }
  };

  return (
    <>
      <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-6 md:space-y-0">
          <div>
            {/* <h2 className="">Track Catalog</h2> */}
            <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">Track Catalog</h2>
            <p className="text-zinc-500 text-sm font-medium">Browse the full catalog of tracks.</p>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-indigo-500 transition-all text-zinc-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-3">
          {tracksLoading ? (
            // Loading skeleton
            [...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="hidden sm:flex items-center space-x-2">
                    <div className="h-5 w-8 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              </div>
            ))
          ) : totalTracks > 0 ? (
            paginatedTracks.map((track, index) => (
              <TrackPreviewRow
                key={track.id || index}
                track={track}
                isPlaying={playerState.currentTrack?.id?.toString() === track.id?.toString() && playerState.isPlaying}
                onPlay={handlePreviewPlay}
                onAddToPlaylist={handleAddToPlaylist}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={optimisticFavorites[track.id.toString()] ?? favoriteTrackIds.has(track.id.toString())}
              />
            ))
          ) : (
            <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
              {searchQuery.trim() ? 'No tracks found matching your search.' : 'No tracks found matching your criteria.'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!tracksLoading && totalPages > 1 && (
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Page Info */}
            <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              Showing {startIndex + 1}-{Math.min(endIndex, totalTracks)} of {totalTracks} tracks
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={validCurrentPage === 1}
                className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <ChevronRight size={14} className="rotate-180 sm:mr-2" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Page numbers - responsive count */}
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 3) {
                    pageNum = i + 1;
                  } else if (validCurrentPage <= 2) {
                    pageNum = i + 1;
                  } else if (validCurrentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = validCurrentPage - 1 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageClick(pageNum)}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-110 ${validCurrentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {/* Show additional pages on larger screens */}
                <div className="hidden sm:flex items-center space-x-2">
                  {totalPages > 3 && Array.from({ length: Math.min(2, totalPages - 3) }, (_, i) => {
                    let pageNum;
                    if (validCurrentPage <= 2) {
                      pageNum = 4 + i;
                    } else if (validCurrentPage >= totalPages - 1) {
                      // Already handled in main array
                      return null;
                    } else {
                      pageNum = validCurrentPage + 2 + i;
                    }

                    if (pageNum > totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageClick(pageNum)}
                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-200 hover:scale-110 ${validCurrentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextPage}
                disabled={validCurrentPage === totalPages}
                className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={14} className="sm:ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* Track count info for single page or no pagination */}
        {!tracksLoading && totalPages <= 1 && totalTracks > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              {searchQuery.trim() ? `Found ${totalTracks} tracks` : `Showing ${totalTracks} tracks`}
            </p>
          </div>
        )}
      </div>

      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedTrack(null);
        }}
        track={selectedTrack}
        onAddToPlaylist={handleAddTrackToExistingPlaylist}
        onCreatePlaylist={handleCreatePlaylistWithTrack}
        playlists={playlists}
        isLoading={isAddingToPlaylist || isCreatingPlaylist}
      />
    </>
  );
}