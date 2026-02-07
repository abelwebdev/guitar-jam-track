'use client'

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { 
  LayoutDashboard, LogOut, Users, Music2, Heart, ListMusic, Anchor, ChevronLeft,
  Menu, X, User as UserIcon, Loader2, Lock, Trash2
} from 'lucide-react';
import Image from "next/image";
import { useRouter, usePathname } from 'next/navigation';
import { toast, Toaster } from "sonner";
import { useGetUserQuery, useUpdateUserMutation, useDeleteUserMutation, useSessionLogoutMutation } from "@/services/api";
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
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
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
          fixed inset-y-0 left-0 w-72 bg-zinc-50 dark:bg-black flex flex-col border-r border-zinc-200 dark:border-zinc-900 p-4 z-[110] transition-all duration-300 transform 
          md:relative md:translate-x-0 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isDesktopSidebarOpen ? 'md:w-64' : 'md:w-0 md:overflow-hidden md:p-0 md:border-r-0'}
        `}>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-2 group cursor-pointer min-w-0" onClick={() => handleNavigation('home')}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Image
                  src="/guitar-jam-track.png"
                  alt="Guitar JamTrack Logo"
                  width={32}
                  height={32}
                  priority
                  className="h-8 w-8 brightness-0 dark:brightness-100 dark:invert"
                />
              </div>
              <h1 className={`${audiowide.className} text-sm tracking-tight`}>Guitar JamTrack</h1>
            </div>
            <button 
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsDesktopSidebarOpen(false);
                } else {
                  setIsSidebarOpen(false);
                }
              }} 
              className="p-2 shrink-0 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <ChevronLeft size={20} />
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
            <button 
              onClick={() => {
                if (window.innerWidth >= 768) {
                  setIsDesktopSidebarOpen(true);
                } else {
                  setIsSidebarOpen(true);
                }
              }} 
              className={`p-2 -ml-2 text-zinc-500 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 ${isDesktopSidebarOpen ? 'md:hidden' : 'md:block'}`}
            >
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
                  <button onClick={() => { setIsProfileDropdownOpen(false); setIsProfileEditModalOpen(true); }} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 transition-all">
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

      {/* Profile Edit Modal */}
      {user && idToken && (
        <ProfileEditModal
          isOpen={isProfileEditModalOpen}
          onClose={() => setIsProfileEditModalOpen(false)}
          currentUser={{
            username: user.username,
            email: user.email,
            img: user.img,
          }}
          idToken={idToken}
        />
      )}
      </div>
    </div>
  );
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    username: string;
    email: string;
    img: string;
  };
  idToken: string;
}

function ProfileEditModal({ isOpen, onClose, currentUser, idToken }: ProfileEditModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const router = useRouter();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [logout] = useSessionLogoutMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      await updateUser({
        idToken,
        password,
      }).unwrap();
      
      toast.success('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error('Failed to update password. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteUser({ idToken }).unwrap();
      toast.success('Account deleted successfully');
      await logout().unwrap();
      router.push('/');
      onClose();
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  const confirmDelete = () => {
    toast.error('Are you sure you want to delete your account? This action is permanent.', {
      duration: 10000,
      action: {
        label: 'Delete Forever',
        onClick: handleDeleteAccount
      },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Account Settings</h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={currentUser.email}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-2">Change Password</h3>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  <Lock size={16} className="inline mr-1.5" />
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  <Lock size={16} className="inline mr-1.5" />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isUpdating || isDeleting}
                className="px-4 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-semibold flex items-center gap-2 group"
              >
                <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                Delete
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdating || isDeleting}
                className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating || isDeleting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}