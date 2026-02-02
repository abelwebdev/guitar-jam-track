'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, Search, 
  Music2, Mic2, Heart, Clock, ListMusic,
  Gauge, Repeat, Sparkles, X, ChevronRight, ChevronLeft, LayoutDashboard, LogOut,
  Users, Library, Disc, Plus, Trash2, User as UserIcon,
  Menu, Moon, Sun, FolderPlus, Music, ArrowLeft, BookOpen, Lightbulb,
  Hash, Zap, Grid, Anchor
} from 'lucide-react';
import { BackingTrack, PlayerState, TheoryInsight, User, Playlist } from '@/types/types';
import { MOCK_TRACKS, Genre } from '@/constants';
import { useGetAllTracksQuery, useGetHighlightedArtistsQuery, useGetUserQuery } from '@/services/api';
import { auth } from '@/lib/firebaseClient';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type DashboardView = 'home' | 'artists' | 'tracks' | 'playlists' | 'favorites' | 'tools';
type ToolTab = 'metronome' | 'tuner' | 'chord-library' | 'scales';

const ITEMS_PER_PAGE = 10;
const ARTISTS_PER_PAGE = 12;

// Music theory constants
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORD_VARIATIONS = ['Major', 'Minor', '7th', 'Minor 7th', 'Major 7th', 'Diminished', 'Augmented'];
const STRINGS_BASE_NOTES = [4, 11, 7, 2, 9, 4]; // E A D G B E (in semitones from C)

const SCALES_DATA = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Minor': [0, 2, 3, 5, 7, 8, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10]
};

const CHORD_SHAPES = {
  'C': { 'Major': [0, 1, 0, 2, 3, 0], 'Minor': [0, 1, 3, 3, 2, 0], '7th': [0, 1, 0, 2, 1, 0] },
  'D': { 'Major': [-1, -1, 0, 2, 3, 2], 'Minor': [-1, -1, 0, 2, 3, 1], '7th': [-1, -1, 0, 2, 1, 2] },
  'E': { 'Major': [0, 2, 2, 1, 0, 0], 'Minor': [0, 2, 2, 0, 0, 0], '7th': [0, 2, 0, 1, 0, 0] },
  'F': { 'Major': [1, 1, 3, 3, 2, 1], 'Minor': [1, 1, 3, 3, 2, 1], '7th': [1, 1, 1, 2, 1, 1] },
  'G': { 'Major': [3, 2, 0, 0, 3, 3], 'Minor': [3, 1, 0, 0, 3, 3], '7th': [3, 2, 0, 0, 0, 1] },
  'A': { 'Major': [-1, 0, 2, 2, 2, 0], 'Minor': [-1, 0, 2, 2, 1, 0], '7th': [-1, 0, 2, 0, 2, 0] },
  'B': { 'Major': [-1, 2, 4, 4, 4, 2], 'Minor': [-1, 2, 4, 4, 3, 2], '7th': [-1, 2, 1, 2, 0, 2] }
};

