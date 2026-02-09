'use client'

import React, { useMemo } from 'react';
import { Play, Pause, Music2, Users, Heart, ListMusic, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { usePlayer } from '@/contexts/PlayerContext';
import { useGetHighlightedArtistsQuery, useGetAllTracksQuery, useGetFavoritesQuery, useGetPlaylistQuery } from '@/services/api';
import { useRouter } from 'next/navigation';
import { BackingTrack } from '@/types/types';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; trend?: string; onClick?: () => void }> = ({ icon, label, value, trend, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''} transition-all duration-300`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      {trend && (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-xs font-bold">
          <TrendingUp size={14} />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
  </div>
);

const ArtistCard: React.FC<{ artist: { id: number; name: string | null; backing_tracks_count: number }; onClick: () => void }> = ({ artist, onClick }) => (
  <div 
    onClick={onClick}
    className="group bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
  >
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <span className="text-2xl font-black text-white">{artist.name?.charAt(0) || '?'}</span>
    </div>
    <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 truncate">{artist.name || 'Unknown Artist'}</h4>
    <p className="text-sm text-zinc-500 dark:text-zinc-400">{artist.backing_tracks_count} tracks</p>
  </div>
);

const TrackRow: React.FC<{ track: BackingTrack; isPlaying: boolean; onPlay: () => void }> = ({ track, isPlaying, onPlay }) => {
  const getArtistName = (artist: BackingTrack['artist']): string => {
    if (artist && typeof artist === 'object') {
      return artist.artist_name || artist.name || 'Unknown Artist';
    }
    return typeof artist === 'string' ? artist : 'Unknown Artist';
  };

  return (
    <div 
      onClick={onPlay}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
        isPlaying 
          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800' 
          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
      }`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
          <Image 
            src="/background-placeholder.jpg" 
            alt={track.track_title || track.title || 'Track'}
            width={40}
            height={40}
            className="w-full h-full object-cover" 
          />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isPlaying ? <Pause size={14} fill="white" className="text-white" /> : <Play size={14} fill="white" className="text-white ml-0.5" />}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h5 className={`text-sm font-bold truncate ${isPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
            {track.track_title || track.title || 'Unknown Track'}
          </h5>
          <p className="text-xs text-zinc-500 truncate">{getArtistName(track.artist)}</p>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const { playerState, handlePlayTrack } = usePlayer();
  
  // Fetch data
  const { data: highlightedArtists = [], isLoading: artistsLoading } = useGetHighlightedArtistsQuery();
  const { data: allTracks = [], isLoading: tracksLoading } = useGetAllTracksQuery();
  const { data: favorites = [] } = useGetFavoritesQuery();
  const { data: playlists = [] } = useGetPlaylistQuery();

  // Get recent tracks (first 5)
  const recentTracks = useMemo(() => {
    return allTracks.slice(0, 5).map(track => ({
      ...track,
      id: track.id.toString(),
      title: track.track_title || track.title || 'Unknown Track',
      audioUrl: track.track_url || '',
      coverUrl: '/background-placeholder.jpg'
    }));
  }, [allTracks]);

  const handleTrackPlay = (track: BackingTrack) => {
    handlePlayTrack(track);
  };

  return (
    <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">
          Welcome Back
        </h1>
        <p className="text-zinc-500 text-sm font-medium">
          Your guitar practice hub
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard 
          icon={<Music2 size={24} />} 
          label="Total Tracks" 
          value={allTracks.length}
          onClick={() => router.push('/home/tracks')}
        />
        <StatCard 
          icon={<Users size={24} />} 
          label="Artists" 
          value={highlightedArtists.length}
          onClick={() => router.push('/home/artists')}
        />
        <StatCard 
          icon={<Heart size={24} />} 
          label="Favorites" 
          value={favorites.length}
          onClick={() => router.push('/home/favorites')}
        />
        <StatCard 
          icon={<ListMusic size={24} />} 
          label="Playlists" 
          value={playlists.length}
          onClick={() => router.push('/home/playlists')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Featured Artists */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Featured Artists</h2>
            <button 
              onClick={() => router.push('/home/artists')}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              View All
            </button>
          </div>
          
          {artistsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 mb-4" />
                  <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
                  <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
                </div>
              ))}
            </div>
          ) : highlightedArtists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {highlightedArtists.slice(0, 4).map((artist) => (
                <ArtistCard 
                  key={artist.id} 
                  artist={artist}
                  onClick={() => router.push(`/home/artists?id=${artist.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No featured artists yet</p>
            </div>
          )}
        </div>

        {/* Recent Tracks */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Recent Tracks</h2>
            <button 
              onClick={() => router.push('/home/tracks')}
              className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              View All
            </button>
          </div>
          
          {tracksLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center space-x-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                    <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentTracks.length > 0 ? (
            <div className="space-y-3">
              {recentTracks.map((track) => (
                <TrackRow 
                  key={track.id} 
                  track={track}
                  isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
                  onPlay={() => handleTrackPlay(track)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Music2 size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No tracks available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}