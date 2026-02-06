'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Play, Pause, Volume2, SkipBack, SkipForward, Repeat, Anchor, Gauge, X, ChevronUp, ChevronDown } from 'lucide-react';
import { BackingTrack, PlayerState } from '@/types/types';

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

interface AudioPlayerProps {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  loopA: number | null;
  setLoopA: (time: number) => void;
  loopB: number | null;
  setLoopB: (time: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  playerState,
  setPlayerState,
  loopA,
  setLoopA,
  loopB,
  setLoopB
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const speeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  // Audio event handlers
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setPlayerState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 0;
      
      setPlayerState(prev => ({ 
        ...prev, 
        currentTime,
        duration
      }));

      // Handle A-B loop
      if (loopA !== null && loopB !== null && currentTime >= loopB) {
        audioRef.current.currentTime = loopA;
      }
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setPlayerState(prev => ({ 
        ...prev, 
        duration: audioRef.current?.duration || 0 
      }));
    }
  };

  const onCanPlay = () => {
    if (audioRef.current && playerState.isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error('Audio play failed:', error);
        setPlayerState(prev => ({ ...prev, isPlaying: false }));
      });
    }
  };

  // Audio playback effect
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerState.volume;
      audioRef.current.playbackRate = playerState.playbackRate;
      
      if (playerState.isPlaying && playerState.currentTrack) {
        // Load new track if changed
        const trackUrl = getTrackUrl(playerState.currentTrack.track_url || playerState.currentTrack.audioUrl);
        if (trackUrl && audioRef.current.src !== trackUrl) {
          audioRef.current.src = trackUrl;
          audioRef.current.load();
        }
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error('Audio play failed:', error);
            setPlayerState(prev => ({ ...prev, isPlaying: false }));
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [playerState.isPlaying, playerState.currentTrack, playerState.volume, playerState.playbackRate, setPlayerState]);

  const handleClose = useCallback(() => {
    setPlayerState(prev => ({ 
      ...prev, 
      currentTrack: null, 
      isPlaying: false,
      currentTime: 0,
      duration: 0
    }));
    setIsMobileExpanded(false);
  }, [setPlayerState]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when player is visible and no input is focused
      if (!playerState.currentTrack || document.activeElement?.tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case ' ':
          e.preventDefault();
          setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [playerState.currentTrack, playerState.isPlaying, setPlayerState, handleClose]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!playerState.currentTrack) {
    return null;
  }

  return (
    <>
      {/* Fixed Audio Player */}
      <footer 
        className={`fixed bottom-0 left-0 right-0 z-[200] bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-t border-zinc-200 dark:border-zinc-900 flex flex-col shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] transition-all ease-in-out duration-300 shrink-0 ${
          playerState.currentTrack 
            ? (isMobileExpanded ? 'h-[280px] sm:h-28 md:h-36' : 'h-24 sm:h-28 md:h-36') + ' opacity-100 translate-y-0' 
            : 'h-0 opacity-0 translate-y-full overflow-hidden'
        }`}
      >
        <audio 
          ref={audioRef} 
          src={playerState.currentTrack ? getTrackUrl(playerState.currentTrack.track_url || playerState.currentTrack.audioUrl) : ''} 
          onTimeUpdate={onTimeUpdate} 
          onLoadedMetadata={onLoadedMetadata}
          onCanPlay={onCanPlay}
          loop={playerState.isLooping} 
          onEnded={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))} 
        />
        
        {/* Seeker Bar */}
        <div className="w-full relative h-6 sm:h-8 md:h-10 flex items-center justify-center px-4 sm:px-6 md:px-10 group bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="w-full max-w-5xl flex items-center space-x-3 sm:space-x-4">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 tabular-nums min-w-[30px] sm:min-w-[35px] text-right">{formatTime(playerState.currentTime)}</span>
            <div className="flex-1 relative h-5 flex items-center cursor-pointer select-none group/seeker">
              <input 
                type="range" 
                min="0" 
                max={playerState.duration || 100} 
                value={playerState.currentTime} 
                onChange={handleSeek} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 m-0" 
              />
              {/* Track Background */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full pointer-events-none" />
              {/* Progress Bar */}
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full transition-all duration-100 z-10 pointer-events-none" 
                style={{ width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }} 
              />
              {loopA !== null && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-emerald-500 z-20 shadow-[0_0_10px_rgba(52,211,153,0.8)] rounded-full pointer-events-none" 
                  style={{ left: `${(loopA / (playerState.duration || 1)) * 100}%` }}
                >
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-emerald-500/20">A</span>
                </div>
              )}
              {loopB !== null && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-3 bg-amber-500 z-20 shadow-[0_0_10px_rgba(251,191,36,0.8)] rounded-full pointer-events-none" 
                  style={{ left: `${(loopB / (playerState.duration || 1)) * 100}%` }}
                >
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-amber-500/20">B</span>
                </div>
              )}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-lg z-25 opacity-100 sm:opacity-0 sm:group-hover/seeker:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${(playerState.currentTime / (playerState.duration || 1)) * 100}% - 5px)` }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 tabular-nums min-w-[30px] sm:min-w-[35px]">{formatTime(playerState.duration)}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`${isMobileExpanded ? 'flex-col items-stretch' : 'flex-row items-center justify-between'} flex-1 flex sm:flex-row sm:items-center px-4 sm:px-6 md:px-10 py-2 sm:py-3 relative overflow-y-auto sm:overflow-visible no-scrollbar`}>
          
          {/* Mobile Collapse Toggle (Absolute Top Right for Easy Access) */}
          <button 
            className={`${isMobileExpanded ? 'block' : 'hidden'} sm:hidden absolute top-2 right-2 p-2 text-zinc-400 z-10`}
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          >
             {isMobileExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>

          {/* Desktop Close Button */}
          <button
            onClick={handleClose}
            className="hidden sm:block absolute top-2 right-4 p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 z-10 hover:scale-110 active:scale-95"
            title="Close player (Esc)"
          >
            <X size={20} />
          </button>

          {/* Left: Track Info */}
          <div className={`flex-none sm:flex-1 md:w-[30%] flex items-center space-x-3 sm:space-x-4 min-w-0 ${isMobileExpanded ? 'mb-4' : 'mb-0'} sm:mb-0`}>
            <div 
              className={`relative transition-all duration-300 ${isMobileExpanded ? 'w-20 h-20' : 'w-10 h-10'} sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md md:shadow-lg shrink-0`}
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
              <Image 
                src={playerState.currentTrack?.coverUrl || '/background-placeholder.jpg'} 
                alt="Album cover" 
                fill
                className="object-cover"
                unoptimized={playerState.currentTrack?.coverUrl?.startsWith('http')}
              />
            </div>
            <div className="min-w-0 flex-1 text-left pr-8 sm:pr-0">
              <h4 className={`font-black text-zinc-900 dark:text-white truncate leading-tight mb-0.5 transition-all ${isMobileExpanded ? 'text-lg' : 'text-xs sm:text-xs md:text-sm'}`}>
                {playerState.currentTrack?.title}
              </h4>
              <p className={`text-zinc-500 font-bold truncate uppercase tracking-wider transition-all ${isMobileExpanded ? 'text-xs' : 'text-[9px] sm:text-[9px] md:text-[11px]'}`}>
                {getArtistName(playerState.currentTrack?.artist)}
              </p>
            </div>
          </div>

          {/* Center: Controls */}
          <div className={`flex-1 flex ${isMobileExpanded ? 'flex-col space-y-4' : 'flex-row justify-end space-y-0'} items-center sm:justify-center sm:space-y-1 w-full sm:w-auto`}>
            {/* Primary Controls */}
            <div className="flex items-center justify-between sm:justify-center w-full sm:w-auto space-x-0 sm:space-x-4 md:space-x-6 lg:space-x-8">
              
              {/* Loop Controls Container (Mobile: Only in expanded, Desktop: Always) */}
              <div className={`${isMobileExpanded ? 'flex' : 'hidden'} sm:flex items-center bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 sm:px-3 py-1 space-x-2 sm:space-x-3`}>
                <button 
                  title="Set Loop Start (A)"
                  onClick={() => setLoopA(playerState.currentTime)}
                  className={`p-1.5 sm:p-1 transition-colors ${loopA !== null ? 'text-emerald-500' : 'text-zinc-400 hover:text-indigo-600'}`}
                >
                  <Anchor size={isMobileExpanded ? 16 : 14} />
                </button>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <button 
                  title="Set Loop End (B)"
                  onClick={() => {
                    if (loopA !== null && playerState.currentTime > loopA) {
                      setLoopB(playerState.currentTime);
                    }
                  }}
                  className={`p-1.5 sm:p-1 transition-colors ${loopB !== null ? 'text-amber-500' : 'text-zinc-400 hover:text-indigo-600'}`}
                >
                  <Anchor size={isMobileExpanded ? 16 : 14} />
                </button>
              </div>

               {/* Transport Controls */}
              <div className="flex items-center justify-center space-x-4 sm:space-x-4 md:space-x-6 flex-1 sm:flex-none">
                <button className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block p-2 sm:p-1.5 text-zinc-400 dark:text-zinc-600 hover:text-indigo-600 transition-colors`}>
                  <SkipBack fill="currentColor" size={20} className="sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))} 
                  className="w-12 h-12 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-600/30"
                >
                  {playerState.isPlaying ? <Pause size={20} className="sm:w-5 sm:h-5" fill="white" /> : <Play size={20} className="sm:w-5 sm:h-5 ml-0.5 sm:ml-1" fill="white" />}
                </button>
                <button className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block p-2 sm:p-1.5 text-zinc-400 dark:text-zinc-600 hover:text-indigo-600 transition-colors`}>
                  <SkipForward fill="currentColor" size={20} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <button 
                className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block p-2 sm:p-1.5 transition-colors ${playerState.isLooping ? 'text-indigo-500' : 'text-zinc-400 dark:text-zinc-600 hover:text-indigo-600'}`} 
                onClick={() => setPlayerState(prev => ({ ...prev, isLooping: !prev.isLooping }))}
              >
                <Repeat size={isMobileExpanded ? 20 : 16} className="sm:w-[18px] sm:h-[18px]" />
              </button>

              {/* Mobile Expand Button (Collapsed Mode Only) */}
              <button 
                className={`${!isMobileExpanded ? 'block' : 'hidden'} sm:hidden p-2 text-zinc-400 hover:text-indigo-600 transition-colors ml-2`}
                onClick={() => setIsMobileExpanded(true)}
              >
                <ChevronUp size={24} />
              </button>
            </div>

            {/* Mobile Expanded Secondary Controls (Speed & Volume) */}
            <div className={`${isMobileExpanded ? 'flex' : 'hidden'} sm:hidden w-full items-center justify-between space-x-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-4`}>
                {/* Speed Control */}
                <div className="relative">
                  <button 
                    onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                    className={`flex items-center space-x-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSpeedMenuOpen ? 'border-indigo-500 ring-1 ring-indigo-500/10' : ''}`}
                  >
                    <Gauge size={14} className="text-indigo-500" />
                    <span>{playerState.playbackRate.toFixed(2)}x</span>
                  </button>
                  {isSpeedMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[190]" onClick={() => setIsSpeedMenuOpen(false)} />
                      <div className="absolute bottom-full left-0 mb-2 w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden py-1 z-[210]">
                        {speeds.map(s => (
                          <button 
                            key={s}
                            onClick={() => {
                              setPlayerState(prev => ({ ...prev, playbackRate: s }));
                              setIsSpeedMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-[10px] font-bold ${playerState.playbackRate === s ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400'}`}
                          >
                            {s.toFixed(2)}x
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Volume Control */}
                <div className="flex items-center space-x-2 flex-1">
                  <Volume2 size={16} className="text-zinc-400 dark:text-zinc-600" />
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={playerState.volume} 
                    onChange={(e) => setPlayerState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))} 
                    className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-600" 
                  />
                </div>
            </div>
          </div>

          {/* Right: Desktop Controls (Speed, Volume, Close) */}
          <div className="hidden sm:flex md:w-[30%] items-center justify-end space-x-4 lg:space-x-6 xl:space-x-8">
            {/* Speed Control Menu */}
            <div className="relative">
              <button 
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                className={`flex items-center space-x-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:border-indigo-500 ${isSpeedMenuOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : ''}`}
              >
                <Gauge size={14} className="text-indigo-500" />
                <span>{playerState.playbackRate.toFixed(2)}x</span>
              </button>
              {isSpeedMenuOpen && (
                <>
                  <div className="fixed inset-0 z-[190]" onClick={() => setIsSpeedMenuOpen(false)} />
                  <div className="absolute bottom-full right-0 mb-3 w-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1 z-[210] animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <p className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 mb-1">Speed</p>
                    {speeds.map(s => (
                      <button 
                        key={s}
                        onClick={() => {
                          setPlayerState(prev => ({ ...prev, playbackRate: s }));
                          setIsSpeedMenuOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-[10px] font-bold transition-all hover:bg-zinc-50 dark:hover:bg-indigo-900/10 ${playerState.playbackRate === s ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400'}`}
                      >
                        {s.toFixed(2)}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 w-28 sm:w-36 lg:w-48 xl:w-56 transition-all">
              <Volume2 size={16} className="sm:w-5 sm:h-5 text-zinc-400 dark:text-zinc-600" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={playerState.volume} 
                onChange={(e) => setPlayerState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))} 
                className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-600 hover:h-2 transition-all" 
              />
            </div>


          </div>
        </div>
      </footer>

      {/* Spacer to prevent content from being hidden behind player */}
      <div className={`transition-all duration-300 ${playerState.currentTrack ? (isMobileExpanded ? 'h-[280px] sm:h-28 md:h-36' : 'h-24 sm:h-28 md:h-36') : 'h-0'}`} />
    </>
  );
};

export default AudioPlayer;