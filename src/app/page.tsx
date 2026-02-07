'use client'

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Zap, ChevronRight, X, Hash, Grid, Gauge, ListMusic, Heart, Users, Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import { BackingTrack } from '../types/types';
import { useGetHighlightedArtistsQuery, useGetArtistTracksQuery } from "@/services/api";
import { Audiowide } from 'next/font/google'
const audiowide = Audiowide({ subsets: ['latin'], weight: '400' })

type LandingView = 'home' | 'tracks' | 'artists';

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string, color?: string }> = ({ icon, title, desc, color = "indigo" }) => (
  <div className="p-6 md:p-8 rounded-[2rem] bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all group relative overflow-hidden text-left shadow-sm">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 blur-[50px] rounded-full -mr-16 -mt-16`} />
    <div className={`w-12 h-12 rounded-2xl bg-${color}-600/10 flex items-center justify-center text-${color}-500 mb-6 group-hover:scale-110 transition-transform relative z-10`}>
      {icon}
    </div>
    <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white mb-3 relative z-10">{title}</h3>
    <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed relative z-10">{desc}</p>
  </div>
);

const ToolkitItem: React.FC<{ icon: React.ReactNode, name: string, active?: boolean, onActivate: () => void }> = ({ icon, name, active, onActivate }) => (
  <div 
    onMouseEnter={onActivate}
    onClick={onActivate}
    className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${active ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
  >
    {icon}
    <span className="text-xs font-black uppercase tracking-widest">{name}</span>
  </div>
);

const ArtistCard: React.FC<{ id: number, name: string | null, trackCount: number, image: string | null, onClick?: () => void }> = ({ id, name, trackCount, image, onClick }) => (
  <div 
    onClick={onClick}
    className="group relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all duration-500 text-left shadow-md cursor-pointer"
  >
    <div className="aspect-[4/5] overflow-hidden relative">
      <Image
        src={image || '/background-placeholder.jpg'}
        alt={name ?? "Artist"}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority={false}
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
      <h4 className="text-xl font-black text-white leading-tight">{name ?? 'Unknown Artist'}</h4>
      <p className="text-white/80 text-sm mb-4">{trackCount} tracks</p>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-indigo-600 transition-colors">
          <ChevronRight size={14} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

export default function Header() {
  const [mounted, setMounted] = useState(false);

  // Landing page state
  const [activeView, setActiveView] = useState<LandingView>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeToolkit, setActiveToolkit] = useState<'Metronome' | 'Tuner' | 'Chord Map' | 'Scales'>('Scales');
  const [tick, setTick] = useState(0);


  const [page, setPage] = useState(1);
  const [trackPage, setTrackPage] = useState(1);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const [artistImages, setArtistImages] = useState<Record<number, string | null>>({});
  const { data: artists, isLoading, error } = useGetHighlightedArtistsQuery();
  const { data: artistTracks, isLoading: isArtistTracksLoading } = useGetArtistTracksQuery(
    selectedArtistId?.toString() || '',
    { skip: !selectedArtistId }
  );
  const fetchedIdsRef = useRef<Set<number>>(new Set());
  const safeArtists = artists ?? [];
  const safeTracks = artistTracks ?? [];
  
  // Find selected artist
  const selectedArtist = safeArtists.find(artist => artist.id === selectedArtistId);
  
  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(safeArtists.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const visible = safeArtists.slice(start, end);

  // Track pagination
  const trackPageSize = 12;
  const totalTrackPages = Math.max(1, Math.ceil(safeTracks.length / trackPageSize));
  const currentTrackPage = Math.min(trackPage, totalTrackPages);
  const trackStart = (currentTrackPage - 1) * trackPageSize;
  const trackEnd = trackStart + trackPageSize;
  const visibleTracks = safeTracks.slice(trackStart, trackEnd);

  // Pagination handlers
  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const handleTrackPrev = () => setTrackPage((p) => Math.max(1, p - 1));
  const handleTrackNext = () => setTrackPage((p) => Math.min(totalTrackPages, p + 1));

  // Landing Player State
  const [previewTrack, setPreviewTrack] = useState<BackingTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper functions
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getArtistName = (artist: BackingTrack['artist']): string => {
    if (artist && typeof artist === 'object') {
      return artist.artist_name || artist.name || 'Unknown Artist';
    }
    return typeof artist === 'string' ? artist : 'Unknown Artist';
  };

  const getTrackUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://guitar-backing-tracks.s3.us-east-1.amazonaws.com/${url}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  // Ensure component is mounted before using theme
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeToolkit === 'Metronome') {
      const interval = setInterval(() => {
        setTick(prev => (prev + 1) % 4);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [activeToolkit]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, previewTrack, volume]);

  useEffect(() => {
    const fetchImageFor = async (artistId: number, name: string | null) => {
      if (!name || fetchedIdsRef.current.has(artistId)) return;
      try {
        const formattedName = name.trim();
        const res = await fetch(
          `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(formattedName)}`
        );
        const data = await res.json();
        const img = data?.artists && Array.isArray(data.artists)
          ? data.artists[0]?.strArtistThumb ?? "/background-placeholder.jpg"
          : "/background-placeholder.jpg";
        setArtistImages((prev) => ({ ...prev, [artistId]: img }));
        fetchedIdsRef.current.add(artistId);
      } catch {
        setArtistImages((prev) => ({ ...prev, [artistId]: null }));
        fetchedIdsRef.current.add(artistId);
      }
    };
    visible.forEach((a) => fetchImageFor(a.id, a.name ?? null));
  }, [visible]);

  return (
    <>
      <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 font-sans relative">
        <audio 
          ref={audioRef} 
          src={previewTrack?.track_url || previewTrack?.audioUrl} 
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-[99] bg-white dark:bg-black p-8 pt-32 flex flex-col space-y-8 md:hidden animate-in fade-in slide-in-from-top-4 duration-300"
            onClick={(e) => {
              // Close menu when clicking on the overlay background
              if (e.target === e.currentTarget) {
                setIsMobileMenuOpen(false);
              }
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors animate-in fade-in duration-500 delay-100"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            
            <Link 
              href="/tracks"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-black uppercase tracking-tighter text-left transition-all hover:scale-105 animate-in slide-in-from-left-4 fade-in duration-400 delay-150 relative group px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/10 ${
                activeView === "tracks" 
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" 
                  : "text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <span className="relative z-10">Tracks</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </Link>
            <Link 
              href="/artists"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-2xl font-black uppercase tracking-tighter text-left transition-all duration-200 hover:scale-105 animate-in slide-in-from-left-4 fade-in duration-400 delay-200 relative group px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/10 ${
                activeView === "artists" 
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" 
                  : "text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <span className="relative z-10">Artists</span>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </Link>
            <Link
              href="/sign-in"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-indigo-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-105 transition-all duration-200 text-center animate-in slide-in-from-bottom-4 fade-in duration-400 delay-300 shadow-lg hover:shadow-xl"
            >
              Get Started
            </Link>
          </div>
        )}

        {/* View Rendering */}
        <main className="transition-all duration-300">
          {activeView === 'home' && (
            <>
              {/* Hero Section */}
              <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-32 pb-24 px-6 md:px-8 overflow-hidden text-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2070"
                    alt="Guitar background"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Dark overlay for readability */}
                  <div className="absolute inset-0 bg-black/60 dark:bg-black/70" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center justify-center">

                  <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-snug text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
                   Jam, Learn, and Master Guitar with Backing Tracks 
                  </h1>

                  <p className="text-zinc-200 dark:text-zinc-300 text-base md:text-xl max-w-2xl mb-10 font-medium leading-relaxed px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    Search thousands of professional backing tracks and practice smarter with our intelligent guitar learning platform.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-5 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Link
                      href="/sign-in"
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-indigo-600/50 dark:shadow-indigo-500/50 flex items-center justify-center space-x-3 group"
                    >
                      <span>Get Started</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </section>

              {/* Toolkit Section */}
              <section id="toolkit" className="px-6 md:px-12 py-32 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-900">
                <div className="max-w-7xl mx-auto">
                  <div className="flex flex-col lg:flex-row gap-20">
                    <div className="lg:w-1/3 space-y-10 text-center lg:text-left">
                      <div className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        <Zap size={16} />
                        <span>The Musician&apos;s Toolkit</span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight tracking-tighter">Everything but the Strings. </h2>
                      <p className="text-zinc-500 dark:text-zinc-400 text-lg leading-relaxed mx-auto lg:mx-0">RiffMaster eliminates the need for 5 different apps. We built the essential utilities directly into your practicing experience.</p>
                      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto lg:mx-0">
                        <ToolkitItem icon={<Gauge size={16}/>} name="Metronome" active={activeToolkit === 'Metronome'} onActivate={() => setActiveToolkit('Metronome')} />
                        <ToolkitItem icon={<Zap size={16}/>} name="Tuner" active={activeToolkit === 'Tuner'} onActivate={() => setActiveToolkit('Tuner')} />
                        <ToolkitItem icon={<Hash size={16}/>} name="Chord Map" active={activeToolkit === 'Chord Map'} onActivate={() => setActiveToolkit('Chord Map')} />
                        <ToolkitItem icon={<Grid size={16}/>} name="Scales" active={activeToolkit === 'Scales'} onActivate={() => setActiveToolkit('Scales')} />
                      </div>
                    </div>
                    <div className="lg:w-2/3">
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-12 relative group overflow-hidden min-h-[400px] flex flex-col justify-center shadow-xl transition-all">
                        <div className="absolute inset-0 bg-indigo-600/5 group-hover:bg-indigo-600/10 transition-colors" />    
                          {activeToolkit === 'Scales' && (
                            <div className="relative z-10 space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
                              <div className="flex items-center justify-between">
                                  <div className="space-y-1 text-left">
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Scale Explorer</h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Dynamic Fretboard Visualization</p>
                                  </div>
                                  <div className="flex space-x-2">
                                    <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase">E MINOR</span>
                                  </div>
                              </div>
                              <div className="h-48 w-full bg-zinc-50 dark:bg-black/40 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 flex flex-col justify-between">
                                {[1, 2, 3, 4].map(s => (
                                  <div key={s} className="h-px w-full bg-zinc-200 dark:bg-zinc-800 relative">
                                      {s === 2 && <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 border-2 border-indigo-400 shadow-lg shadow-indigo-600/30" />}
                                      {s === 3 && <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-700" />}
                                  </div>
                                ))}
                              </div>
                              <p className="text-zinc-400 dark:text-zinc-600 text-xs font-medium italic text-center">Interactive visual tools built specifically for guitarists.</p>
                            </div>
                          )}
                          {activeToolkit === 'Metronome' && (
                            <div className="relative z-10 space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
                              <div className="text-center space-y-1">
                                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Precision Metronome</h3>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Rock Solid Timekeeping</p>
                              </div>
                              <div className="flex items-center space-x-8">
                                  {[0, 1, 2, 3].map(t => (
                                    <div key={t} className={`w-4 h-4 rounded-full transition-all duration-300 ${tick === t ? (t === 0 ? 'bg-indigo-500 scale-150 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'bg-zinc-400 dark:bg-zinc-400') : 'bg-zinc-200 dark:bg-zinc-800 scale-75'}`} />
                                  ))}
                              </div>
                              <div className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter">120 <span className="text-lg text-zinc-400 dark:text-zinc-600">BPM</span></div>
                            </div>
                          )}
                          {activeToolkit === 'Tuner' && (
                            <div className="relative z-10 space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col items-center">
                              <div className="text-center space-y-1">
                                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Chromatic Tuner</h3>
                                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Ultra-Low Latency Pitch Detection</p>
                              </div>
                              <div className="relative w-full h-24 flex items-center justify-center">
                                  <div className="absolute w-full h-0.5 bg-zinc-200 dark:bg-zinc-800" />
                                  <div className="absolute w-0.5 h-12 bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,1)]" />
                                  <div className="absolute w-4 h-4 bg-emerald-500 rounded-full blur-sm animate-pulse" />
                              </div>
                              <div className="text-7xl font-black text-emerald-500">E</div>
                            </div>
                          )}
                          {activeToolkit === 'Chord Map' && (
                            <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                              <div className="flex items-center justify-between">
                                  <div className="space-y-1 text-left">
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">Chord Library</h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">5,000+ Shapes at your fingertips</p>
                                  </div>
                                  <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase">C MAJOR</span>
                              </div>
                              <div className="flex justify-center">
                                  <div className="w-48 h-64 border-l-2 border-zinc-300 dark:border-zinc-700 relative flex justify-between px-2 py-4">
                                    {[1, 2, 3, 4].map(f => (
                                      <div key={f} className="absolute w-full h-px bg-zinc-200 dark:bg-zinc-800" style={{ top: `${f * 25}%` }} />
                                    ))}
                                    {[1, 2, 3, 4, 5, 6].map(s => (
                                      <div key={s} className="h-full w-px bg-zinc-200 dark:bg-zinc-600 relative">
                                          {s === 2 && <div className="absolute w-6 h-6 bg-indigo-600 border-2 border-indigo-400 rounded-full -left-3 top-1/4 shadow-lg shadow-indigo-600/30" />}
                                          {s === 4 && <div className="absolute w-6 h-6 bg-indigo-600 border-2 border-indigo-400 rounded-full -left-3 top-1/2 shadow-lg shadow-indigo-600/30" />}
                                      </div>
                                    ))}
                                  </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Feature Grid */}
              <section id="features" className="
                relative px-6 md:px-8 py-32 text-center
                border-t border-zinc-200 dark:border-zinc-900
                dark:bg-black
                dark:before:absolute dark:before:inset-x-0 dark:before:top-0
                dark:before:h-px
                dark:before:bg-gradient-to-r
                dark:before:from-transparent
                dark:before:via-indigo-500/40
                dark:before:to-transparent
              ">
                <div className="max-w-6xl mx-auto">
                  <div className="mb-24">
                    <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6">Designed for Performance</h2>
                    <p className="text-zinc-500 dark:text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed px-4">A sleek, distraction-free environment focused on one thing: making you a better player.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <FeatureCard 
                      icon={<Zap size={24} />}
                      title="Advanced Controls"
                      desc="Loop specific phrases, drop the tempo to 50% without artifacting, and adjust volume mix on the fly."
                    />
                    <FeatureCard 
                      icon={<ListMusic size={24} />}
                      title="Session Playlists"
                      color="purple"
                      desc="Organize your tracks into practice routines. Group by genre, key, or your specific training goals."
                    />
                    <FeatureCard 
                      icon={<Heart size={24} />}
                      title="Favorites Vault"
                      color="emerald"
                      desc="Quick access to your most loved backing tracks. Your library synced across all your practice sessions."
                    />
                  </div>
                </div>
              </section>

              {/* Highlighted Artist View */}
              <section className="px-6 md:px-12 py-32 bg-zinc-50 dark:bg-zinc-950/30 border-t border-zinc-200 dark:border-zinc-900">
                <div className="max-w-7xl mx-auto">
                  {!selectedArtistId ? (
                    <>
                      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-6 md:space-y-0">
                        <div className="text-left">
                          <div className="inline-flex items-center space-x-2 text-indigo-600 dark:text-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                            <Users size={16} />
                            <span>The Riff Collective</span>
                          </div>
                          <h2 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">Highlighted Artists</h2>
                        </div>
                        <Link href="/sign-in" className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-widest hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                          <span>View All</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                          // Loading skeleton
                          [...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className="animate-pulse bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-md relative"
                            >
                              <div className="aspect-[4/5] bg-zinc-200 dark:bg-zinc-700" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
                                <div className="h-6 w-3/4 bg-zinc-300 dark:bg-zinc-600 rounded mb-2" />
                                <div className="h-4 w-1/2 bg-zinc-300 dark:bg-zinc-600 rounded" />
                              </div>
                            </div>
                          ))
                        ) : error ? (
                          <div className="col-span-full text-center py-12">
                            <p className="text-zinc-500 dark:text-zinc-400">Failed to load artists</p>
                          </div>
                        ) : (
                          visible.map((artist, idx) => {
                            const artistImage = artistImages[artist.id] || null;
                            return (
                              <ArtistCard
                                key={artist.id ?? idx}
                                id={artist.id}
                                name={artist.name}
                                trackCount={artist.backing_tracks_count}
                                image={artistImage}
                                onClick={() => setSelectedArtistId(artist.id)}
                              />
                            );
                          })
                        )}
                      </div>
                      
                      {/* Pagination Controls */}
                      {!isLoading && !error && totalPages > 1 && (
                        <div className="mt-12 flex items-center justify-center gap-2 sm:gap-4">
                          <button
                            type="button"
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            <ChevronRight size={14} className="rotate-180 sm:mr-2" />
                            <span className="hidden sm:inline">Previous</span>
                          </button>
                          
                          <div className="flex items-center space-x-1 sm:space-x-2">
                            {/* Page numbers - responsive count */}
                            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage <= 2) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 1) {
                                pageNum = totalPages - 2 + i;
                              } else {
                                pageNum = currentPage - 1 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPage(pageNum)}
                                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-110 ${
                                    currentPage === pageNum
                                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                            
                            {/* Show additional pages on larger screens */}
                            <div className="hidden sm:flex items-center space-x-2">
                              {totalPages > 3 && Array.from({ length: Math.min(2, totalPages - 3) }, (_, i) => {
                                let pageNum;
                                if (currentPage <= 2) {
                                  pageNum = 4 + i;
                                } else if (currentPage >= totalPages - 1) {
                                  // Already handled in main array
                                  return null;
                                } else {
                                  pageNum = currentPage + 2 + i;
                                }
                                
                                if (pageNum > totalPages) return null;
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setPage(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-200 hover:scale-110 ${
                                      currentPage === pageNum
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={14} className="sm:ml-2" />
                          </button>
                        </div>
                      )}
                      
                      {/* Page info */}
                      {!isLoading && !error && safeArtists.length > 0 && (
                        <div className="mt-6 text-center">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                            Showing {start + 1}-{Math.min(end, safeArtists.length)} of {safeArtists.length} artists
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="animate-in slide-in-from-right-4 duration-500">
                      <button 
                        onClick={() => {
                          setSelectedArtistId(null);
                          setTrackPage(1);
                        }}
                        className="flex items-center space-x-2 text-zinc-500 hover:text-indigo-600 font-black uppercase text-xs tracking-widest transition-colors mb-12"
                      >
                        <ChevronRight size={16} className="rotate-180" />
                        <span>Back to highlighted artists</span>
                      </button>

                      <div className="mb-12">
                        <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-2">
                          {selectedArtist?.name || 'Artist'}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400">
                          {selectedArtist?.backing_tracks_count || 0} backing tracks
                        </p>
                      </div>

                      {isArtistTracksLoading ? (
                        <div className="space-y-3">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
                                <div className="space-y-2">
                                  <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                                  <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : artistTracks && artistTracks.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            {visibleTracks.map((track) => {
                              const isCurrentTrack = previewTrack?.id === track.id;
                              const isTrackPlaying = isCurrentTrack && isPlaying;
                              
                              return (
                                <div 
                                  key={track.id}
                                  className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all group cursor-pointer ${isTrackPlaying ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                                  onClick={() => {
                                    if (isCurrentTrack) {
                                      setIsPlaying(!isPlaying);
                                      if (audioRef.current) {
                                        if (isPlaying) {
                                          audioRef.current.pause();
                                        } else {
                                          audioRef.current.play();
                                        }
                                      }
                                    } else {
                                      setPreviewTrack(track);
                                      setIsPlaying(true);
                                    }
                                  }}
                                >
                                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden relative shrink-0 bg-zinc-200 dark:bg-zinc-700 group/play">
                                      <Image 
                                        src="/background-placeholder.jpg"
                                        alt={track.track_title || track.title || 'Track'}
                                        width={48}
                                        height={48}
                                        className="w-full h-full object-cover" 
                                      />
                                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover/play:opacity-100'}`}>
                                        {isTrackPlaying ? (
                                          <Pause size={14} fill="white" className="text-white sm:w-4 sm:h-4" />
                                        ) : (
                                          <Play size={14} fill="white" className="text-white ml-0.5 sm:w-4 sm:h-4" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-left min-w-0 flex-1">
                                      <h4 className={`text-xs sm:text-sm font-bold mb-0.5 truncate ${isTrackPlaying ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'}`}>
                                        {track.track_title || track.title || 'Unknown Track'}
                                      </h4>
                                      <p className="text-[9px] sm:text-[10px] text-zinc-500 font-bold uppercase tracking-widest truncate">
                                        {selectedArtist?.name || 'Unknown Artist'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className={`transition-opacity hidden sm:block ${isTrackPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {isTrackPlaying ? (
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
                              );
                            })}
                          </div>

                          {/* Track Pagination Controls */}
                          {totalTrackPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2 sm:gap-4">
                              <button
                                type="button"
                                onClick={handleTrackPrev}
                                disabled={currentTrackPage === 1}
                                className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                <ChevronRight size={14} className="rotate-180 sm:mr-2" />
                                <span className="hidden sm:inline">Previous</span>
                              </button>
                              
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                {/* Page numbers - responsive count */}
                                {Array.from({ length: Math.min(3, totalTrackPages) }, (_, i) => {
                                  let pageNum;
                                  if (totalTrackPages <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentTrackPage <= 2) {
                                    pageNum = i + 1;
                                  } else if (currentTrackPage >= totalTrackPages - 1) {
                                    pageNum = totalTrackPages - 2 + i;
                                  } else {
                                    pageNum = currentTrackPage - 1 + i;
                                  }
                                  
                                  return (
                                    <button
                                      key={pageNum}
                                      onClick={() => setTrackPage(pageNum)}
                                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-110 ${
                                        currentTrackPage === pageNum
                                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                                      }`}
                                    >
                                      {pageNum}
                                    </button>
                                  );
                                })}
                                
                                {/* Show additional pages on larger screens */}
                                <div className="hidden sm:flex items-center space-x-2">
                                  {totalTrackPages > 3 && Array.from({ length: Math.min(2, totalTrackPages - 3) }, (_, i) => {
                                    let pageNum;
                                    if (currentTrackPage <= 2) {
                                      pageNum = 4 + i;
                                    } else if (currentTrackPage >= totalTrackPages - 1) {
                                      return null;
                                    } else {
                                      pageNum = currentTrackPage + 2 + i;
                                    }
                                    
                                    if (pageNum > totalTrackPages) return null;
                                    
                                    return (
                                      <button
                                        key={pageNum}
                                        onClick={() => setTrackPage(pageNum)}
                                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-200 hover:scale-110 ${
                                          currentTrackPage === pageNum
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                                        }`}
                                      >
                                        {pageNum}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <button
                                type="button"
                                onClick={handleTrackNext}
                                disabled={currentTrackPage === totalTrackPages}
                                className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                              >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight size={14} className="sm:ml-2" />
                              </button>
                            </div>
                          )}
                          
                          {/* Track page info */}
                          {safeTracks.length > 0 && (
                            <div className="mt-6 text-center">
                              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                Showing {trackStart + 1}-{Math.min(trackEnd, safeTracks.length)} of {safeTracks.length} tracks
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-20 text-center text-zinc-400 font-bold border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                          No tracks found for this artist.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="py-16 px-6 md:px-12 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-black transition-all">
          <div className="max-w-7xl mx-auto">
            {/* Main Footer Content */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4">
              {/* Brand Section */}
              <div className="flex items-center space-x-3 cursor-pointer">
                <Image
                  src="/guitar-jam-track.png"
                  alt="Guitar JamTrack Logo"
                  width={24}
                  height={24}
                  priority
                  className="h-6 w-6 brightness-0 dark:brightness-100 dark:invert"
                />
                <span className={`${audiowide.className} font-black tracking-tighter text-base uppercase text-zinc-900 dark:text-white`}>
                  Guitar JamTrack
                </span>
              </div>

              {/* Copyright Year */}
              <div className="flex items-center justify-center">
                <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-600 font-medium tracking-wide">
                  © {new Date().getFullYear()} GUITAR JAMTRACK
                </p>
              </div>

              {/* Developer Credit */}
              <div className="flex items-center justify-center md:justify-end">
                <p className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-600 font-medium tracking-wide uppercase">
                  Built By <a href="https://abelwebdev.netlify.app" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors font-bold underline underline-offset-4 decoration-indigo-500/30 hover:decoration-indigo-500">Me</a>
                </p>
              </div>
            </div>
          </div>
        </footer>
        <style>{`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient {
            animation: gradient 6s ease infinite;
          }
          html {
            scroll-behavior: smooth;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 12px;
            width: 12px;
            border-radius: 50%;
            background: #6366f1;
            cursor: pointer;
          }
        `}</style>

        {/* Fixed Audio Player */}
        {previewTrack && (
          <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[150] w-full max-w-3xl px-4 sm:px-6 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-4 shadow-2xl flex items-center gap-2 sm:gap-4 md:gap-6 group overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
                <Image 
                  src={'/background-placeholder.jpg'} 
                  alt={previewTrack.track_title || previewTrack.title || 'Track'}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="min-w-0 pr-2 sm:pr-4">
                    <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 leading-tight truncate">
                      {previewTrack.track_title || previewTrack.title || 'Unknown Track'}
                    </p>
                    <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate">
                      {getArtistName(previewTrack.artist)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="hidden sm:block text-[8px] font-black text-zinc-400 dark:text-zinc-500 w-8 text-right tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-1 sm:h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full relative group/progress cursor-pointer">
                    <input 
                      type="range" 
                      min="0" 
                      max={duration || 100} 
                      value={currentTime} 
                      onChange={handleSeek} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div 
                      className="absolute inset-y-0 left-0 bg-indigo-600 rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    />
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-white border-2 border-indigo-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-sm"
                      style={{ left: `calc(${(currentTime / (duration || 1)) * 100}% - 4px)` }}
                    />
                  </div>
                  <span className="hidden sm:block text-[8px] font-black text-zinc-400 dark:text-zinc-500 w-8 tabular-nums">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 pr-1">
                <div className="hidden sm:flex items-center space-x-2 group/vol w-16 sm:w-24">
                  <button onClick={() => setVolume(v => (v === 0 ? 0.8 : 0))}>
                    {volume === 0 ? <VolumeX size={16} className="text-zinc-400" /> : <Volume2 size={16} className="text-zinc-400" />}
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={volume} 
                    onChange={handleVolumeChange} 
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full accent-indigo-600 appearance-none cursor-pointer" 
                  />
                </div>
                <a
                  href={`/api/download?url=${encodeURIComponent(getTrackUrl(previewTrack.track_url || previewTrack.audioUrl))}`}
                  className="hidden sm:block p-2 text-zinc-400 hover:text-indigo-600 transition-colors"
                >
                  <Download size={16} />
                </a>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                >
                  {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="ml-0.5" />}
                </button>
                <button 
                  onClick={() => {
                    setPreviewTrack(null);
                    setIsPlaying(false);
                  }}
                  className="p-1 sm:p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}