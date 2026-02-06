'use client'

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import { Audiowide } from 'next/font/google'
const audiowide = Audiowide({ subsets: ['latin'], weight: '400' })

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <header className="fixed top-0 left-0 right-0 flex py-4 px-4 sm:px-6 min-h-[75px] tracking-wide z-50 bg-zinc-900 shadow-md">
      <div className="flex flex-wrap items-center gap-5 w-full max-w-screen-xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
          <Image
            src="/guitar-jam-track.png"
            alt="Guitar JamTrack Logo"
            width={32}
            height={32}
            priority
            className="h-8 w-8 brightness-0 invert"
          />
          <span className="text-white">Guitar JamTrack</span>
        </Link>
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto">
          <Link
            href="/tracks"
            className="relative text-white hover:text-indigo-400 font-medium text-[15px]
            transition-colors duration-200 after:content-[''] after:absolute after:left-0 
            after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-400
            hover:after:w-full after:transition-all after:duration-300"
          >
            Backing Tracks
          </Link>
          <Link
            href="/artists"
            className="relative text-white hover:text-indigo-400 font-medium text-[15px]
            transition-colors duration-200 after:content-[''] after:absolute after:left-0 
            after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-400
            hover:after:w-full after:transition-all after:duration-300"
          >
            Artists
          </Link>
          <Link
            href="/sign-in"
            className="relative text-white hover:text-indigo-400 font-medium text-[15px]
            transition-colors duration-200 after:content-[''] after:absolute after:left-0 
            after:-bottom-1 after:w-0 after:h-[2px] after:bg-indigo-400
            hover:after:w-full after:transition-all after:duration-300"
          >
            Sign In
          </Link>
        </nav>
        {/* Mobile Right Section */}
        <div className="flex items-center lg:hidden ml-auto space-x-3">
          {/* Mobile menu toggle */}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
          </Button>
        </div>
        {/* Mobile Navigation Drawer */}
        {isClient && mobileOpen && (
          <nav className="lg:hidden fixed top-0 left-0 text-white text-center min-w-[250px] h-full bg-zinc-900 shadow-md p-6 space-y-4 z-50 overflow-auto">
            <Link href="/" className="block font-semibold text-lg hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              <span className="inline-flex items-center justify-center gap-2">
                <Image src="/guitar-jam-track.png" alt="Guitar JamTrack Logo" width={28} height={28} className="h-7 w-7 brightness-0 invert" />
                  <span className={`${audiowide.className} font-black tracking-tighter text-lg uppercase text-zinc-900 dark:text-white`}>
                    Guitar JamTrack
                  </span>
              </span>
            </Link>
            <Link href="/tracks" className="block hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              Backing Tracks
            </Link>
            <Link href="/artists" className="block hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              Artists
            </Link>
            <Link href="/sign-in" className="block hover:text-indigo-400" onClick={() => setMobileOpen(false)}>
              Sign In
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}