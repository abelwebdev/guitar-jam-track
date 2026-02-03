'use client'

import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward, Repeat, Anchor, Gauge } from 'lucide-react';
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
  }, [playerState.isPlaying, playerState.currentTrack, playerState.volume, playerState.playbackRate]);

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
      <footer className={`fixed bottom-0 left-0 right-0 z-[200] bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-t border-zinc-200 dark:border-zinc-900 flex flex-col shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.05)] dark:shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.5)] transition-all shrink-0 ${playerState.currentTrack ? (isMobileExpanded ? 'h-40 sm:h-28 md:h-36' : 'h-24 sm:h-28 md:h-36') + ' opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
        <audio 
          ref={audioRef} 
          src={playerState.currentTrack ? getTrackUrl(playerState.currentTrack.track_url || playerState.currentTrack.audioUrl) : ''} 
          onTimeUpdate={onTimeUpdate} 
          onLoadedMetadata={onLoadedMetadata}
          onCanPlay={onCanPlay}
          loop={playerState.isLooping} 
          onEnded={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))} 
        />
        
        {/* Row 1: Seeker Bar (Centered and Reduced) */}
        <div className="w-full relative h-8 sm:h-10 flex items-center justify-center px-2 sm:px-4 md:px-10 group bg-zinc-50/50 dark:bg-zinc-900/10 border-b border-zinc-100 dark:border-zinc-800/50">
          <div className="w-full max-w-3xl flex items-center space-x-2 sm:space-x-4">
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 tabular-nums min-w-[30px] sm:min-w-[35px] text-right">{formatTime(playerState.currentTime)}</span>
            <div className="flex-1 relative h-1 sm:h-1.5 flex items-center cursor-pointer overflow-visible group/seeker">
              <input 
                type="range" 
                min="0" 
                max={playerState.duration || 100} 
                value={playerState.currentTime} 
                onChange={handleSeek} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30" 
              />
              <div className="absolute inset-0 w-full h-full bg-zinc-200 dark:bg-zinc-800 rounded-full" />
              <div 
                className="absolute left-0 top-0 h-full bg-indigo-600 rounded-full transition-all duration-100 z-10" 
                style={{ width: `${(playerState.currentTime / (playerState.duration || 1)) * 100}%` }} 
              />
              {loopA !== null && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-emerald-500 z-20 shadow-[0_0_10px_rgba(52,211,153,0.8)] rounded-full" 
                  style={{ left: `${(loopA / (playerState.duration || 1)) * 100}%` }}
                >
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-emerald-500/20">A</span>
                </div>
              )}
              {loopB !== null && (
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-4 bg-amber-500 z-20 shadow-[0_0_10px_rgba(251,191,36,0.8)] rounded-full" 
                  style={{ left: `${(loopB / (playerState.duration || 1)) * 100}%` }}
                >
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[8px] font-black text-amber-500 bg-white dark:bg-zinc-900 px-1 rounded shadow-sm border border-amber-500/20">B</span>
                </div>
              )}
              <div 
                className="absolute w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow-lg z-25 opacity-0 group-hover/seeker:opacity-100 transition-opacity"
                style={{ left: `calc(${(playerState.currentTime / (playerState.duration || 1)) * 100}% - 5px)` }}
              />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-400 tabular-nums min-w-[30px] sm:min-w-[35px]">{formatTime(playerState.duration)}</span>
          </div>
        </div>

        {/* Row 2: Controls Area */}
        <div className="flex-1 flex items-center px-2 sm:px-4 md:px-10 py-2 sm:py-3">
          <div className="flex-1 md:flex-none md:w-[30%] flex items-center space-x-2 sm:space-x-3 md:space-x-5 min-w-0">
            <div 
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md md:shadow-lg shrink-0 cursor-pointer sm:cursor-default"
              onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
              <img src={playerState.currentTrack?.coverUrl} alt="Album" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <h4 className="text-[10px] sm:text-[11px] md:text-sm font-black text-zinc-900 dark:text-white truncate leading-tight mb-0.5">{playerState.currentTrack?.title}</h4>
              <p className="text-[8px] sm:text-[9px] md:text-[11px] text-zinc-500 font-bold truncate uppercase tracking-wider">{getArtistName(playerState.currentTrack?.artist)}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center space-x-3 sm:space-x-4 md:space-x-6 lg:space-x-8">
              {/* Loop controls - hidden on mobile unless expanded */}
              <div className={`${isMobileExpanded ? 'flex' : 'hidden'} sm:flex items-center bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1 space-x-3`}>
                <button 
                  title="Set Loop Start (A)"
                  onClick={() => setLoopA(playerState.currentTime)}
                  className={`p-1 transition-colors ${loopA !== null ? 'text-emerald-500' : 'text-zinc-400 hover:text-indigo-600'}`}
                >
                  <Anchor size={14} />
                </button>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <button 
                  title="Set Loop End (B)"
                  onClick={() => {
                    if (loopA !== null && playerState.currentTime > loopA) {
                      setLoopB(playerState.currentTime);
                    }
                  }}
                  className={`p-1 transition-colors ${loopB !== null ? 'text-amber-500' : 'text-zinc-400 hover:text-indigo-600'}`}
                >
                  <Anchor size={14} />
                </button>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-6">
                <button className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block p-1.5 text-zinc-400 dark:text-zinc-600 hover:text-indigo-600 transition-colors`}>
                  <SkipBack fill="currentColor" size={16} className="sm:w-5 sm:h-5" />
                </button>
                <button 
                  onClick={() => setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))} 
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-600/30"
                >
                  {playerState.isPlaying ? <Pause size={16} className="sm:w-5 sm:h-5" fill="white" /> : <Play size={16} className="sm:w-5 sm:h-5 ml-0.5 sm:ml-1" fill="white" />}
                </button>
                <button className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block p-1.5 text-zinc-400 dark:text-zinc-600 hover:text-indigo-600 transition-colors`}>
                  <SkipForward fill="currentColor" size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <button 
                className={`${isMobileExpanded ? 'block' : 'hidden'} sm:block p-1.5 transition-colors ${playerState.isLooping ? 'text-indigo-500' : 'text-zinc-400 dark:text-zinc-600 hover:text-indigo-600'}`} 
                onClick={() => setPlayerState(prev => ({ ...prev, isLooping: !prev.isLooping }))}
              >
                <Repeat size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>

          <div className="w-[30%] hidden md:flex items-center justify-end space-x-4 lg:space-x-6 xl:space-x-8">
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

            <div className="flex items-center space-x-2 sm:space-x-3 w-20 sm:w-24 lg:w-28 xl:w-36">
              <Volume2 size={14} className="sm:w-4 sm:h-4 text-zinc-400 dark:text-zinc-600" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={playerState.volume} 
                onChange={(e) => setPlayerState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))} 
                className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-600" 
              />
            </div>
          </div>
        </div>

        {/* Mobile Expanded Controls Row */}
        {isMobileExpanded && (
          <div className="sm:hidden border-t border-zinc-100 dark:border-zinc-800/50 px-4 py-3 bg-zinc-50/30 dark:bg-zinc-900/20">
            <div className="flex items-center justify-between space-x-4">
              {/* Speed Control */}
              <div className="relative">
                <button 
                  onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                  className={`flex items-center space-x-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:border-indigo-500 ${isSpeedMenuOpen ? 'border-indigo-500 ring-2 ring-indigo-500/10' : ''}`}
                >
                  <Gauge size={12} className="text-indigo-500" />
                  <span>{playerState.playbackRate.toFixed(2)}x</span>
                </button>
                {isSpeedMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[190]" onClick={() => setIsSpeedMenuOpen(false)} />
                    <div className="absolute bottom-full right-0 mb-3 w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-1 z-[210] animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <p className="px-3 py-2 text-[7px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 mb-1">Speed</p>
                      {speeds.map(s => (
                        <button 
                          key={s}
                          onClick={() => {
                            setPlayerState(prev => ({ ...prev, playbackRate: s }));
                            setIsSpeedMenuOpen(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-[9px] font-bold transition-all hover:bg-zinc-50 dark:hover:bg-indigo-900/10 ${playerState.playbackRate === s ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-zinc-500 dark:text-zinc-400'}`}
                        >
                          {s.toFixed(2)}x
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-3 flex-1 max-w-32">
                <Volume2 size={14} className="text-zinc-400 dark:text-zinc-600" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={playerState.volume} 
                  onChange={(e) => setPlayerState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))} 
                  className="flex-1 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-600" 
                />
              </div>

              {/* Collapse Button */}
              <button 
                onClick={() => setIsMobileExpanded(false)}
                className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                title="Collapse"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m18 15-6-6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Add bottom padding when player is visible */}
      {playerState.currentTrack && <div className={`${isMobileExpanded ? 'h-40' : 'h-24'} sm:h-28 md:h-36`} />}
    </>
  );
};

export default AudioPlayer;