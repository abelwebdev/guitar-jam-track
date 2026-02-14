'use client'

import React, { useMemo } from 'react';
import { Heart, Play, Pause, Plus } from 'lucide-react';
import Image from 'next/image';
import { BackingTrack } from '@/types/types';
import { useGetFavoritesQuery, useRemoveFromFavoritesMutation } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';

const getArtistName = (artist: BackingTrack['artist']): string => {
  if (artist && typeof artist === 'object') {
    return artist.artist_name || artist.name || 'Unknown Artist';
  }
  return typeof artist === 'string' ? artist : 'Unknown Artist';
};

// Favorite Track Row Component (matching /home/tracks style)
const FavoriteTrackRow: React.FC<{
  track: BackingTrack,
  isPlaying: boolean,
  onPlay: (track: BackingTrack) => void,
  onRemoveFromFavorites: (track: BackingTrack) => void
}> = ({ track, isPlaying, onPlay, onRemoveFromFavorites }) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${isPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
    <div
      onClick={() => onPlay(track)}
      className="flex items-center space-x-4 flex-1 cursor-pointer"
    >
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveFromFavorites(track);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-100"
        title="Remove from favorites"
      >
        <Heart size={16} fill="currentColor" />
      </button>
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

export default function FavoritesPage() {
  // API queries
  const { data: favoritesData = [], isLoading: favoritesLoading, error: favoritesError } = useGetFavoritesQuery();
  const [removeFromFavorites] = useRemoveFromFavoritesMutation();
  const [optimisticRemovals, setOptimisticRemovals] = React.useState<Set<string>>(new Set());

  // Use PlayerContext
  const { playerState, handlePlayTrack } = usePlayer();

  // Convert favorites data to expected format
  const favoritesTracks = useMemo(() => {
    return favoritesData.map(track => ({
      ...track,
      id: track.id.toString(),
      title: track.track_title || track.title || 'Unknown Track',
      audioUrl: track.track_url || '',
      coverUrl: '/background-placeholder.jpg'
    })).filter(track => !optimisticRemovals.has(track.id.toString()));
  }, [favoritesData, optimisticRemovals]);

  // Sync optimistic removals with server data
  React.useEffect(() => {
    if (optimisticRemovals.size === 0) return;

    setOptimisticRemovals(prev => {
      const next = new Set(prev);
      let changed = false;

      const serverIds = new Set(favoritesData.map(f => f.id.toString()));
      next.forEach(id => {
        if (!serverIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [favoritesData, optimisticRemovals]);

  // Handle track play
  const handlePreviewPlay = (track: BackingTrack) => {
    const enhancedTrack = {
      ...track,
      title: track.track_title || track.title || 'Unknown Track',
      coverUrl: '/background-placeholder.jpg'
    };
    handlePlayTrack(enhancedTrack);
  };

  // Handle remove from favorites
  const handleRemoveFromFavorites = async (track: BackingTrack) => {
    const trackIdStr = track.id.toString();

    // Set optimistic removal
    setOptimisticRemovals(prev => {
      const next = new Set(prev);
      next.add(trackIdStr);
      return next;
    });

    try {
      await removeFromFavorites({ trackId: Number(track.id) }).unwrap();
      // useEffect will handle clearing once server data updates
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      // Revert optimistic removal on error
      setOptimisticRemovals(prev => {
        const next = new Set(prev);
        next.delete(trackIdStr);
        return next;
      });
    }
  };

  return (
    <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-6 md:space-y-0">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">Favorites</h2>
          <p className="text-zinc-500 text-sm font-medium">Your most loved backing tracks.</p>
        </div>
      </div>

      <div className="space-y-3">
        {favoritesLoading ? (
          // Loading skeleton (matching /home/tracks style)
          [...Array(12)].map((_, i) => (
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
        ) : favoritesError ? (
          <div className="py-20 text-center text-red-500 font-bold border border-dashed border-red-200 dark:border-red-800 rounded-[2rem]">
            Failed to load favorites. Please try again.
          </div>
        ) : favoritesTracks.length > 0 ? (
          favoritesTracks.map((track, index) => (
            <FavoriteTrackRow
              key={track.id || index}
              track={track}
              isPlaying={playerState.currentTrack?.id?.toString() === track.id?.toString() && playerState.isPlaying}
              onPlay={handlePreviewPlay}
              onRemoveFromFavorites={handleRemoveFromFavorites}
            />
          ))
        ) : (
          <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
            <Heart size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-bold mb-6">No favorites yet. Tap the heart on tracks you love.</p>
            <a href="/home/tracks" className="text-indigo-500 font-black uppercase text-xs tracking-widest hover:underline">
              Browse tracks
            </a>
          </div>
        )}
      </div>
    </div>
  );
}