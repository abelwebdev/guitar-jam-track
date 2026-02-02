'use client'

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from 'lucide-react';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] px-6 md:px-12 py-5 flex items-center justify-between backdrop-blur-xl bg-white/70 dark:bg-black/40 border-b border-zinc-200 dark:border-white/5 transition-all">
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center ">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <Image
                src="/guitar-jam-track.png"
                alt="Guitar JamTrack Logo"
                width={32}
                height={32}
                priority
                className="h-8 w-8 brightness-0 dark:brightness-100 dark:invert"
              />
            </Link>
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tighter uppercase text-zinc-900 dark:text-white">
            Guitar JamTrack
          </span>
        </div>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-10">
          <div className="flex items-center space-x-8">
            <Link
              href="/tracks"
              className="relative text-zinc-900 dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 font-medium text-[15px]
              transition-colors duration-200 after:content-[''] after:absolute after:left-0 
              after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-500 dark:after:bg-indigo-400
              hover:after:w-full after:transition-all after:duration-300"
            >
              Tracks
            </Link>

            <Link
              href="/artists"
              className="relative text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 font-medium text-[15px]
              transition-colors duration-200 after:content-[''] after:absolute after:left-0 
              after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-500 dark:after:bg-indigo-400
              hover:after:w-full after:transition-all after:duration-300"
            >
              Artists
            </Link>
          </div>

          <div className="flex items-center space-x-4 border-l border-zinc-200 dark:border-zinc-800 pl-10">
            {/* Get started (primary button) */}
            <Link
              href="/sign-in"
              className="bg-indigo-600 dark:bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center space-x-3">
          {/* Menu toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileMenuOpen(!isMobileMenuOpen);
            }}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-all duration-200 relative z-50 touch-manipulation hover:scale-110 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-800/50 active:scale-95 group"
            aria-label="Toggle menu"
          >
            <div className="transition-all duration-300 group-hover:scale-110">
              {isMobileMenuOpen ? (
                <X size={20} className="animate-in spin-in-90 duration-200 text-red-500 group-hover:text-red-400 group-hover:rotate-90" />
              ) : (
                <Menu size={20} className="animate-in fade-in duration-200 text-indigo-500 group-hover:text-indigo-400" />
              )}
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[99] bg-white dark:bg-black p-8 pt-32 flex flex-col space-y-8 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
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
            className="text-2xl font-black uppercase tracking-tighter text-left transition-all duration-200 hover:scale-105 animate-in slide-in-from-left-4 fade-in duration-400 delay-150 text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 relative group px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <span className="relative z-10">Tracks</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          </Link>
          
          <Link 
            href="/artists"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-2xl font-black uppercase tracking-tighter text-left transition-all duration-200 hover:scale-105 animate-in slide-in-from-left-4 fade-in duration-400 delay-200 text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 relative group px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <span className="relative z-10">Artists</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
          </Link>
          
          <Link 
            href="/sign-in"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-2xl font-black uppercase tracking-tighter text-left text-zinc-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200 hover:scale-105 animate-in slide-in-from-left-4 fade-in duration-400 delay-250 relative group px-4 py-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:shadow-lg hover:shadow-indigo-500/10"
          >
            <span className="relative z-10">Sign In</span>
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

      {/* Main Content */}
      {children}
    </>
  );
}