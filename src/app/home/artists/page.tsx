"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import {
  Play, ChevronRight, ArrowLeft, Pause, Search, Plus, Check, FolderPlus, X, Heart
} from 'lucide-react';
import { BackingTrack } from '../../../types/types';
import { useGetAllArtistsQuery, useGetArtistTracksQuery, useSearchArtistsQuery, useGetPlaylistQuery, useAddTrackToPlaylistMutation, useCreatePlaylistMutation, useGetFavoritesQuery, useAddToFavoritesMutation, useRemoveFromFavoritesMutation } from "@/services/api";
import { usePlayer } from "@/contexts/PlayerContext";

type Artist = {
  id: number;
  name: string | null;
  backing_tracks_count: number;
  highlighted?: boolean | null;
};

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
  onAddToPlaylist: (playlistId: number) => void;
  onCreatePlaylist: (name: string) => void;
  playlists: ApiPlaylist[];
  isLoading?: boolean;
}> = ({ isOpen, onClose, track, onAddToPlaylist, onCreatePlaylist, playlists, isLoading = false }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedToPlaylists, setAddedToPlaylists] = useState<Set<number>>(new Set());

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowCreateForm(false);
      setNewPlaylistName('');
      setAddedToPlaylists(new Set());
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

  const handleAddToPlaylist = (playlistId: number) => {
    onAddToPlaylist(playlistId);
    setAddedToPlaylists(prev => new Set([...prev, playlistId]));
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
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  addedToPlaylists.has(playlist.id)
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    addedToPlaylists.has(playlist.id)
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
                {addedToPlaylists.has(playlist.id) && (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    Added
                  </span>
                )}
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
  return 'Unknown Artist';
};

