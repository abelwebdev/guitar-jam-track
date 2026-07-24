'use client'

import React, { useState } from 'react';
import Image from "next/image";
import { ListMusic, Disc, FolderPlus, Trash2, ChevronLeft, Music, Play, Pause, X, Edit3 } from 'lucide-react';
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
import { toast } from 'react-toastify';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  <div className={`group relative p-4 rounded-2xl bg-white dark:bg-zinc-900/30 border transition-all duration-300 cursor-pointer shadow-sm ${isEditing
    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'
    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
    }`}>
    <div onClick={onClick} className="space-y-3">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isEditing
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

  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all group ${isPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'}`}>
      <div
        onClick={onPlay}
        className="flex items-center space-x-4 flex-1 cursor-pointer"
      >
        <div className="w-12 h-12 rounded-xl overflow-hidden relative group/play">
          <Image
            src={'/background-placeholder.webp'}
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
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          title="Remove from playlist"
        >
          <X size={16} />
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
  const [deletePlaylist] = useDeletePlaylistMutation();
  const [updatePlaylist, { isLoading: isUpdating }] = useUpdatePlaylistMutation();
  const [removeTracksFromPlaylist] = useRemoveTracksFromPlaylistMutation();

  // Local state
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<ApiPlaylist | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: 'default' | 'destructive';
    isLoading?: boolean;
    loadingText?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => { },
    variant: 'destructive',
    isLoading: false,
    loadingText: 'Processing...'
  });

  // Get tracks for selected playlist
  const { data: playlistTracks = [], isLoading: tracksLoading, refetch: refetchTracks } = useGetPlaylistTracksQuery(
    { id: selectedPlaylistId! },
    { skip: !selectedPlaylistId }
  );

  const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  // Refetch playlists and tracks on page mount/navigation
  React.useEffect(() => {
    refetchPlaylists();
  }, [refetchPlaylists]);

  // Refetch tracks when playlist is selected
  React.useEffect(() => {
    if (selectedPlaylistId) {
      refetchTracks();
    }
  }, [selectedPlaylistId, refetchTracks]);

  const handleCreatePlaylist = async (name: string) => {
    try {
      await createPlaylist({ name }).unwrap();
      refetchPlaylists();
      toast.success('Playlist created');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
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
      await refetchPlaylists();
      // If we're viewing the edited playlist, refetch its tracks too
      if (selectedPlaylistId === editingPlaylist.id) {
        await refetchTracks();
      }
      setEditingPlaylist(null);
      toast.success('Playlist updated');
    } catch (error) {
      console.error('Failed to update playlist:', error);
      toast.error('Failed to update playlist');
    }
  };

  const handleDeletePlaylist = (playlistId: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Playlist',
      description: 'Are you sure you want to delete this playlist? This action cannot be undone.',
      variant: 'destructive',
      loadingText: 'Deleting...',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        try {
          await deletePlaylist(playlistId).unwrap();
          if (selectedPlaylistId === playlistId) {
            setSelectedPlaylistId(null);
          }
          await refetchPlaylists();
          toast.success('Playlist deleted');
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error) {
          console.error('Failed to delete playlist:', error);
          toast.error('Failed to delete playlist');
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handlePlayTrackInPlaylist = (track: BackingTrack) => {
    // Ensure the track has the required properties for AudioPlayer
    const enhancedTrack = {
      ...track,
      title: track.track_title || track.title || 'Unknown Track',
      coverUrl: '/background-placeholder.webp'
    };
    handlePlayTrack(enhancedTrack);
  };

  const handleRemoveTrack = (trackId: number) => {
    if (!selectedPlaylistId) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Remove Track',
      description: 'Remove this track from the playlist?',
      variant: 'destructive',
      loadingText: 'Removing...',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        try {
          await removeTracksFromPlaylist({
            playlistId: selectedPlaylistId,
            trackIds: [trackId]
          }).unwrap();
          await refetchTracks();
          await refetchPlaylists(); // Update track count
          toast.success('Track removed');
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (error) {
          console.error('Failed to remove track:', error);
          toast.error('Failed to remove track');
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  if (playlistsLoading) {
    return (
      <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-2">
            <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-900 rounded-lg animate-pulse" />
          </div>
          <div className="h-12 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 space-y-3 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-3 w-1/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500">
      {!selectedPlaylistId ? (
        <>
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase">My Playlists</h2>
              <p className="text-zinc-500 text-sm font-medium">Organize your practice playlists.</p>
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
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
                      <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
          ) : playlistTracks.length > 0 ? (
            <div className="space-y-4">
              {playlistTracks.map((track: BackingTrack, idx: number) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={idx}
                  isPlaying={playerState.currentTrack?.id?.toString() === track.id?.toString() && playerState.isPlaying}
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }))}
        variant={confirmDialog.variant}
        isLoading={confirmDialog.isLoading}
        loadingText={confirmDialog.loadingText}
      />
    </div>
  );
}