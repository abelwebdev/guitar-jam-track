"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Play, ChevronRight, ArrowLeft, Pause, Volume2, 
  Music, Download, VolumeX, X, Star, Search
} from 'lucide-react';
import { BackingTrack } from '../../../types/types';
import { useGetAllArtistsQuery, useGetArtistTracksQuery, useSearchArtistsQuery } from "@/services/api";
import AudioPlayer from "@/components/AudioPlayer";
import { usePlayer } from "@/contexts/PlayerContext";

type Artist = {
  id: number;
  name: string | null;
  backing_tracks_count: number;
  highlighted?: boolean | null;
};

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
  onPlay: (track: BackingTrack) => void
}> = ({ track, isPlaying, artistName, onPlay }) => (
  <div onClick={() => onPlay(track)} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${isPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 rounded-xl overflow-hidden relative group/play">
        <Image 
          src={'/background-placeholder.jpg'} 
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
          {artistName || getArtistName(track.artist)}
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


export default function Artists() {
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [artistImages, setArtistImages] = useState<Record<number, string | null>>({});
  const [artistBios, setArtistBios] = useState<Record<number, string | null>>({});
  const [artistSearch, setArtistSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState("");
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  
  // Use PlayerContext
  const { playerState, setPlayerState, handlePlayTrack } = usePlayer();
  
  // Pagination settings
  const artistsPerPage = 9;
  
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

  // Pagination handlers
  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const handlePageClick = (page: number) => setCurrentPage(page);

  // Track fetched artist IDs to avoid duplicate requests
  const fetchedIdsRef = useRef<Set<number>>(new Set());

  // Reset pagination when search query changes
  useEffect(() => setCurrentPage(1), [searchQuery]);

  // Update search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(artistSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [artistSearch]);

  // Clear audio player when going back to artist list
  useEffect(() => {
    if (!selectedArtistId && playerState.currentTrack) {
      setPlayerState(prev => ({ ...prev, currentTrack: null, isPlaying: false }));
    }
  }, [selectedArtistId, playerState.currentTrack, setPlayerState]);

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

  // Audio player state
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

  return (
    <>
      <section className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                // Clear audio player when going back to artist list
                setPlayerState(prev => ({ ...prev, currentTrack: null, isPlaying: false }));
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
                <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                  Backing Tracks By - {selectedArtist?.name}
                </h3>
              </div>
              
              {isArtistTracksLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : artistTracks && artistTracks.length > 0 ? (
                <div className="space-y-4">
                  {artistTracks.map(track => (
                    <TrackPreviewRow 
                      key={track.id} 
                      track={track} 
                      artistName={selectedArtist?.name || undefined}
                      isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
                      onPlay={handlePreviewPlay}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                  No tracks found for this artist.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Fixed Audio Player */}
      {playerState.currentTrack && (
        <AudioPlayer 
          playerState={playerState}
          setPlayerState={setPlayerState}
          loopA={loopA}
          setLoopA={setLoopA}
          loopB={loopB}
          setLoopB={setLoopB}
        />
        // <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-3xl px-4 sm:px-6 animate-in slide-in-from-bottom-8 duration-500">
        //     <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-4 shadow-2xl flex items-center gap-2 sm:gap-4 md:gap-6 group overflow-hidden">
        //       <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
        //         <Image 
        //           src={'/background-placeholder.jpg'} 
        //           alt={previewTrack.track_title || previewTrack.title || 'Track'}
        //           width={64}
        //           height={64}
        //           className="w-full h-full object-cover" 
        //         />
        //       </div>
        //       <div className="min-w-0 flex-1">
        //           <div className="flex items-center justify-between mb-1">
        //             <div className="min-w-0 pr-2 sm:pr-4">
        //               <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 leading-tight truncate">{previewTrack.track_title || previewTrack.title || 'Unknown Track'}</p>
        //               <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate">
        //                 {selectedArtist?.name || getArtistName(previewTrack.artist)}
        //               </p>
        //             </div>
        //           </div>
        //           <div className="flex items-center gap-2 sm:gap-3">
        //             <span className="hidden sm:block text-[8px] font-black text-zinc-400 dark:text-zinc-500 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
        //             <div className="flex-1 h-1 sm:h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full relative group/progress cursor-pointer">
        //                 <input 
        //                   type="range" 
        //                   min="0" 
        //                   max={duration || 100} 
        //                   value={currentTime} 
        //                   onChange={handleSeek} 
        //                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
        //                 />
        //                 <div 
        //                   className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all duration-300"
        //                   style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
        //                 />
        //                 <div 
        //                   className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white border-2 border-indigo-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-sm"
        //                   style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 4px)` }}
        //                 />
        //             </div>
        //             <span className="hidden sm:block text-[8px] font-black text-zinc-400 dark:text-zinc-500 w-8 tabular-nums">{formatTime(duration)}</span>
        //           </div>
        //       </div>

        //       <div className="flex items-center gap-1 sm:gap-2 md:gap-4 pr-1">
        //           <div className="hidden sm:flex items-center space-x-2 group/vol w-16 sm:w-24">
        //             <button onClick={() => setVolume(v => (v === 0 ? 0.8 : 0))}>
        //               {volume === 0 ? <VolumeX size={16} className="text-zinc-400" /> : <Volume2 size={16} className="text-zinc-400" />}
        //             </button>
        //             <input 
        //             type="range" 
        //             min="0" 
        //             max="1" 
        //             step="0.01" 
        //             value={volume} 
        //             onChange={handleVolumeChange} 
        //             className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full accent-indigo-600 appearance-none cursor-pointer" 
        //           />
        //           </div>
        //           <a
        //             href={`/api/download?url=${encodeURIComponent(
        //               getTrackUrl(previewTrack.track_url || previewTrack.audioUrl)
        //             )}`}
        //             className="hidden sm:block p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
        //           >
        //             <Download size={16} />
        //           </a>

        //           <button 
        //             onClick={() => setIsPlaying(!isPlaying)}
        //             className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
        //           >
        //             {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
        //           </button>
                  
        //           <button 
        //             onClick={() => {
        //               setPreviewTrack(null);
        //               setIsPlaying(false);
        //             }}
        //             className="p-1 sm:p-2 text-zinc-400 hover:text-red-500 transition-colors"
        //           >
        //             <X size={16} />
        //           </button>
        //       </div>
        //     </div>
        // </div>
      )}

      {/* Add bottom padding when player is visible */}
      {playerState.currentTrack && <div className="h-24 sm:h-20" />}
    </>
  )
}