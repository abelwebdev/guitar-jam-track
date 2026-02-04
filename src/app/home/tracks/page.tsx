'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Play, Pause, ChevronRight } from 'lucide-react';
import Image from "next/image";
import { BackingTrack } from '@/types/types';
import { Genre } from '@/constants';
import { useGetAllTracksQuery } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';


const ITEMS_PER_PAGE = 12;

// Helper to get correct track URL
const getTrackUrl = (url: string | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `https://guitarbackingtrack.org/wp-content/uploads/${url}`;
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
  onPlay: (track: BackingTrack) => void
}> = ({ track, isPlaying, onPlay }) => (
  <div onClick={() => onPlay(track)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${isPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden relative group/play">
        <Image 
          src={track.coverUrl || '/background-placeholder.jpg'} 
          alt={track.track_title || track.title || 'Track'}
          width={48}
          height={48}
          className="w-full h-full object-cover" 
        />
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'}`}>
          {isPlaying ? <Pause size={16} fill="white" className="text-white" /> : <Play size={16} fill="white" className="text-white ml-0.5" />}
        </div>
      </div>
      <div className="text-left">
        <h4 className={`text-sm font-bold mb-0.5 ${isPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
          {track.track_title || track.title || 'Unknown Track'}
        </h4>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          {getArtistName(track.artist)}
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-6">
      <div className={`transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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

export default function TracksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'All'>('All');

  // Use global PlayerContext
  const { playerState, handlePlayTrack } = usePlayer();

  // API queries
  const { data: tracksData, isLoading: tracksLoading } = useGetAllTracksQuery();

  // Convert API data to expected format
  const tracks = useMemo(() => {
    if (!tracksData) return [];
    return tracksData.map(track => ({
      ...track,
      id: track.id.toString(),
      title: track.track_title || track.title || 'Unknown Track',
      // Keep the artist as an object, don't convert to string
      audioUrl: track.track_url || '',
      coverUrl: '/background-placeholder.jpg'
    }));
  }, [tracksData]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riffmaster_favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      const artist = getArtistName(t.artist);
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           artist.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tracks, searchQuery, selectedGenre]);

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
      coverUrl: '/background-placeholder.jpg'
    };
    handlePlayTrack(enhancedTrack);
  };

  return (
    <>
      <div className="animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-6 md:space-y-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">Library</h2>
            <p className="text-zinc-500 text-sm font-medium">Browse the full catalog of tracks.</p>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search tracks, keys, genres..." 
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
          ) : tracks.length > 0 ? (
            paginatedTracks.map((track, index) => (
              <TrackPreviewRow 
                key={track.id || index} 
                track={track} 
                isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
                onPlay={handlePreviewPlay}
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

        {/* Track count info for single page or no pagination */}
        {!tracksLoading && totalPages <= 1 && tracks.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              {searchQuery.trim() ? `Found ${tracks.length} tracks` : `Showing ${tracks.length} tracks`}
            </p>
          </div>
        )}
      </div>
    </>
  );
}