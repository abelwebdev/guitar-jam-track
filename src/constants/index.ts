import { BackingTrack } from '@/types/types';

export enum Genre {
  ROCK = 'Rock',
  BLUES = 'Blues',
  JAZZ = 'Jazz',
  METAL = 'Metal',
  FUNK = 'Funk',
  COUNTRY = 'Country',
  POP = 'Pop',
  REGGAE = 'Reggae'
}

export const MOCK_TRACKS: BackingTrack[] = [
  {
    id: '1',
    title: "Blues in A",
    artist: "Julian Vane",
    genre: Genre.BLUES,
    key: "A",
    bpm: 120,
    duration: 180,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400",
    audioUrl: "/audio/blues-in-a.mp3"
  },
  {
    id: '2',
    title: "Metal Mayhem",
    artist: "Sarah Strings",
    genre: Genre.METAL,
    key: "E",
    bpm: 140,
    duration: 240,
    coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400",
    audioUrl: "/audio/metal-mayhem.mp3"
  },
  {
    id: '3',
    title: "Funk Groove",
    artist: "Marcus Groove",
    genre: Genre.FUNK,
    key: "G",
    bpm: 110,
    duration: 200,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400",
    audioUrl: "/audio/funk-groove.mp3"
  },
  {
    id: '4',
    title: "Jazz Standard",
    artist: "Elena Jazz",
    genre: Genre.JAZZ,
    key: "Bb",
    bpm: 90,
    duration: 220,
    coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400",
    audioUrl: "/audio/jazz-standard.mp3"
  },
  {
    id: '5',
    title: "Acoustic Journey",
    artist: "Tommy Pick",
    genre: Genre.COUNTRY,
    key: "D",
    bpm: 85,
    duration: 190,
    coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400",
    audioUrl: "/audio/acoustic-journey.mp3"
  },
  {
    id: '6',
    title: "Latin Fire",
    artist: "Carlos Jam",
    genre: Genre.ROCK,
    key: "Am",
    bpm: 130,
    duration: 210,
    coverUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400",
    audioUrl: "/audio/latin-fire.mp3"
  }
];