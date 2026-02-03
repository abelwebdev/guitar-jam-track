'use client'

import React from 'react';
import { Play, Pause, Heart, Plus, Sparkles } from 'lucide-react';
import { BackingTrack } from '@/types/types';

const formatDuration = (time: number) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface TrackRowProps {
  index: number;
  track: BackingTrack;
  onPlay: (track: BackingTrack) => void;
  isPlaying: boolean;
  isActive: boolean;
  isFavorited: boolean;
  onToggleFavorite: (track: BackingTrack) => void;
  onAddToPlaylist?: (track: BackingTrack) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({ 
  index, 
  track, 
  onPlay, 
  isPlaying, 
  isActive, 
  isFavorited, 
  onToggleFavorite, 
  onAddToPlaylist 
}) => (
  <div
    onClick={() => onPlay(track)}
    className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/5' : ''}`}
  >
    <div className="w-10 flex-shrink-0 text-center relative">
      <span className={`text-xs font-bold font-mono transition-opacity ${isActive ? 'opacity-0' : 'opacity-60 group-hover:opacity-0'}`}>{index + 1}</span>
      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {isActive && isPlaying ? (
          <Pause size={14} className="text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Play size={14} className="text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
    </div>

    <div className="flex items-center space-x-4 flex-1 min-w-0 pr-4">
      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-800">
        <img src={track.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400'} className="w-full h-full object-cover" alt="" />
      </div>
      <div className="min-w-0">
        <h4 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
          {track.title}
        </h4>
        <p className="text-[11px] font-medium text-zinc-500 truncate uppercase tracking-widest">
          {typeof track.artist === 'string' ? track.artist : track.artist?.artist_name || 'Unknown Artist'}
        </p>
      </div>
    </div>

    <div className="hidden lg:flex w-32 flex-shrink-0 items-center">
      <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 uppercase">
        {track.genre || 'Rock'}
      </span>
    </div>

    <div className="hidden md:flex w-24 flex-shrink-0 items-center justify-center">
      <span className="text-[11px] font-black text-zinc-500 uppercase tracking-tighter">
        {track.key || 'C'}
      </span>
    </div>

    <div className="hidden sm:flex w-20 flex-shrink-0 items-center justify-center">
      <span className="text-[11px] font-bold text-zinc-400">
        {track.bpm || 120} BPM
      </span>
    </div>

    <div className="w-20 flex-shrink-0 text-center">
      <span className="text-xs font-mono text-zinc-400 font-medium">
        {formatDuration(track.duration || 180)}
      </span>
    </div>

    <div className="flex items-center space-x-2 md:space-x-4 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(track); }}
        className={`p-1.5 rounded-lg transition-all ${isFavorited ? 'text-red-500' : 'text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
      >
        <Heart size={16} fill={isFavorited ? "currentColor" : "none"} />
      </button>
      {onAddToPlaylist && (
        <button 
          onClick={(e) => { e.stopPropagation(); onAddToPlaylist(track); }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 transition-all"
          title="Add to Playlist"
        >
          <Plus size={16} />
        </button>
      )}
      <button 
        onClick={(e) => { e.stopPropagation(); }}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 transition-all"
        title="AI Theory Insight"
      >
        <Sparkles size={16} />
      </button>
    </div>
  </div>
);

export default TrackRow;