// Artist Card Component
const ArtistCard: React.FC<{ 
  artist: Artist, 
  image: string | null,
  onClick: () => void 
}> = ({ artist, image, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all duration-500 text-left shadow-md cursor-pointer"
  >
    <div className="aspect-[4/5] overflow-hidden relative">
      {image ? (
        <Image
          src={image}
          alt={artist.name ?? "Artist"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          priority={false}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-white font-black text-4xl">
            {artist.name?.charAt(0)?.toUpperCase() || '?'}
          </span>
        </div>
      )}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
      <h4 className="text-xl font-black text-white leading-tight">{artist.name || 'Unknown Artist'}</h4>
      <p className="text-white/80 text-sm mb-4">{artist.backing_tracks_count} tracks</p>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-indigo-600 transition-colors">
          <ChevronRight size={14} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

// Track Preview Row Component
const TrackPreviewRow: React.FC<{ 
  track: BackingTrack, 
  isPlaying: boolean, 
  artistName?: string,
  onPlay: (track: BackingTrack) => void,
  onAddToPlaylist: (track: BackingTrack) => void,
  onToggleFavorite: (track: BackingTrack) => void,
  isFavorite: boolean
}> = ({ track, isPlaying, artistName, onPlay, onAddToPlaylist, onToggleFavorite, isFavorite }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
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
            src={'/background-placeholder.jpg'} 
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
            {artistName || getArtistName(track.artist)}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-1 sm:space-x-3 md:space-x-6 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(track);
          }}
          className={`opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 rounded-lg transition-all ${
            isFavorite 
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


export default function Artists() {
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [artistTracksPage, setArtistTracksPage] = useState(1);
  const [artistImages, setArtistImages] = useState<Record<number, string | null>>({});
  const [artistBios, setArtistBios] = useState<Record<number, string | null>>({});
  const [artistSearch, setArtistSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<BackingTrack | null>(null);
  
  // Use PlayerContext
  const { playerState, handlePlayTrack } = usePlayer();
  // Pagination settings
  const artistsPerPage = 9;
  const tracksPerPage = 12;
  
  // RTK Query hooks
  const { data: allArtists, isLoading: isAllArtistsLoading, error: isAllArtistsError } = useGetAllArtistsQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: isSearchError } = useSearchArtistsQuery(
    searchQuery,
    { skip: !searchQuery.trim() }
  );
  const { data: artistTracks, isLoading: isArtistTracksLoading } = useGetArtistTracksQuery(
    selectedArtistId?.toString() || '',
    { skip: !selectedArtistId }
  );
  const { data: playlists = [], refetch: refetchPlaylists } = useGetPlaylistQuery();
  const { data: favoritesData = [] } = useGetFavoritesQuery();
  const [addTrackToPlaylist, { isLoading: isAddingToPlaylist }] = useAddTrackToPlaylistMutation();
  const [createPlaylist, { isLoading: isCreatingPlaylist }] = useCreatePlaylistMutation();
  const [addToFavorites] = useAddToFavoritesMutation();
  const [removeFromFavorites] = useRemoveFromFavoritesMutation();
  
  // Determine which data to use
  const allArtistsData = searchQuery.trim() ? searchResults : allArtists;
  const isArtistLoading = searchQuery.trim() ? isSearchLoading : isAllArtistsLoading;
  const isArtistError = searchQuery.trim() ? isSearchError : isAllArtistsError;
  
  // Pagination calculations
  const totalArtists = allArtistsData?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalArtists / artistsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * artistsPerPage;
  const endIndex = startIndex + artistsPerPage;
  const paginatedArtists = allArtistsData?.slice(startIndex, endIndex) || [];
  
  // Find selected artist
  const selectedArtist = allArtistsData?.find(artist => artist.id === selectedArtistId);

  // Pagination for artist tracks
  const totalArtistTracks = artistTracks?.length || 0;
  const totalArtistTracksPages = Math.max(1, Math.ceil(totalArtistTracks / tracksPerPage));
  const validArtistTracksPage = Math.min(artistTracksPage, totalArtistTracksPages);
  const artistTracksStartIndex = (validArtistTracksPage - 1) * tracksPerPage;
  const artistTracksEndIndex = artistTracksStartIndex + tracksPerPage;
  const paginatedArtistTracks = artistTracks?.slice(artistTracksStartIndex, artistTracksEndIndex) || [];

  // Create a set of favorite track IDs for quick lookup
  const favoriteTrackIds = useMemo(() => {
    return new Set(favoritesData.map(fav => fav.id.toString()));
  }, [favoritesData]);

  // Pagination handlers
  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const handlePageClick = (page: number) => setCurrentPage(page);

  // Artist tracks pagination handlers
  const handleArtistTracksPrevPage = () => setArtistTracksPage(prev => Math.max(1, prev - 1));
  const handleArtistTracksNextPage = () => setArtistTracksPage(prev => Math.min(totalArtistTracksPages, prev + 1));
  const handleArtistTracksPageClick = (page: number) => setArtistTracksPage(page);

  // Track fetched artist IDs to avoid duplicate requests
  const fetchedIdsRef = useRef<Set<number>>(new Set());

  // Reset pagination when search query changes
  useEffect(() => setCurrentPage(1), [searchQuery]);

  // Reset artist tracks pagination when artist changes
  useEffect(() => setArtistTracksPage(1), [selectedArtistId]);

  // Update search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(artistSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [artistSearch]);

  // Fetch artist images and bios
  useEffect(() => {
    const fetchImageFor = async (artistId: number, name: string | null) => {
      if (!name || fetchedIdsRef.current.has(artistId)) return;
      try {
        const formattedName = name.trim();
        const res = await fetch(
          `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(formattedName)}`
        );
        const data = await res.json();
        const img = data?.artists && Array.isArray(data.artists)
          ? data.artists[0]?.strArtistThumb ?? "/background-placeholder.jpg"
          : "/background-placeholder.jpg";
        const bio = data?.artists && Array.isArray(data.artists)
          ? data.artists[0]?.strBiographyEN ?? null
          : null;
        
        setArtistImages((prev) => ({ ...prev, [artistId]: img }));
        setArtistBios((prev) => ({ ...prev, [artistId]: bio }));
        fetchedIdsRef.current.add(artistId);
      } catch {
        setArtistImages((prev) => ({ ...prev, [artistId]: null }));
        setArtistBios((prev) => ({ ...prev, [artistId]: null }));
        fetchedIdsRef.current.add(artistId);
      }
    };
    
    // Fetch images for current page artists
    paginatedArtists.forEach((artist) => fetchImageFor(artist.id, artist.name ?? null));
  }, [paginatedArtists]);

  // Handle track preview play using PlayerContext
  const handlePreviewPlay = (track: BackingTrack) => {
    // Ensure the track has the required properties for AudioPlayer
    const enhancedTrack = {
      ...track,
      title: track.track_title || track.title || 'Unknown Track',
      coverUrl: '/background-placeholder.jpg' // Default cover image
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
      // You could add a success toast here
    } catch (error) {
      console.error('Failed to add track to playlist:', error);
      // You could add an error toast here
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
      refetchPlaylists();
      // You could add a success toast here
    } catch (error) {
      console.error('Failed to create playlist or add track:', error);
      // You could add an error toast here
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (track: BackingTrack) => {
    const trackId = Number(track.id);
    const isFavorite = favoriteTrackIds.has(track.id.toString());
    
    try {
      if (isFavorite) {
        await removeFromFavorites({ trackId }).unwrap();
      } else {
        await addToFavorites({ trackId }).unwrap();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      // You could add an error toast here
    }
  };

  return (
    <>
      <section className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {!selectedArtistId ? (
          <>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-6 md:space-y-0">
              <div className="text-left">
                <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">The Collective</h2>
                <p className="text-zinc-500 text-lg max-w-lg">Meet the master instructors behind every single session.</p>
              </div>
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Search artists by name" 
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-indigo-500 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 shadow-sm" 
                />
              </div>
            </div>
            
            {isArtistLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="animate-pulse bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
                    <div className="text-center space-y-2">
                      <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto" />
                      <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-700 rounded mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isArtistError ? (
              <div className="py-20 text-center text-red-500 font-bold border border-dashed border-red-200 dark:border-red-800 rounded-[2rem]">
                Failed to load artists. Please try again.
              </div>
            ) : allArtistsData && allArtistsData.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {paginatedArtists.map((artist) => {
                    const artistImage = artistImages[artist.id] || null;
                    return (
                      <ArtistCard 
                        key={artist.id} 
                        artist={artist}
                        image={artistImage}
                        onClick={() => { 
                          setSelectedArtistId(artist.id); 
                          window.scrollTo({ top: 0, behavior: 'smooth' }); 
                        }} 
                      />
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6">
                    {/* Page Info */}
                    <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                      Showing {startIndex + 1}-{Math.min(endIndex, totalArtists)} of {totalArtists} artists
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-4">
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
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-110 ${
                                validCurrentPage === pageNum
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
                                className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-200 hover:scale-110 ${
                                  validCurrentPage === pageNum
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
              </>
            ) : (
              <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                {searchQuery.trim() ? 'No artists found matching your search.' : 'No artists found.'}
              </div>
            )}
          </>
        ) : (
          <div className="animate-in slide-in-from-right-4 duration-500 space-y-16">
            <button 
              onClick={() => {
                setSelectedArtistId(null);
              }}
              className="flex items-center space-x-2 text-zinc-500 hover:text-indigo-600 font-black uppercase text-xs tracking-widest transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to collective</span>
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-12">
              <div className="w-48 h-48 md:w-72 md:h-72 rounded-[3rem] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl shrink-0">
                {selectedArtist && artistImages[selectedArtist.id] ? (
                  <Image
                    src={artistImages[selectedArtist.id]!}
                    alt={selectedArtist.name ?? "Artist"}
                    width={288}
                    height={288}
                    className="w-full h-full object-cover"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-white font-black text-6xl md:text-8xl">
                      {selectedArtist?.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-4xl md:text-7xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter leading-none">
                      {selectedArtist?.name || 'Unknown Artist'}
                    </h2>
                  </div>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl leading-relaxed">
                  {selectedArtist && artistBios[selectedArtist.id] 
                    ? artistBios[selectedArtist.id]?.slice(0, 300) + (artistBios[selectedArtist.id]!.length > 300 ? '...' : '')
                    : 'Professional musician and instructor with years of experience creating high-quality backing tracks for guitarists of all levels.'
                  }
                </p>
              </div>
            </div>

            <div className="pt-16 border-t border-zinc-200 dark:border-zinc-900">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                    Backing Tracks
                  </h3>
                  <p className="text-zinc-500 text-sm font-medium mt-1">
                    {totalArtistTracks} tracks by {selectedArtist?.name}
                  </p>
                </div>
              </div>
              
              {isArtistTracksLoading ? (
                <div className="space-y-3">
                  {[...Array(tracksPerPage)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : artistTracks && artistTracks.length > 0 ? (
                <>
                  <div className="space-y-3">
                    {paginatedArtistTracks.map(track => (
                      <TrackPreviewRow 
                        key={track.id} 
                        track={track} 
                        artistName={selectedArtist?.name || undefined}
                        isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
                        onPlay={handlePreviewPlay}
                        onAddToPlaylist={handleAddToPlaylist}
                        onToggleFavorite={handleToggleFavorite}
                        isFavorite={favoriteTrackIds.has(track.id.toString())}
                      />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalArtistTracksPages > 1 && (
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
                      {/* Page Info */}
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Showing {artistTracksStartIndex + 1}-{Math.min(artistTracksEndIndex, totalArtistTracks)} of {totalArtistTracks} tracks
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center justify-center gap-2 sm:gap-4">
                        <button
                          type="button"
                          onClick={handleArtistTracksPrevPage}
                          disabled={validArtistTracksPage === 1}
                          className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <ChevronRight size={14} className="rotate-180 sm:mr-2" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>
                        
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          {/* Page numbers - responsive count */}
                          {Array.from({ length: Math.min(3, totalArtistTracksPages) }, (_, i) => {
                            let pageNum;
                            if (totalArtistTracksPages <= 3) {
                              pageNum = i + 1;
                            } else if (validArtistTracksPage <= 2) {
                              pageNum = i + 1;
                            } else if (validArtistTracksPage >= totalArtistTracksPages - 1) {
                              pageNum = totalArtistTracksPages - 2 + i;
                            } else {
                              pageNum = validArtistTracksPage - 1 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handleArtistTracksPageClick(pageNum)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-110 ${
                                  validArtistTracksPage === pageNum
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
                            {totalArtistTracksPages > 3 && Array.from({ length: Math.min(2, totalArtistTracksPages - 3) }, (_, i) => {
                              let pageNum;
                              if (validArtistTracksPage <= 2) {
                                pageNum = 4 + i;
                              } else if (validArtistTracksPage >= totalArtistTracksPages - 1) {
                                // Already handled in main array
                                return null;
                              } else {
                                pageNum = validArtistTracksPage + 2 + i;
                              }
                              
                              if (pageNum > totalArtistTracksPages) return null;
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => handleArtistTracksPageClick(pageNum)}
                                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-200 hover:scale-110 ${
                                    validArtistTracksPage === pageNum
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
                          onClick={handleArtistTracksNextPage}
                          disabled={validArtistTracksPage === totalArtistTracksPages}
                          className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight size={14} className="sm:ml-2" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Track count info for single page or no pagination */}
                  {totalArtistTracksPages <= 1 && (
                    <div className="mt-8 text-center">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Showing all {totalArtistTracks} tracks
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                  No tracks found for this artist.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

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
  )
}