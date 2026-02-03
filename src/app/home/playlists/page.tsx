'use client'

import React, { useState, useMemo } from 'react';
import { 
  ListMusic, Disc, FolderPlus, Trash2, ChevronLeft, 
  Clock, Music
} from 'lucide-react';
import { BackingTrack, PlayerState, Playlist } from '@/types/types';
import { MOCK_TRACKS, Genre } from '@/constants';
import { useGetAllTracksQuery } from '@/services/api';
import TrackRow from '@/components/TrackRow';

const PlaylistCard: React.FC<{
  playlist: Playlist;
  onClick: () => void;
  onDelete: () => void;
}> = ({ playlist, onClick, onDelete }) => (
  <div className="group relative p-4 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer shadow-sm">
    <div onClick={onClick} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <ListMusic size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div>
        <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm mb-1">
          {playlist.name}
        </h3>
        <p className="text-xs text-zinc-500 truncate">
          {playlist.description || `${playlist.trackIds.length} tracks`}
        </p>
      </div>
    </div>
  </div>
);

export default function PlaylistsPage() {
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

  // Playlist state
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);

  // Playlist computed values
  const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const playlistTracks = currentPlaylist ? tracks.filter(t => currentPlaylist.trackIds.includes(t.id.toString())) : [];

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

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {!selectedPlaylistId ? (
        <>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">My Playlists</h2>
              <p className="text-zinc-500 text-sm font-medium">Organize your practice routines.</p>
            </div>
            <button
              onClick={() => setShowPlaylistModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 transition-all"
            >
              <FolderPlus size={18} />
              <span className="hidden sm:inline">Create Playlist</span>
            </button>
          </div>
          {playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  onDelete={() => deletePlaylist(playlist.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
              <Disc size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-bold mb-6">No playlists yet. Start organizing your sessions.</p>
              <button
                onClick={() => setShowPlaylistModal(true)}
                className="text-indigo-500 font-black uppercase text-xs tracking-widest hover:underline"
              >
                Create your first playlist
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center space-x-4 mb-10">
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                {currentPlaylist?.name}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                {currentPlaylist?.description || "Your custom track list."}
              </p>
            </div>
          </div>
          {playlistTracks.length > 0 ? (
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
              {playlistTracks.map((track, idx) => (
                <TrackRow
                  key={track.id}
                  index={idx}
                  track={track}
                  onPlay={handlePlayTrack}
                  isPlaying={playerState.isPlaying && playerState.currentTrack?.id === track.id}
                  isActive={playerState.currentTrack?.id === track.id}
                  isFavorited={favorites.includes(track.id.toString())}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
              <Music size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-bold mb-6">No tracks in this playlist yet.</p>
              <button className="text-indigo-500 font-black uppercase text-xs tracking-widest hover:underline">
                Add tracks from library
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}