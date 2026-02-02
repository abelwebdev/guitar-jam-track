
export interface User {
  email: string;
  name: string;
  avatar?: string;
}

export type ViewState = 'landing' | 'auth' | 'dashboard';

export interface BackingTrack {
  id: number | string;
  title: string;
  artist_id?: number | null;
  track_title?: string | null;
  track_url?: string | null;
  audioUrl?: string; // Add optional audioUrl for consistency
  artist?: string | {
    id: number;
    artist_name: string | null;
    name?: string | null;
  } | null;
  // Additional properties for Dashboard component
  genre?: string;
  key?: string;
  bpm?: number;
  duration?: number;
  coverUrl?: string;
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