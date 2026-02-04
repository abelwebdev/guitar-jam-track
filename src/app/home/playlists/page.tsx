'use client'

import React, { useState } from 'react';
import { 
  ListMusic, Disc, FolderPlus, Trash2, ChevronLeft, 
  Clock, Music, Play, Pause, X, Edit3
} from 'lucide-react';
import { BackingTrack } from '@/types/types';
import { 
  useGetPlaylistQuery, 
  useCreatePlaylistMutation, 
  useDeletePlaylistMutation,
  useGetPlaylistTracksQuery,
  useRemoveTracksFromPlaylistMutation,
  useUpdatePlaylistMutation
} from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';

// Playlist type from API
type ApiPlaylist = {
  id: number;
  name: string;
  trackCount: number;
};

const PlaylistCard: React.FC<{
  playlist: ApiPlaylist;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isEditing?: boolean;
}> = ({ playlist, onClick, onDelete, onEdit, isEditing = false }) => (
  <div className={`group relative p-4 rounded-2xl bg-white dark:bg-zinc-900/30 border transition-all duration-300 cursor-pointer shadow-sm ${
    isEditing 
      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20' 
      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
  }`}>
    <div onClick={onClick} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isEditing 
            ? 'bg-indigo-200 dark:bg-indigo-800/50' 
            : 'bg-indigo-100 dark:bg-indigo-900/30'
        }`}>
          <ListMusic size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
            title="Edit playlist name"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
            title="Delete playlist"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm mb-1">
          {playlist.name}
        </h3>
        <p className="text-xs text-zinc-500 truncate">
          {playlist.trackCount} tracks
        </p>
      </div>
    </div>
  </div>
);

const TrackRow: React.FC<{
  track: BackingTrack;
  index: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}> = ({ track, index, isPlaying, onPlay, onRemove }) => {
  const getArtistName = (artist: BackingTrack['artist']): string => {
    if (artist && typeof artist === 'object') {
      return artist.artist_name || artist.name || 'Unknown Artist';
    }
    return typeof artist === 'string' ? artist : 'Unknown Artist';
  };

  const formatDuration = (seconds: number = 180) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`group flex items-center px-4 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-all ${isPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
      <div className="w-10 flex-shrink-0 text-center">
        <button
          onClick={onPlay}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-indigo-600 text-white' 
              : 'text-zinc-400 hover:bg-indigo-600 hover:text-white group-hover:opacity-100'
          }`}
        >
          {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
        </button>
      </div>
      
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <Music size={16} className="text-zinc-400" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-sm font-bold truncate ${isPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
              {track.track_title || track.title || 'Unknown Track'}
            </h4>
            <p className="text-xs text-zinc-500 truncate">
              {getArtistName(track.artist)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="hidden lg:flex w-32 flex-shrink-0">
        <span className="text-xs text-zinc-500">Rock</span>
      </div>
      
      <div className="hidden md:flex w-24 flex-shrink-0 justify-center">
        <span className="text-xs text-zinc-500">C</span>
      </div>
      
      <div className="hidden sm:flex w-20 flex-shrink-0 justify-center">
        <span className="text-xs text-zinc-500">120</span>
      </div>
      
      <div className="w-20 flex-shrink-0 text-center">
        <span className="text-xs text-zinc-500">{formatDuration()}</span>
      </div>
      
      <div className="w-[120px] flex-shrink-0 flex items-center justify-end space-x-2">
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

const EditPlaylistModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  currentName: string;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onSubmit, currentName, isLoading = false }) => {
  const [name, setName] = useState(currentName);

  // Update local state when currentName changes
  React.useEffect(() => {
    setName(currentName);
  }, [currentName]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onSubmit(name.trim());
      onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Edit Playlist</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName || isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreatePlaylistModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isLoading?: boolean;
}> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
  const [name, setName] = useState('');

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Create New Playlist</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Playlist name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
            autoFocus
          />
          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PlaylistsPage() {
  const { playerState, handlePlayTrack } = usePlayer();
  
  // API queries and mutations
  const { data: playlists = [], isLoading: playlistsLoading, refetch: refetchPlaylists } = useGetPlaylistQuery();
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();
  const [deletePlaylist, { isLoading: isDeleting }] = useDeletePlaylistMutation();
  const [updatePlaylist, { isLoading: isUpdating }] = useUpdatePlaylistMutation();
  const [removeTracksFromPlaylist] = useRemoveTracksFromPlaylistMutation();

  // Local state
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<ApiPlaylist | null>(null);

  // Get tracks for selected playlist
  const { data: playlistTracks = [], isLoading: tracksLoading, refetch: refetchTracks } = useGetPlaylistTracksQuery(
    { id: selectedPlaylistId! },
    { skip: !selectedPlaylistId }
  );

  const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleCreatePlaylist = async (name: string) => {
    try {
      await createPlaylist({ name }).unwrap();
      refetchPlaylists();
    } catch (error) {
      console.error('Failed to create playlist:', error);
      // You could add a toast notification here
    }
  };

  const handleEditPlaylist = (playlist: ApiPlaylist) => {
    setEditingPlaylist(playlist);
    setShowEditModal(true);
  };

  const handleUpdatePlaylist = async (name: string) => {
    if (!editingPlaylist) return;
    
    try {
      await updatePlaylist({ 
        id: editingPlaylist.id, 
        name 
      }).unwrap();
      refetchPlaylists();
      setEditingPlaylist(null);
    } catch (error) {
      console.error('Failed to update playlist:', error);
      // You could add a toast notification here
    }
  };

  const handleDeletePlaylist = async (playlistId: number) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    
    try {
      await deletePlaylist(playlistId).unwrap();
      if (selectedPlaylistId === playlistId) {
        setSelectedPlaylistId(null);
      }
      refetchPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      // You could add a toast notification here
    }
  };

  const handlePlayTrackInPlaylist = (track: BackingTrack) => {
    // Ensure the track has the required properties for AudioPlayer
    const enhancedTrack = {
      ...track,
      title: track.track_title || track.title || 'Unknown Track',
      coverUrl: '/background-placeholder.jpg'
    };
    handlePlayTrack(enhancedTrack);
  };

  const handleRemoveTrack = async (trackId: number) => {
    if (!selectedPlaylistId) return;
    if (!confirm('Remove this track from the playlist?')) return;
    
    try {
      await removeTracksFromPlaylist({
        playlistId: selectedPlaylistId,
        trackIds: [trackId]
      }).unwrap();
      refetchTracks();
      refetchPlaylists(); // Update track count
    } catch (error) {
      console.error('Failed to remove track:', error);
      // You could add a toast notification here
    }
  };

  if (playlistsLoading) {
    return (
      <div className="animate-in fade-in duration-500">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 h-32" />
          ))}
        </div>
      </div>
    );
  }

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
                  onDelete={() => handleDeletePlaylist(playlist.id)}
                  onEdit={() => handleEditPlaylist(playlist)}
                  isEditing={editingPlaylist?.id === playlist.id}
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
            <div className="flex-1">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                {currentPlaylist?.name}
              </h2>
              <p className="text-zinc-500 text-sm font-medium">
                {currentPlaylist?.trackCount || 0} tracks
              </p>
            </div>
            <button
              onClick={() => currentPlaylist && handleEditPlaylist(currentPlaylist)}
              className="flex items-center space-x-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              title="Edit playlist name"
            >
              <Edit3 size={16} />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
          
          {tracksLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
              ))}
            </div>
          ) : playlistTracks.length > 0 ? (
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
              {playlistTracks.map((track: BackingTrack, idx: number) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
                  onPlay={() => handlePlayTrackInPlaylist(track)}
                  onRemove={() => handleRemoveTrack(Number(track.id))}
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

      <CreatePlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        onSubmit={handleCreatePlaylist}
        isLoading={isCreating}
      />

      <EditPlaylistModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingPlaylist(null);
        }}
        onSubmit={handleUpdatePlaylist}
        currentName={editingPlaylist?.name || ''}
        isLoading={isUpdating}
      />
    </div>
  );
}