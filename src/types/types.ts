
export enum Genre {
  BLUES = 'Blues',
  ROCK = 'Rock',
  METAL = 'Metal',
  JAZZ = 'Jazz',
  FUNK = 'Funk',
  ACOUSTIC = 'Acoustic'
}

export interface User {
  email: string;
  name: string;
  avatar?: string;
}

export type ViewState = 'landing' | 'auth' | 'dashboard';

export interface BackingTrack {
  id: string;
  title: string;
  artist: string;
  genre: Genre;
  key: string;
  bpm: number;
  duration: number; // in seconds
  audioUrl: string;
  coverUrl: string;
  description: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: number;
}

export interface TheoryInsight {
  recommendedScales: string[];
  chordProgression: string;
  playingTips: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack: BackingTrack | null;
  volume: number;
  playbackRate: number;
  currentTime: number;
  duration: number;
  isLooping: boolean;
}