const formatDuration = (time: number) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SidebarItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick?: () => void; 
  danger?: boolean 
}> = ({ icon, label, active, onClick, danger }) => (
  <div 
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' 
        : danger 
          ? 'text-zinc-500 hover:bg-red-500/10 hover:text-red-500' 
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-indigo-600 dark:hover:text-indigo-400'
    }`}
  >
    {icon}
    <span className="text-sm">{label}</span>
  </div>
);

const TrackRow: React.FC<{
  index: number;
  track: BackingTrack;
  onPlay: (track: BackingTrack) => void;
  isPlaying: boolean;
  isActive: boolean;
  isFavorited: boolean;
  onToggleFavorite: (track: BackingTrack) => void;
}> = ({ index, track, onPlay, isPlaying, isActive, isFavorited, onToggleFavorite }) => (
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

const TrackCard: React.FC<{ 
  track: BackingTrack; 
  onPlay: (track: BackingTrack) => void; 
  isPlaying: boolean; 
  isActive: boolean;
}> = ({ track, onPlay, isPlaying, isActive }) => (
  <div onClick={() => onPlay(track)} className={`group relative p-2.5 rounded-2xl bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all duration-300 cursor-pointer shadow-sm ${isActive ? 'ring-2 ring-indigo-500/50' : ''}`}>
    <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
      <img src={track.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400'} alt={track.title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" />
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

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>('home');
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>('metronome');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'All'>('All');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // API queries
  const { data: tracksData, isLoading: tracksLoading } = useGetAllTracksQuery();
  const { data: artistsData, isLoading: artistsLoading } = useGetHighlightedArtistsQuery();

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

  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('riffmaster_history');
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

  const [insight, setInsight] = useState<TheoryInsight | null>(null);
  const [showInsightModal, setShowInsightModal] = useState(false);

  // Tools state
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeTick, setMetronomeTick] = useState(0);
  const [isTunerActive, setIsTunerActive] = useState(false);
  const [selectedChordRoot, setSelectedChordRoot] = useState('C');
  const [selectedChordType, setSelectedChordType] = useState('Major');
  const [selectedScaleRoot, setSelectedScaleRoot] = useState('C');
  const [selectedScaleType, setSelectedScaleType] = useState('Major');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper functions for tools
  const currentChord = CHORD_SHAPES[selectedChordRoot as keyof typeof CHORD_SHAPES]?.[selectedChordType as keyof typeof CHORD_SHAPES['C']];
  
  const isNoteInScale = (stringIndex: number, fretIndex: number, root: string, scaleType: string) => {
    const rootIndex = NOTES.indexOf(root);
    const noteIndex = (STRINGS_BASE_NOTES[stringIndex] + fretIndex) % 12;
    const relativeNote = (noteIndex - rootIndex + 12) % 12;
    return SCALES_DATA[scaleType as keyof typeof SCALES_DATA]?.includes(relativeNote) || false;
  };

  // Metronome effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMetronomePlaying) {
      interval = setInterval(() => {
        setMetronomeTick(prev => (prev + 1) % 4);
      }, (60 / metronomeBpm) * 1000);
    }
    return () => clearInterval(interval);
  }, [isMetronomePlaying, metronomeBpm]);

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      const artist = typeof t.artist === 'string' ? t.artist : t.artist?.artist_name || '';
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           artist.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || t.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    });
  }, [tracks, searchQuery, selectedGenre]);

  const historyTracks = useMemo(() => {
    return history.map(id => tracks.find(t => t.id.toString() === id)).filter(Boolean) as BackingTrack[];
  }, [tracks, history]);

  const paginatedTracks = useMemo(() => {
    return filteredTracks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredTracks, currentPage]);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('riffmaster_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('riffmaster_history', JSON.stringify(history));
    }
  }, [history]);

  const handlePlayTrack = (track: BackingTrack) => {
    if (playerState.currentTrack?.id === track.id) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      setPlayerState(prev => ({ ...prev, currentTrack: track, isPlaying: true }));
      setHistory(prev => {
        const newHistory = prev.filter(id => id !== track.id.toString());
        return [track.id.toString(), ...newHistory].slice(0, 12);
      });
    }
  };

  const toggleFavorite = (track: BackingTrack) => {
    setFavorites(prev => 
      prev.includes(track.id.toString()) 
        ? prev.filter(id => id !== track.id.toString()) 
        : [...prev, track.id.toString()]
    );
  };

  return (
    <div className="flex flex-col h-screen transition-colors duration-300 bg-white dark:bg-[#09090b] overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 relative">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`
          fixed inset-y-0 left-0 w-72 bg-zinc-50 dark:bg-black flex flex-col border-r border-zinc-200 dark:border-zinc-900 p-6 z-[110] transition-transform duration-300 transform 
          md:relative md:translate-x-0 md:w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveView('home')}>
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                <Mic2 className="text-white" size={20} />
              </div>
              <h1 className="text-lg font-black tracking-tighter text-zinc-900 dark:text-white uppercase">Guitar JamTrack</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 -ml-2 text-zinc-400 dark:text-zinc-500">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeView === 'home'} onClick={() => setActiveView('home')} />
            <SidebarItem icon={<Users size={18} />} label="Artists" active={activeView === 'artists'} onClick={() => setActiveView('artists')} />
            <SidebarItem icon={<Music2 size={18} />} label="Tracks" active={activeView === 'tracks'} onClick={() => setActiveView('tracks')} />
            <SidebarItem icon={<Heart size={18} />} label="Favorites" active={activeView === 'favorites'} onClick={() => setActiveView('favorites')} />
            <SidebarItem icon={<Anchor size={18} />} label="Tools" active={activeView === 'tools'} onClick={() => setActiveView('tools')} />
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#09090b]">
          <header className="h-16 md:h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 transition-all">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Menu size={20} />
            </button>

            <div className="flex items-center space-x-3 md:space-x-4 ml-auto" ref={dropdownRef}>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1.5" />

              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center space-x-2 md:space-x-3 hover:bg-zinc-100 dark:hover:bg-white/5 p-1.5 md:p-2 rounded-2xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Jam Session</p>
                </div>
                <div className="relative">
                  <img src={user.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100'} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 shadow-sm" alt="Avatar" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#09090b] rounded-full"></div>
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-2 z-[150] animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-0.5">Musician ID</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{user.email}</p>
                  </div>
                  <button onClick={() => setIsProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                    <UserIcon size={18} />
                    <span>My Profile</span>
                  </button>
                  <button onClick={() => { setIsProfileDropdownOpen(false); onLogout(); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-all font-bold">
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 transition-all duration-300">
            {activeView === 'home' && (
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
                          onPlay={handlePlayTrack} 
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
                          <img src={artist.image} alt={artist.name} className="w-full h-full object-cover grayscale-20 group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" />
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
                    <button onClick={() => setActiveView('tracks')} className="text-xs font-bold text-indigo-500 hover:underline">View Library</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {tracks.slice(0, 6).map(track => (
                      <TrackCard 
                        key={track.id} 
                        track={track} 
                        onPlay={handlePlayTrack} 
                        isPlaying={playerState.isPlaying && playerState.currentTrack?.id === track.id} 
                        isActive={playerState.currentTrack?.id === track.id}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {activeView === 'tracks' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-6 md:space-y-0">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">Library</h2>
                    <p className="text-zinc-500 text-sm font-medium">Browse the full catalog of tracks.</p>
                  </div>
                  <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-hover:text-indigo-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search tracks, keys, genres..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-indigo-500 transition-all text-zinc-900 dark:text-white" 
                    />
                  </div>
                </div>
                
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

                  {paginatedTracks.length > 0 ? paginatedTracks.map((track, idx) => (
                    <TrackRow 
                      key={track.id} 
                      index={(currentPage - 1) * ITEMS_PER_PAGE + idx}
                      track={track} 
                      onPlay={handlePlayTrack} 
                      isPlaying={playerState.isPlaying && playerState.currentTrack?.id === track.id} 
                      isActive={playerState.currentTrack?.id === track.id}
                      isFavorited={favorites.includes(track.id.toString())}
                      onToggleFavorite={toggleFavorite}
                    />
                  )) : (
                    <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">No tracks found matching your criteria.</div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'favorites' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 space-y-6 md:space-y-0">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tight mb-2 uppercase tracking-tighter">Favorites</h2>
                    <p className="text-zinc-500 text-sm font-medium">Your most played backing tracks.</p>
                  </div>
                </div>
                {favorites.length > 0 ? (
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
                    {tracks.filter(t => favorites.includes(t.id.toString())).map((track, idx) => (
                      <TrackRow 
                        key={track.id} 
                        index={idx}
                        track={track} 
                        onPlay={handlePlayTrack} 
                        isPlaying={playerState.isPlaying && playerState.currentTrack?.id === track.id} 
                        isActive={playerState.currentTrack?.id === track.id}
                        isFavorited={true}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Heart size={48} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-4" />
                    <p className="text-zinc-500 font-bold mb-6">No favorites yet. Tap the heart on tracks you love.</p>
                    <button onClick={() => setActiveView('tracks')} className="text-indigo-500 font-black uppercase text-xs tracking-widest hover:underline">Browse tracks</button>
                  </div>
                )}
              </div>
            )}

            {activeView === 'tools' && (
              <div className="animate-in fade-in duration-500 space-y-12">
                <div className="flex items-center space-x-1 p-1 bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full sm:w-fit overflow-x-auto scrollbar-hide shadow-sm">
                  <button onClick={() => setActiveToolTab('metronome')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === 'metronome' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                    <Gauge size={14} />
                    <span>Metronome</span>
                  </button>
                  <button onClick={() => setActiveToolTab('tuner')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === 'tuner' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                    <Zap size={14} />
                    <span>Tuner</span>
                  </button>
                  <button onClick={() => setActiveToolTab('chord-library')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === 'chord-library' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                    <Hash size={14} />
                    <span>Chord Map</span>
                  </button>
                  <button onClick={() => setActiveToolTab('scales')} className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === 'scales' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                    <Grid size={14} />
                    <span>Scale Explorer</span>
                  </button>
                </div>

                <div className="min-h-[400px]">
                  {activeToolTab === 'metronome' && (
                    <div className="animate-in fade-in zoom-in-95 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center space-y-12 relative overflow-hidden shadow-sm">
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-indigo-600 transition-opacity duration-75 ${metronomeTick === 0 ? 'opacity-100' : 'opacity-0'}`} />
                      <div className="text-center space-y-4">
                        <h3 className="text-7xl font-black text-zinc-900 dark:text-white tracking-tighter">
                          {metronomeBpm}
                          <span className="text-lg text-zinc-400 dark:text-zinc-600 ml-2">BPM</span>
                        </h3>
                        <div className="flex space-x-3 justify-center">
                          {[0, 1, 2, 3].map(t => (
                            <div key={t} className={`w-3 h-3 rounded-full transition-all duration-150 ${metronomeTick === t ? (t === 0 ? 'bg-indigo-500 scale-150 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-zinc-400') : 'bg-zinc-200 dark:bg-zinc-800'}`} />
                          ))}
                        </div>
                      </div>
                      <div className="w-full max-w-sm space-y-8">
                        <input type="range" min="40" max="220" value={metronomeBpm} onChange={(e) => setMetronomeBpm(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                        <button onClick={() => setIsMetronomePlaying(!isMetronomePlaying)} className={`w-full py-5 rounded-[1.5rem] font-black text-base flex items-center justify-center space-x-3 transition-all ${isMetronomePlaying ? 'bg-zinc-800 text-white shadow-xl' : 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30'}`}>
                          {isMetronomePlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
                          <span>{isMetronomePlaying ? 'Stop' : 'Start'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {activeToolTab === 'tuner' && (
                    <div className="animate-in fade-in zoom-in-95 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-12 shadow-sm">
                      <div className="text-center">
                        <span className={`text-8xl font-black transition-colors ${isTunerActive ? 'text-emerald-500' : 'text-zinc-200 dark:text-zinc-800'}`}>E</span>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${isTunerActive ? 'text-emerald-500' : 'text-zinc-300 dark:text-zinc-700'}`}>In Tune</p>
                      </div>
                      <button onClick={() => setIsTunerActive(!isTunerActive)} className={`px-10 py-4 rounded-2xl font-black text-sm transition-all ${isTunerActive ? 'bg-zinc-800 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20'}`}>
                        {isTunerActive ? 'Disable Tuner' : 'Enable Microphone'}
                      </button>
                    </div>
                  )}

                  {activeToolTab === 'chord-library' && (
                    <div className="animate-in fade-in zoom-in-95 space-y-8">
                      <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                          {NOTES.filter(n => ['C','D','E','F','G','A','B'].includes(n)).map(note => (
                            <button key={note} onClick={() => setSelectedChordRoot(note)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedChordRoot === note ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                              {note}
                            </button>
                          ))}
                        </div>
                        <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                          {CHORD_VARIATIONS.map(type => (
                            <button key={type} onClick={() => setSelectedChordType(type)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedChordType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-12 items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                        <div className="text-center md:text-left space-y-2">
                          <h3 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{selectedChordRoot} {selectedChordType}</h3>
                          <p className="text-zinc-500 font-medium">Common voicing for guitar.</p>
                        </div>
                        <div className="relative p-8 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800">
                          <div className="w-48 h-64 border-l-2 border-zinc-300 dark:border-zinc-700 relative flex justify-between px-2 pt-8">
                            <div className="absolute top-0 left-0 w-full h-2 bg-zinc-800 dark:bg-zinc-100 rounded-full" />
                            {[1, 2, 3, 4, 5].map(f => (
                              <div key={f} className="absolute w-full h-px bg-zinc-200 dark:bg-zinc-700" style={{ top: `${f * 20 + 8}%` }} />
                            ))}
                            {STRINGS_BASE_NOTES.map((_, sIdx) => {
                              const fret = currentChord ? currentChord[5-sIdx] : -1;
                              return (
                                <div key={sIdx} className="h-full w-px bg-zinc-200 dark:bg-zinc-600 relative">
                                  {fret === 0 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-500">O</div>
                                  )}
                                  {fret === -1 && (
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-500">X</div>
                                  )}
                                  {fret > 0 && (
                                    <div className="absolute w-6 h-6 bg-indigo-600 border-2 border-indigo-400 rounded-full -left-[11px] shadow-lg shadow-indigo-600/30 flex items-center justify-center text-[8px] text-white font-black" style={{ top: `${(fret - 0.5) * 20 + 8}%` }}>
                                      {fret}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeToolTab === 'scales' && (
                    <div className="animate-in fade-in zoom-in-95 space-y-8">
                      <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                          {NOTES.map(note => (
                            <button key={note} onClick={() => setSelectedScaleRoot(note)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedScaleRoot === note ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                              {note}
                            </button>
                          ))}
                        </div>
                        <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                          {Object.keys(SCALES_DATA).map(type => (
                            <button key={type} onClick={() => setSelectedScaleType(type)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedScaleType === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'}`}>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] overflow-x-auto custom-scrollbar">
                        <div className="min-w-[800px] space-y-6">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">{selectedScaleRoot} {selectedScaleType} Scale</h3>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-indigo-600" />
                                <span className="text-[10px] font-black uppercase text-zinc-400">Scale Note</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-black uppercase text-zinc-400">Root Note</span>
                              </div>
                            </div>
                          </div>
                          <div className="relative h-48 flex flex-col justify-between pt-4 pb-4 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                            {[1, 2, 3, 4, 5, 6].map(sIdx => (
                              <div key={sIdx} className="h-px w-full bg-zinc-200 dark:bg-zinc-700 relative">
                                {Array.from({ length: 13 }).map((_, fIdx) => {
                                  const isScaleNote = isNoteInScale(sIdx - 1, fIdx, selectedScaleRoot, selectedScaleType);
                                  const noteName = NOTES[(STRINGS_BASE_NOTES[sIdx - 1] + fIdx) % 12];
                                  const isRoot = noteName === selectedScaleRoot;
                                  return (
                                    <React.Fragment key={fIdx}>
                                      {fIdx > 0 && (
                                        <div className="absolute top-[-24px] h-[48px] w-px bg-zinc-100 dark:bg-zinc-800" style={{ left: `${fIdx * 7.69}%` }} />
                                      )}
                                      {isScaleNote && (
                                        <div className={`absolute -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg transition-all ${isRoot ? 'bg-emerald-500 scale-110' : 'bg-indigo-600 opacity-90'}`} style={{ left: `${fIdx * 7.69 + 3.84}%`, top: '50%' }}>
                                          {noteName}
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            ))}
                            <div className="absolute bottom-[-24px] left-0 w-full flex justify-between px-4">
                              {Array.from({ length: 13 }).map((_, i) => (
                                <span key={i} className="text-[8px] font-black text-zinc-400 w-6 text-center" style={{ marginLeft: i === 0 ? '0' : 'auto' }}>
                                  {i}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {showInsightModal && insight && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-indigo-600">
              <div className="flex items-center space-x-3 text-white">
                <Sparkles size={24} />
                <h3 className="text-xl font-black uppercase tracking-tighter">AI Theory Insight</h3>
              </div>
              <button onClick={() => setShowInsightModal(false)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                    <BookOpen size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Recommended Scales</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insight.recommendedScales.map((scale, i) => (
                      <span key={i} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold">{scale}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                    <Disc size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Chord Progression</h4>
                  </div>
                  <p className="text-sm font-mono bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">{insight.chordProgression}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                  <Lightbulb size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Playing Tips</h4>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm">{insight.playingTips}</p>
              </div>
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Estimated Difficulty</span>
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  insight.difficulty === 'Advanced' ? 'bg-red-500 text-white' :
                  insight.difficulty === 'Intermediate' ? 'bg-amber-500 text-white' :
                  'bg-emerald-500 text-white'
                }`}>{insight.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {playerState.currentTrack && (
        <footer className="bg-white/95 dark:bg-black/95 backdrop-blur-3xl border-t border-zinc-200 dark:border-zinc-900 p-4">
          <audio 
            ref={audioRef} 
            src={playerState.currentTrack?.audioUrl} 
            onEnded={() => setPlayerState(prev => ({ ...prev, isPlaying: false }))} 
          />
          
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md shrink-0">
                <img src={playerState.currentTrack?.coverUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=400'} alt="Album" className="w-full h-full object-cover" />
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
    </div>
  );
};

export default function Home() {
  const [idToken, setIdToken] = useState<string | null>(null);
  const { data: user, isLoading: userLoading } = useGetUserQuery(idToken!, {
    skip: !idToken,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getIdToken(user, true);
        setIdToken(token);
      } else {
        setIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const mockUser: User = {
    name: user.username || 'Guitar Player',
    email: user.email,
    avatar: user.img || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100'
  };

  return (
    <Dashboard 
      user={mockUser}
      onLogout={handleLogout}
    />
  );
}