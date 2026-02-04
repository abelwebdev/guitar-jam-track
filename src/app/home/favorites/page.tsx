'use client'

import React, { useState, useMemo } from 'react';
import { Heart, Clock } from 'lucide-react';
import { BackingTrack, PlayerState } from '@/types/types';
import { MOCK_TRACKS, Genre } from '@/constants';
import { useGetAllTracksQuery } from '@/services/api';

export default function FavoritesPage() {
  // API queries
  const { data: tracksData, isLoading: tracksLoading } = useGetAllTracksQuery();

  // Convert API data to expected format
  const tracks = useMemo(() => {
    if (!tracksData) return MOCK_TRACKS;
    return tracksData.map(track => ({
      ...track,
      id: track.id.toString(),
      title: track.track_title || track.title || 'Unknown Track',
      artist: track.artist?.artist_name || track.artist?.name || 'Unknown Artist',
      audioUrl: track.track_url || '',
      coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400',
      genre: Genre.ROCK,
      key: 'C',
      bpm: 120,
      duration: 180
    }));
  }, [tracksData]);

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riffmaster_favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    volume: 0.8,
    playbackRate: 1.0,
    currentTime: 0,
    duration: 0,
    isLooping: false,
  });

  const handlePlayTrack = (track: BackingTrack) => {
    if (playerState.currentTrack?.id === track.id) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      setPlayerState(prev => ({ ...prev, currentTrack: track, isPlaying: true }));
    }
  };

  const toggleFavorite = (track: BackingTrack) => {
    setFavorites(prev => 
      prev.includes(track.id.toString()) 
        ? prev.filter(id => id !== track.id.toString()) 
        : [...prev, track.id.toString()]
    );
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-6 md:space-y-0">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">Favorites</h2>
          <p className="text-zinc-500 text-sm font-medium">Your most played backing tracks.</p>
        </div>
      </div>
      {favorites.length > 0 ? (
        <div className="space-y-1">
          <div className="flex items-center px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <div className="w-10 flex-shrink-0 text-center">#</div>
            <div className="flex-1 min-w-0 pr-4">Title</div>
            <div className="hidden lg:flex w-32 flex-shrink-0">Genre</div>
            <div className="hidden md:flex w-24 flex-shrink-0 text-center justify-center">Key</div>
            <div className="hidden sm:flex w-20 flex-shrink-0 text-center justify-center">Tempo</div>
            <div className="w-20 flex-shrink-0 text-center"><Clock size={12} className="mx-auto" /></div>
            <div className="w-[120px] flex-shrink-0"></div>
          </div>
          {tracks.filter(t => favorites.includes(t.id.toString())).map((track, idx) => (
            <>
            </>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
          <Heart size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
          <p className="text-zinc-500 font-bold mb-6">No favorites yet. Tap the heart on tracks you love.</p>
          <button className="text-indigo-500 font-black uppercase text-xs tracking-widest hover:underline">Browse tracks</button>
        </div>
      )}
    </div>
  );
}