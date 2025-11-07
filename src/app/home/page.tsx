'use client'

import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useGetHighlightedArtistsQuery, useGetUserQuery } from "@/services/api";
import { auth } from "@/lib/firebaseClient"; // your initialized firebase client
import { onAuthStateChanged, getIdToken } from "firebase/auth";

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const { data: artists, isLoading, error } = useGetHighlightedArtistsQuery();
  const { data: user, isLoading: userLoading, error: userError } = useGetUserQuery(idToken!, {
    skip: !idToken,
  });
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

  if (error || safeArtists.length === 0) {
    return null;
  } 

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 py-5 mx-5 -mb-28">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight"> Welcome to Guitar JamTrack </h1>
            <p className="text-muted-foreground"> Your personal dashboard for discovering and practicing with backing tracks. </p>
          </div>
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Explore</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-shadow text-center p-6">
                <CardTitle>Tracks</CardTitle>
                <CardContent>
                  Browse all backing tracks
                </CardContent>
                <Button asChild className="mt-2 w-full">
                  <Link href="/home/tracks">Go</Link>
                </Button>
              </Card>

              <Card className="hover:shadow-lg transition-shadow text-center p-6">
                <CardTitle>Artists</CardTitle>
                <CardContent>
                  Explore guitar artists
                </CardContent>
                <Button asChild className="mt-2 w-full">
                  <Link href="/home/artists">Go</Link>
                </Button>
              </Card>

              <Card className="hover:shadow-lg transition-shadow text-center p-6">
                <CardTitle>Playlists</CardTitle>
                <CardContent>
                  Your saved or created playlists
                </CardContent>
                <Button asChild className="mt-2 w-full">
                  <Link href="/home/playlist">Go</Link>
                </Button>
              </Card>
            </div>
          </section>
        </div>
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
                              href={`/home/${href}`}
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
      </div>
    </>
  )
}