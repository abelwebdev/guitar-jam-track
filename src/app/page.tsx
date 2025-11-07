'use client'

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X, Heart } from "lucide-react";
import { useGetHighlightedArtistsQuery } from "@/services/api";
import { auth } from "@/lib/firebaseClient";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // const [loading, setLoading] = useState(true); // wait for auth check
  // const [user, setUser ] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { data: artists, isLoading, error } = useGetHighlightedArtistsQuery();
  const [page, setPage] = useState(1);
  const [artistImages, setArtistImages] = useState<Record<number, string | null>>({});
  const [imageLoaded, setImageLoaded] = useState(false);
  const fetchedIdsRef = useRef<Set<number>>(new Set());
  const safeArtists = artists ?? [];
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(safeArtists.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const visible = safeArtists.slice(start, end);

  const handlePrev = () => setPage((p) => Math.max(1, p - 1));
  const handleNext = () => setPage((p) => Math.min(totalPages, p + 1));

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged((user) => {
  //     if (user) {
  //       setUser(true)
  //     } else {
  //       setLoading(false);
  //       setUser(false)
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [router]);

  if (error || safeArtists.length === 0) return null;

  return (
    <>
      <header className="absolute top-0 left-0 right-0 flex py-4 px-4 sm:px-6 bg-transparent min-h-[75px] tracking-wide z-10">
        <div className="flex flex-wrap items-center gap-5 w-full max-w-screen-xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-80">
            <Image
              src="/guitar-jam-track.png" //
              alt="Guitar JamTrack Logo"
              width={32}
              height={32}
              priority
              className="h-8 w-8 brightness-0 invert"
            />
            <span className="brightness-0 invert">Guitar JamTrack</span>
          </Link>
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 ml-auto">
            <Link
              href="/tracks"
              className="relative text-white hover:text-blue-500 font-medium text-[15px]
              transition-colors duration-200 after:content-[''] after:absolute after:left-0 
              after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-500
              hover:after:w-full after:transition-all after:duration-300"
            >
              Backing Tracks
            </Link>
            <Link
              href="/artists"
              className="relative text-white hover:text-blue-500 font-medium text-[15px]
              transition-colors duration-200 after:content-[''] after:absolute after:left-0 
              after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-500
              hover:after:w-full after:transition-all after:duration-300"
            >
              Artists
            </Link>
            <Link
              href="/sign-in"
              className="relative text-white hover:text-blue-500 font-medium text-[15px]
              transition-colors duration-200 after:content-[''] after:absolute after:left-0 
              after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-500
              hover:after:w-full after:transition-all after:duration-300"
            >
              Sign In
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </nav>
          {/* Mobile Right Section */}
          <div className="flex items-center lg:hidden ml-auto space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {/* Mobile menu toggle */}
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
            </Button>
          </div>
          {/* Mobile Navigation Drawer */}
          {isClient && mobileOpen && (
            <nav className="lg:hidden fixed top-0 left-0 text-black dark:text-white text-center min-w-[250px] h-full bg-white dark:bg-black shadow-md p-6 space-y-4 z-50 overflow-auto">
              <Link href="/" className="block font-semibold text-lg hover:text-blue-500" onClick={() => setMobileOpen(false)}>
                <span className="inline-flex items-center justify-center gap-2">
                  <Image src="/guitar-jam-track.png" alt="Guitar JamTrack Logo" width={28} height={28} className="h-7 w-7 dark:brightness-0 dark:invert" />
                  Guitar JamTrack
                </span>
              </Link>
              <Link href="/tracks" className="block hover:text-blue-500" onClick={() => setMobileOpen(false)}>
                Backing Tracks
              </Link>
              <Link href="/artists" className="block hover:text-blue-500" onClick={() => setMobileOpen(false)}>
                Artists
              </Link>
              <Link href="/sign-in" className="block hover:text-blue-500" onClick={() => setMobileOpen(false)}>
                Sign In
              </Link>
            </nav>
          )}
        </div>
      </header>
      <section
        className="relative flex flex-col items-center justify-center text-center min-h-[100vh] px-4 pb-20 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1684194096067-48a71562c9f9?q=80&w=1030&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
        }}
      >
        {/* Overlay to darken background for readability */}
        <div className="absolute inset-0 bg-black/50" />
        {/* Content */}
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Jam, Learn, and Master Guitar with <span> Backing Tracks </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-xl mx-auto">
            Search thousands of tracks, and practice smarter.
          </p>
          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-in">
              <Button
                size="lg"
                className="text-lg bg-blue-500 hover:bg-blue-500 text-white rounded-md shadow-md transition-all duration-200 hover:shadow-blue-500/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="relative px-4 pt-16 bg-white dark:bg-black transition-colors duration-300">
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101010] p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl sm:text-5xl font-extrabold text-blue-500 dark:text-blue-400">10k+</p>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">Backing Tracks</p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101010] p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl sm:text-5xl font-extrabold text-blue-500 dark:text-blue-400">1k+</p>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">Artists</p>
            </div>

            {/* Card 3 */}
            <div className="col-span-2 sm:col-span-1 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#101010] p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <p className="text-4xl sm:text-5xl font-extrabold text-blue-500 dark:text-blue-400">50+</p>
              <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">Genres & Styles</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20 bg-white dark:bg-black">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Discover <span className="text-blue-500 dark:text-blue-400">Artists</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover amazing artists and their backing tracks
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? 
                [...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white dark:bg-[#101010] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                  >
                    <div className="relative p-4">
                      {/* Image Skeleton */}
                      <div className="w-full h-48 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg" />

                      {/* Title Skeleton */}
                      <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />

                      {/* Button Skeleton */}
                      <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    </div>
                  </div>
                ))
              :
                visible.map((artist) => {
                  const href = `/artist/${encodeURIComponent(
                    (artist.name ?? "").replace(/\s+/g, "_")
                  )}?id=${artist.id}`;
                  return (
                    <div
                      key={artist.id}
                      className="group relative bg-white dark:bg-[#101010] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                        aria-hidden
                      >
                        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-blue-500 blur-2xl" />
                      </div>
                      <div className="relative p-4">
                        {/* Image Container */}
                        <div className="relative w-full h-70 mb-4 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                          {/* Skeleton loader (shown until image loads) */}
                          {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse">
                              <div className="w-3/4 h-3/4 bg-gray-300 dark:bg-gray-600 rounded-lg" />
                            </div>
                          )}
                          <Image
                            src={artistImages[artist.id] ?? '/public/background-placeholder.jpg'}
                            alt={artist.name ?? "Artist"}
                            fill
                            className={`object-cover transition-transform duration-300 group-hover:scale-105 ${
                              imageLoaded ? "opacity-100" : "opacity-0"
                            }`}
                            onLoadingComplete={() => setImageLoaded(true)}
                            priority={false}
                          />
                        </div>
                        {/* Content */}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1">
                              {artist.name}
                            </h3>
                          </div>
                          <Link
                            href={href}
                            className="block w-full text-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                          >
                            View Artist
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage === 1}
                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300 px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>
      <div className="flex flex-col">
        <main className="flex-1"></main>
        <footer className="bg-gray-100 text-gray-800 dark:bg-[#101010] dark:text-gray-100 py-4 px-4 w-full mt-auto transition-colors duration-300">
          <div className="container mx-auto text-center">
            <p className="inline-flex items-center gap-1">
              Guitar JamTrack, Made with <Heart className="text-blue-500 fill-blue-500" /> by
              <Link 
                href="http://abelwebdev.netlify.app" 
                className="text-blue-600 dark:text-blue-400 ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                me
              </Link>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}