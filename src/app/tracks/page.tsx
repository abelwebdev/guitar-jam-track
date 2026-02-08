'use client'

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Play, ChevronRight, X, Search, Pause, Volume2, Download, VolumeX, Loader2 } from 'lucide-react';
import { BackingTrack } from '../../types/types';
import { useGetAllTracksQuery, useSearchTracksQuery, useLazyDownloadTrackQuery } from "@/services/api";
import { toast } from "sonner";

// Helper to get correct track URL
const getTrackUrl = (url: string | null | undefined): string => {
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

const TrackPreviewRow: React.FC<{ 
  track: BackingTrack, 
  isPlaying: boolean, 
  isDownloading: boolean,
  onPlay: (track: BackingTrack) => void,
  onDownload: (track: BackingTrack) => void
}> = ({ track, isPlaying, isDownloading, onPlay, onDownload }) => (
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
          {getArtistName(track.artist)}
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-6">
      <div className={`flex items-center space-x-4 transition-opacity ${isPlaying || isDownloading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
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
  const [trackSearch, setTrackSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination settings
  const tracksPerPage = 12;
  
  // RTK Query hooks
  const { data: allTracks, isLoading: isAllTracksLoading, error: isAllTracksError } = useGetAllTracksQuery();
  const { data: searchResults, isLoading: isSearchLoading, error: isSearchError } = useSearchTracksQuery(
    searchQuery,
    { skip: !searchQuery.trim() }
  );
  const [triggerDownload, { isFetching: isDownloading }] = useLazyDownloadTrackQuery();
  const [downloadingTrackUrl, setDownloadingTrackUrl] = useState<string | null>(null);
  
  // Determine which data to use
  const allTracksData = searchQuery.trim() ? searchResults : allTracks;
  const isTrackLoading = searchQuery.trim() ? isSearchLoading : isAllTracksLoading;
  const isTrackError = searchQuery.trim() ? isSearchError : isAllTracksError;

  // Pagination calculations
  const totalTracks = allTracksData?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalTracks / tracksPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * tracksPerPage;
  const endIndex = startIndex + tracksPerPage;
  const tracks = allTracksData?.slice(startIndex, endIndex) || [];

  // Pagination handlers
  const handlePrevPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const handlePageClick = (page: number) => setCurrentPage(page);

  // Landing Player State
  const [previewTrack, setPreviewTrack] = useState<BackingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Reset pagination when search query changes
  useEffect(() => setCurrentPage(1), [searchQuery]);

  // Update search query with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(trackSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [trackSearch]);

  // Handle track preview play
  const handlePreviewPlay = (track: BackingTrack) => {
    if (previewTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setPreviewTrack(track);
      setIsPlaying(true);
      setCurrentTime(0); // Reset time for new track
    }
  };

  // Audio event handlers
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const onCanPlay = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error('Audio play failed:', error);
        setIsPlaying(false);
      });
    }
  };

  // Audio playback effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      
      if (isPlaying && previewTrack) {
        // Load new track if changed
        const trackUrl = getTrackUrl(previewTrack.track_url || previewTrack.audioUrl);
        if (trackUrl && audioRef.current.src !== trackUrl) {
          audioRef.current.src = trackUrl;
          audioRef.current.load();
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Audio play failed:', error);
            setIsPlaying(false);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, previewTrack, volume]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async (track: BackingTrack) => {
    const trackUrl = getTrackUrl(track.track_url || track.audioUrl);
    if (!trackUrl) return;

    setDownloadingTrackUrl(trackUrl);
    try {
      const { data: blob } = await triggerDownload(trackUrl);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = trackUrl.split('/').pop() || 'track.mp3';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error("Failed to download track");
      }
    } catch (error) {
      console.error('Download failed:', error);
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloadingTrackUrl(null);
    }
  };

  return (
    <>
      {/* Audio element for playback */}
      <audio 
        ref={audioRef} 
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
        }}
        preload="metadata"
      />

      <section className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 space-y-6 md:space-y-0">
          <div className="text-left">
            <h2 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">Backing Track Library</h2>
            <p className="text-zinc-500 text-lg max-w-lg">Browse our collection of backing tracks.</p>
          </div>
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by title or artist" 
              value={trackSearch}
              onChange={(e) => setTrackSearch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-indigo-500 transition-all text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 shadow-sm" 
            />
          </div>
        </div>

        <div className="space-y-3">
          {isTrackLoading ? (
            [...Array(tracksPerPage)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              </div>
            ))
          ) : isTrackError ? (
            <div className="py-20 text-center text-red-500 font-bold border border-dashed border-red-200 dark:border-red-800 rounded-[2rem]">
              Failed to load tracks. Please try again.
            </div>
          ) : tracks && tracks.length > 0 ? (
            tracks.map((track, index) => {
              // Debug log to understand data structure
              if (index === 0) {
              }
              return (
                <TrackPreviewRow 
                  key={track.id || index} 
                  track={track} 
                  isPlaying={previewTrack?.id === track.id && isPlaying}
                  isDownloading={isDownloading && downloadingTrackUrl === getTrackUrl(track.track_url)}
                  onPlay={handlePreviewPlay}
                  onDownload={handleDownload}
                />
              );
            })
          ) : (
            <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
              {searchQuery.trim() ? 'No tracks found matching your search.' : 'No tracks found in the vault.'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {!isTrackLoading && !isTrackError && totalPages > 1 && (
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
        {!isTrackLoading && !isTrackError && totalPages <= 1 && tracks && tracks.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
              {searchQuery.trim() ? `Found ${tracks.length} tracks` : `Showing ${tracks.length} tracks`}
            </p>
          </div>
        )}
      </section>

      {/* Fixed Audio Player */}
      {previewTrack && (
        <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-3xl px-4 sm:px-6 animate-in slide-in-from-bottom-8 duration-500">
           <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-4 shadow-2xl flex items-center gap-2 sm:gap-4 md:gap-6 group overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                <Image 
                  src={'/background-placeholder.jpg'} 
                  alt={previewTrack.track_title || previewTrack.title || 'Track'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0 flex-1">
                 <div className="flex items-center justify-between mb-1">
                   <div className="min-w-0 pr-2 sm:pr-4">
                     <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 leading-tight truncate">{previewTrack.track_title || previewTrack.title || 'Unknown Track'}</p>
                     <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate">{getArtistName(previewTrack.artist)}</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden sm:block text-[8px] font-black text-zinc-400 dark:text-zinc-500 w-8 text-right tabular-nums">{formatTime(currentTime)}</span>
                    <div className="flex-1 h-1 sm:h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full relative group/progress cursor-pointer">
                       <input 
                         type="range" 
                         min="0" 
                         max={duration || 100} 
                         value={currentTime} 
                         onChange={handleSeek} 
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                       />
                       <div 
                         className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all duration-300"
                         style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                       />
                       <div 
                         className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white border-2 border-indigo-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-sm"
                         style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 4px)` }}
                       />
                    </div>
                    <span className="hidden sm:block text-[8px] font-black text-zinc-400 dark:text-zinc-500 w-8 tabular-nums">{formatTime(duration)}</span>
                 </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 pr-1">
                 <div className="hidden sm:flex items-center space-x-2 group/vol w-16 sm:w-24">
                   <button onClick={() => setVolume(v => (v === 0 ? 0.8 : 0))}>
                     {volume === 0 ? <VolumeX size={16} className="text-zinc-400" /> : <Volume2 size={16} className="text-zinc-400" />}
                   </button>
                   <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={handleVolumeChange} 
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full accent-indigo-600 appearance-none cursor-pointer" 
                  />
                 </div>
                  <button
                    onClick={() => handleDownload(previewTrack)}
                    disabled={isDownloading}
                    className={`hidden sm:block p-2 text-zinc-400 hover:text-indigo-600 transition-colors ${isDownloading ? 'cursor-not-allowed' : ''}`}
                    title={isDownloading ? "Downloading..." : "Download Track"}
                  >
                    {isDownloading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                  </button>
                  

                 <button 
                   onClick={() => setIsPlaying(!isPlaying)}
                   className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                 >
                   {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                 </button>
                 
                 <button 
                   onClick={() => {
                     setPreviewTrack(null);
                     setIsPlaying(false);
                   }}
                   className="p-1 sm:p-2 text-zinc-400 hover:text-red-500 transition-colors"
                 >
                   <X size={16} />
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Add bottom padding when player is visible */}
      {previewTrack && <div className="h-24 sm:h-20" />}
    </>
  );
}
