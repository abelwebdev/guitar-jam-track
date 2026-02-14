'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Music2, Users, Heart, ListMusic, TrendingUp, ChevronRight, Play, Pause } from 'lucide-react';
import Image from 'next/image';
import { useGetHighlightedArtistsQuery, useGetAllTracksQuery, useGetFavoritesQuery, useGetPlaylistQuery, useGetAllArtistsQuery, useGetArtistTracksQuery } from '@/services/api';
import { useRouter } from 'next/navigation';
import { BackingTrack } from '@/types/types';
import { usePlayer } from '@/contexts/PlayerContext';

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; trend?: string; onClick?: () => void }> = ({ icon, label, value, trend, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 ${onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''} transition-all duration-300`}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        {icon}
      </div>
      {trend && (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400 text-xs font-bold">
          <TrendingUp size={14} />
          <span>{trend}</span>
        </div>
      )}
    </div>
    <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-1">{value}</h3>
    <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">{label}</p>
  </div>
);

const ArtistCard: React.FC<{ artist: { id: number; name: string | null; backing_tracks_count: number }; image: string | null; onClick: () => void }> = ({ artist, image, onClick }) => (
  <div
    onClick={onClick}
    className="group relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 transition-all duration-500 text-left shadow-md cursor-pointer"
  >
    <div className="aspect-[4/5] overflow-hidden relative">
      <Image
        src={image || '/background-placeholder.jpg'}
        alt={artist.name ?? "Artist"}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority={false}
        unoptimized={!!image}
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
      <h4 className="text-xl font-black text-white leading-tight">{artist.name ?? 'Unknown Artist'}</h4>
      <p className="text-white/80 text-sm mb-4">{artist.backing_tracks_count} tracks</p>
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-indigo-600 transition-colors">
          <ChevronRight size={14} className="text-white" />
        </div>
      </div>
    </div>
  </div>
);

const TrackRow: React.FC<{ track: BackingTrack; image?: string | null }> = ({ track, image }) => {
  const { playerState, setPlayerState } = usePlayer();
  const isCurrentTrack = playerState.currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && playerState.isPlaying;

  const getArtistName = (artist: BackingTrack['artist']): string => {
    if (artist && typeof artist === 'object') {
      return artist.artist_name || artist.name || 'Unknown Artist';
    }
    return typeof artist === 'string' ? artist : 'Unknown Artist';
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      setPlayerState({ ...playerState, isPlaying: !playerState.isPlaying });
    } else {
      setPlayerState({
        ...playerState,
        currentTrack: track,
        isPlaying: true,
      });
    }
  };

  return (
    <div
      onClick={handlePlay}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${isCurrentTrack
        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-800'
        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
        }`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
          <Image
            src={image || "/background-placeholder.jpg"}
            alt={track.track_title || track.title || 'Track'}
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized={!!image}
          />
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
            {isPlaying ? (
              <Pause size={14} fill="white" className="text-white" />
            ) : (
              <Play size={14} fill="white" className="text-white ml-0.5" />
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h5 className={`text-sm font-bold truncate ${isCurrentTrack ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-900 dark:text-white'
            }`}>
            {track.track_title || track.title || 'Unknown Track'}
          </h5>
          <p className="text-xs text-zinc-500 truncate">{getArtistName(track.artist)}</p>
        </div>
      </div>
      {isPlaying && (
        <div className="flex items-center space-x-1">
          <div className="w-1 h-3 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0ms', animationDuration: '800ms' }}></div>
          <div className="w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '200ms', animationDuration: '800ms' }}></div>
          <div className="w-1 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '400ms', animationDuration: '800ms' }}></div>
          <div className="w-1 h-5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '600ms', animationDuration: '800ms' }}></div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const router = useRouter();

  // Fetch data
  const { data: highlightedArtists = [], isLoading: highlightedartistsLoading } = useGetHighlightedArtistsQuery();
  const { data: allArtists = [] } = useGetAllArtistsQuery();
  const { data: allTracks = [] } = useGetAllTracksQuery();
  const { data: favorites = [] } = useGetFavoritesQuery();
  const { data: playlists = [] } = useGetPlaylistQuery();

  // Artist images state
  const [artistImages, setArtistImages] = useState<Record<number, string | null>>({});
  const fetchedIdsRef = useRef<Set<number>>(new Set());
  const [artistPage, setArtistPage] = useState(1);
  const [selectedArtistId, setSelectedArtistId] = useState<number | null>(null);
  const artistsPerPage = 8;

  // Fetch artist tracks when an artist is selected
  const { data: artistTracks = [], isLoading: isArtistTracksLoading } = useGetArtistTracksQuery(
    selectedArtistId?.toString() || '',
    { skip: !selectedArtistId }
  );

  // Find selected artist
  const selectedArtist = highlightedArtists.find(artist => artist.id === selectedArtistId);

  // Fetch artist images
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

    highlightedArtists.forEach((a) => fetchImageFor(a.id, a.name ?? null));
  }, [highlightedArtists]);

  // Pagination for artists
  const totalArtistPages = Math.max(1, Math.ceil(highlightedArtists.length / artistsPerPage));
  const currentArtistPage = Math.min(artistPage, totalArtistPages);
  const artistStart = (currentArtistPage - 1) * artistsPerPage;
  const artistEnd = artistStart + artistsPerPage;
  const visibleArtists = highlightedArtists.slice(artistStart, artistEnd);

  const handleArtistPrev = () => setArtistPage((p) => Math.max(1, p - 1));
  const handleArtistNext = () => setArtistPage((p) => Math.min(totalArtistPages, p + 1));

  return (
    <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">
          Welcome Back
        </h1>
        <p className="text-zinc-500 text-sm font-medium">
          Your guitar practice hub
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={<Music2 size={24} />}
          label="Tracks"
          value={allTracks.length}
          onClick={() => router.push('/home/tracks')}
        />
        <StatCard
          icon={<Users size={24} />}
          label="Artists"
          value={allArtists.length}
          onClick={() => router.push('/home/artists')}
        />
        <StatCard
          icon={<Heart size={24} />}
          label="Favorites"
          value={favorites.length}
          onClick={() => router.push('/home/favorites')}
        />
        <StatCard
          icon={<ListMusic size={24} />}
          label="Playlists"
          value={playlists.length}
          onClick={() => router.push('/home/playlists')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Featured Artists */}
        <div>
          {!selectedArtistId ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl mt-5 font-black text-zinc-900 dark:text-white">Featured Artists</h1>
                <button
                  onClick={() => router.push('/home/artists')}
                  className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  View All
                </button>
              </div>

              {highlightedartistsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-md relative">
                      <div className="aspect-[4/5] bg-zinc-200 dark:bg-zinc-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
                        <div className="h-6 w-3/4 bg-zinc-300 dark:bg-zinc-600 rounded mb-2" />
                        <div className="h-4 w-1/2 bg-zinc-300 dark:bg-zinc-600 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : highlightedArtists.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {visibleArtists.map((artist) => {
                      const artistImage = artistImages[artist.id] || null;
                      return (
                        <ArtistCard
                          key={artist.id}
                          artist={artist}
                          image={artistImage}
                          onClick={() => setSelectedArtistId(artist.id)}
                        />
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalArtistPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2 sm:gap-4">
                      <button
                        type="button"
                        onClick={handleArtistPrev}
                        disabled={currentArtistPage === 1}
                        className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <ChevronRight size={14} className="rotate-180 sm:mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      <div className="flex items-center space-x-1 sm:space-x-2">
                        {Array.from({ length: Math.min(3, totalArtistPages) }, (_, i) => {
                          let pageNum;
                          if (totalArtistPages <= 3) {
                            pageNum = i + 1;
                          } else if (currentArtistPage <= 2) {
                            pageNum = i + 1;
                          } else if (currentArtistPage >= totalArtistPages - 1) {
                            pageNum = totalArtistPages - 2 + i;
                          } else {
                            pageNum = currentArtistPage - 1 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setArtistPage(pageNum)}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-110 ${currentArtistPage === pageNum
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
                          {totalArtistPages > 3 && Array.from({ length: Math.min(2, totalArtistPages - 3) }, (_, i) => {
                            let pageNum;
                            if (currentArtistPage <= 2) {
                              pageNum = 4 + i;
                            } else if (currentArtistPage >= totalArtistPages - 1) {
                              return null;
                            } else {
                              pageNum = currentArtistPage + 2 + i;
                            }

                            if (pageNum > totalArtistPages) return null;

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setArtistPage(pageNum)}
                                className={`w-10 h-10 rounded-xl text-sm font-black transition-all duration-200 hover:scale-110 ${currentArtistPage === pageNum
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
                        onClick={handleArtistNext}
                        disabled={currentArtistPage === totalArtistPages}
                        className="inline-flex items-center px-3 sm:px-6 py-2 sm:py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={14} className="sm:ml-2" />
                      </button>
                    </div>
                  )}

                  {/* Page info */}
                  {highlightedArtists.length > 0 && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                        Showing {artistStart + 1}-{Math.min(artistEnd, highlightedArtists.length)} of {highlightedArtists.length} artists
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <Users size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No featured artists yet</p>
                </div>
              )}
            </>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-500">
              <button
                onClick={() => setSelectedArtistId(null)}
                className="flex items-center space-x-2 text-zinc-500 hover:text-indigo-600 font-black uppercase text-xs tracking-widest transition-colors mb-12"
              >
                <ChevronRight size={16} className="rotate-180" />
                <span>Back to featured artists</span>
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
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
                          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : artistTracks && artistTracks.length > 0 ? (
                <div className="space-y-3">
                  {artistTracks.slice(0, 12).map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      image={selectedArtistId ? artistImages[selectedArtistId] : null}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <Music2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">No tracks found for this artist</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}