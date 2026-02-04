'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Volume2, 
  Music2, Clock,
  Users
} from 'lucide-react';
import Image from 'next/image';
import { BackingTrack } from '@/types/types';
import { MOCK_TRACKS, Genre } from '@/constants';
import { useGetAllTracksQuery, useGetHighlightedArtistsQuery } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';

const TrackCard: React.FC<{ 
  track: BackingTrack; 
  onPlay: (track: BackingTrack) => void; 
  isPlaying: boolean; 
  isActive: boolean;
}> = ({ track, onPlay, isPlaying, isActive }) => (
  <div onClick={() => onPlay(track)} className={`group relative p-2.5 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer shadow-sm ${isActive ? 'ring-2 ring-indigo-500/50' : ''}`}>
    <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
      <Image 
        src={track.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400'} 
        alt={track.title} 
        width={400}
        height={400}
        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
      />
      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
          {isActive && isPlaying ? <Pause size={20} fill="white" className="text-white" /> : <Play size={20} fill="white" className="text-white ml-0.5" />}
        </div>
      </div>
      <div className="absolute top-2 right-2 flex space-x-1">
        <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[8px] font-black text-white uppercase">
          {track.key || 'C'}
        </span>
      </div>
    </div>
    <div>
      <h3 className={`font-bold truncate text-xs md:text-sm mb-0.5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
        {track.title}
      </h3>
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium truncate pr-2">
          {typeof track.artist === 'string' ? track.artist : track.artist?.artist_name || 'Unknown Artist'}
        </span>
        <span className="text-[9px] text-zinc-400 font-bold uppercase">
          {track.bpm || 120} BPM
        </span>
      </div>
    </div>
  </div>
);

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'All'>('All');

  // API queries
  const { data: tracksData } = useGetAllTracksQuery();
  const { data: artistsData } = useGetHighlightedArtistsQuery();

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

  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riffmaster_history');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Use PlayerContext instead of local state
  const { playerState, handlePlayTrack } = usePlayer();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const historyTracks = useMemo(() => {
    return history.map(id => tracks.find(t => t.id.toString() === id)).filter(Boolean) as BackingTrack[];
  }, [tracks, history]);

  const featuredArtists = useMemo(() => {
    if (!artistsData) {
      return [
        { name: "Julian Vane", role: "Blues-Rock Maestro", image: "https://images.unsplash.com/photo-1549412150-13766716ee2d?q=80&w=400" },
        { name: "Sarah Strings", role: "Metal Shred Instructor", image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400" },
        { name: "Marcus Groove", role: "Funk Specialist", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=400" },
      ];
    }
    return artistsData.slice(0, 6).map(artist => ({
      name: artist.name || 'Unknown Artist',
      role: 'Professional Musician',
      image: 'https://images.unsplash.com/photo-1549412150-13766716ee2d?q=80&w=400'
    }));
  }, [artistsData]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('riffmaster_history', JSON.stringify(history));
    }
  }, [history]);

  // Enhanced handlePlayTrack to also update history
  const handlePlayTrackWithHistory = (track: BackingTrack) => {
    handlePlayTrack(track);
    setHistory(prev => {
      const newHistory = prev.filter(id => id !== track.id.toString());
      return [track.id.toString(), ...newHistory].slice(0, 12);
    });
  };

  // Home Dashboard Content
  return (
    <>
      <div className="animate-in fade-in duration-500 space-y-12">
        <section>
          <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto pb-4 scrollbar-hide px-1">
            {['All', ...Object.values(Genre)].map(genre => (
              <button key={genre} onClick={() => setSelectedGenre(genre as Genre | 'All')} className={`px-4 md:px-6 py-2 rounded-2xl text-[10px] md:text-xs font-bold border transition-all duration-300 whitespace-nowrap ${selectedGenre === genre ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white shadow-sm'}`}>
                {genre}
              </button>
            ))}
          </div>
        </section>

        {historyTracks.length > 0 && (
          <section className="animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center space-x-3">
                <Clock className="text-indigo-500" size={24} />
                <span>Recently Played</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {historyTracks.slice(0, 6).map(track => (
                <TrackCard 
                  key={`history-${track.id}`} 
                  track={track} 
                  onPlay={handlePlayTrackWithHistory} 
                  isPlaying={playerState.isPlaying && playerState.currentTrack?.id === track.id} 
                  isActive={playerState.currentTrack?.id === track.id}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center space-x-3">
              <Users className="text-indigo-500" size={24} />
              <span>Featured Artists</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {featuredArtists.map((artist, idx) => (
              <div key={idx} className="group relative p-2.5 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer shadow-sm">
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
                  <Image 
                    src={artist.image} 
                    alt={artist.name} 
                    width={400}
                    height={400}
                    className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                      <Users className="text-white" size={20} />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white truncate text-xs md:text-sm mb-0.5">{artist.name}</h3>
                  <span className="text-[10px] md:text-[11px] text-zinc-500 font-medium truncate pr-2">{artist.role}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter flex items-center space-x-3">
              <Music2 className="text-indigo-500" size={24} />
              <span>Popular Tracks</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {tracks.slice(0, 6).map(track => (
              <TrackCard 
                key={track.id} 
                track={track} 
                onPlay={handlePlayTrackWithHistory} 
                isPlaying={playerState.isPlaying && playerState.currentTrack?.id === track.id} 
                isActive={playerState.currentTrack?.id === track.id}
              />
            ))}
          </div>
        </section>
      </div>

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