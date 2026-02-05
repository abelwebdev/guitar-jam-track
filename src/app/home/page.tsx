'use client'

import React, { useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { useGetAllTracksQuery, useGetHighlightedArtistsQuery } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Home() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playerState, setPlayerState } = usePlayer();
  // Home Dashboard Content
  return (
    <>
      {/* Player */}
      {playerState.currentTrack && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-t border-zinc-200 dark:border-zinc-900 p-4 z-50">
          <audio 
            ref={audioRef} 
            src={playerState.currentTrack?.audioUrl} 
            onEnded={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))} 
          />
          
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md shrink-0">
                <Image 
                  src={playerState.currentTrack?.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400'} 
                  alt="Album" 
                  width={48}
                  height={48}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-zinc-900 dark:text-white truncate leading-tight mb-0.5">
                  {playerState.currentTrack?.title}
                </h4>
                <p className="text-[11px] text-zinc-500 font-bold truncate uppercase tracking-wider">
                  {typeof playerState.currentTrack?.artist === 'string' ? playerState.currentTrack.artist : playerState.currentTrack?.artist?.artist_name || 'Unknown Artist'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button
                onClick={() => setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))}
                className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-indigo-600/30"
              >
                {playerState.isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
              </button>
            </div>

            <div className="flex items-center space-x-4 flex-1 justify-end">
              <Volume2 size={16} className="text-zinc-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playerState.volume}
                onChange={(e) => setPlayerState(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-24 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </footer>
      )}
    </>
  );
}