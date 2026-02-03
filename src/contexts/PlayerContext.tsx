'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { BackingTrack, PlayerState } from '../types/types';

interface PlayerContextType {
  playerState: PlayerState;
  setPlayerState: React.Dispatch<React.SetStateAction<PlayerState>>;
  favorites: string[];
  setFavorites: React.Dispatch<React.SetStateAction<string[]>>;
  handlePlayTrack: (track: BackingTrack) => void;
  toggleFavorite: (track: BackingTrack) => void;
  handlePlayPause: () => void;
  handleSeek: (time: number) => void;
  handleVolumeChange: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    volume: 0.8,
    playbackRate: 1.0,
    currentTime: 0,
    duration: 0,
    isLooping: false,
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riffmaster_favorites');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save favorites to localStorage whenever it changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('riffmaster_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  const handlePlayTrack = (track: BackingTrack) => {
    if (playerState.currentTrack?.id === track.id) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      setPlayerState(prev => ({ 
        ...prev, 
        currentTrack: track, 
        isPlaying: true,
        currentTime: 0 
      }));
    }
  };

  const toggleFavorite = (track: BackingTrack) => {
    setFavorites(prev => 
      prev.includes(track.id.toString()) 
        ? prev.filter(id => id !== track.id.toString()) 
        : [...prev, track.id.toString()]
    );
  };

  const handlePlayPause = () => {
    setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleSeek = (time: number) => {
    setPlayerState(prev => ({ 
      ...prev, 
      currentTime: time,
      duration: prev.duration || time 
    }));
  };

  const handleVolumeChange = (volume: number) => {
    setPlayerState(prev => ({ ...prev, volume }));
  };

  const value: PlayerContextType = {
    playerState,
    setPlayerState,
    favorites,
    setFavorites,
    handlePlayTrack,
    toggleFavorite,
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};