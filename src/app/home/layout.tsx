'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { 
  LayoutDashboard, LogOut, Users, Music2, Heart, ListMusic, Anchor,
  Menu, X, User as UserIcon
} from 'lucide-react';
import Image from "next/image";
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from "sonner";
import { useGetUserQuery } from "@/services/api";
import { auth } from "@/lib/firebaseClient";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import AudioPlayer from "@/components/AudioPlayer";
import { usePlayer } from "@/contexts/PlayerContext";
import { Audiowide } from 'next/font/google'
const audiowide = Audiowide({ subsets: ['latin'], weight: '400' })

export type DashboardView = 'home' | 'artists' | 'tracks' | 'playlists' | 'favorites' | 'tools';

interface SidebarItemProps {
  icon: React.ReactNode; 
  label: string; 
  active?: boolean; 
  onClick?: () => void; 
  danger?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, danger }) => (
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

export default function HomeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { playerState, setPlayerState } = usePlayer();

  const { data: user, isLoading: userLoading } = useGetUserQuery(idToken!, {
    skip: !idToken,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await getIdToken(user, true);
        setIdToken(token);
        setFirebaseUser(user);
      } else {
        setIdToken(null);
        setFirebaseUser(null);
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

  // Determine active view from pathname
  const getCurrentView = (): DashboardView => {
    if (pathname === '/home') return 'home';
    if (pathname.startsWith('/home/artists')) return 'artists';
    if (pathname.startsWith('/home/tracks')) return 'tracks';
    if (pathname.startsWith('/home/playlists')) return 'playlists';
    if (pathname.startsWith('/home/favorites')) return 'favorites';
    if (pathname.startsWith('/home/tools')) return 'tools';
    return 'home';
  };

  const currentView = getCurrentView();

  const handleNavigation = (view: DashboardView) => {
    const routes = {
      home: '/home',
      artists: '/home/artists',
      tracks: '/home/tracks',
      playlists: '/home/playlists',
      favorites: '/home/favorites',
      tools: '/home/tools'
    };
    router.push(routes[view]);
    setIsSidebarOpen(false); // Close sidebar after navigation
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return (
    <div className="min-h-screen">
      <Toaster
        position="top-center"
        richColors
      />
      <div className="flex flex-col h-screen transition-colors duration-300 bg-white dark:bg-[#09090b] overflow-hidden font-sans text-zinc-900 dark:text-zinc-100 relative">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 w-72 bg-zinc-50 dark:bg-black flex flex-col border-r border-zinc-200 dark:border-zinc-900 p-6 z-[110] transition-transform duration-300 transform 
          md:relative md:translate-x-0 md:w-64
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => handleNavigation('home')}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                <Image
                  src="/guitar-jam-track.png"
                  alt="Guitar JamTrack Logo"
                  width={32}
                  height={32}
                  priority
                  className="h-8 w-8 brightness-0 dark:brightness-100 dark:invert"
                />
              </div>
              <h1 className={`${audiowide.className}`}>Guitar JamTrack</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 -ml-2 text-zinc-400 dark:text-zinc-500">
              <X size={20} />
            </button>
          </div>

          <nav className="space-y-1.5 flex-1 overflow-y-auto">
            <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={currentView === 'home'} onClick={() => handleNavigation('home')} />
            <SidebarItem icon={<Users size={18} />} label="Artists" active={currentView === 'artists'} onClick={() => handleNavigation('artists')} />
            <SidebarItem icon={<Music2 size={18} />} label="Tracks" active={currentView === 'tracks'} onClick={() => handleNavigation('tracks')} />
            <SidebarItem icon={<ListMusic size={18} />} label="Playlists" active={currentView === 'playlists'} onClick={() => handleNavigation('playlists')} />
            <SidebarItem icon={<Heart size={18} />} label="Favorites" active={currentView === 'favorites'} onClick={() => handleNavigation('favorites')} />
            <SidebarItem icon={<Anchor size={18} />} label="Tools" active={currentView === 'tools'} onClick={() => handleNavigation('tools')} />
          </nav>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 relative bg-white dark:bg-[#09090b]">
          {/* Header */}
          <header className="h-16 md:h-20 flex items-center justify-between px-6 md:px-10 sticky top-0 z-50 bg-white/70 dark:bg-black/40 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-900 transition-all">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Menu size={20} />
            </button>

            <div className="flex items-center space-x-3 md:space-x-4 ml-auto" ref={dropdownRef}>
              <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-1.5" />
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center space-x-2 md:space-x-3 hover:bg-zinc-100 dark:hover:bg-white/5 p-1.5 md:p-2 rounded-2xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <div className="">
                  {firebaseUser?.photoURL ? (
                    <Image 
                      src={firebaseUser.photoURL} 
                      alt="Profile"
                      width={40}
                      height={40}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 shadow-sm" 
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800 shadow-sm bg-indigo-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {firebaseUser?.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden py-2 z-[150] animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-2">
                    <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-0.5">Account</p>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{firebaseUser?.email || 'No email'}</p>
                  </div>
                  <button onClick={() => setIsProfileDropdownOpen(false)} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
                    <UserIcon size={18} />
                    <span>My Profile</span>
                  </button>
                  <button onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-all font-bold">
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto transition-all duration-300">
            {children}
          </div>
        </main>
      </div>

      {/* Global Audio Player */}
      {playerState.currentTrack && (
        <AudioPlayer 
          playerState={playerState}
          setPlayerState={setPlayerState}
          loopA={loopA}
          setLoopA={setLoopA}
          loopB={loopB}
          setLoopB={setLoopB}
        />
      )}
      </div>
    </div>
  );
}