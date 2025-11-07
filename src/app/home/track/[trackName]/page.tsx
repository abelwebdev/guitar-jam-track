'use client'

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGetSingleTrackQuery, useGetTracksByArtistQuery } from "@/services/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import TrackPlayer from "./components/TrackPlayer";
import { Card } from "@/components/ui/card";
import { Play, Pause, Music, Download, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type UiTrack = {
  id: number;
  track_title: string | null;
  track_url: string | null;
  artist?: {
    id: number;
    artist_name: string | null;
    backing_track?: string | null;
  } | null;
};

export default function TrackPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") ?? "";
  const { data: track } = useGetSingleTrackQuery(idParam ? String(idParam) : skipToken);
  const { data: tracks, isLoading: isArtistTracksLoading, isError: isArtisttracksError } = useGetTracksByArtistQuery(idParam);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<UiTrack | null>(null);

  const handlePlayTrack = (track: UiTrack) => {
    if (currentTrack?.id === track.id) {
      // pause if same track
      setCurrentTrack(null);
      setPlayingTrackId(null);
    } else {
      // play new track
      setCurrentTrack(track);
      setPlayingTrackId(track.id);
    }
  };
  useEffect(() => {
    if (track) {
      setCurrentTrack({
        id: track.id,
        track_title: track.track_title ?? null,
        track_url: track.track_url ?? null,
        artist: track.artist ?? null,
      });
      setPlayingTrackId(track.id);
    }
  }, [track]);

  const tracksLength = tracks?.length ?? 0;

  return (
    <div className="px-4 max-w-4xl mx-auto pb-28 sm:pb-0">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {track?.artist?.artist_name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {tracksLength} {tracksLength === 1 ? "track" : "tracks"}
        </p>
      </div>
      {isArtistTracksLoading ? (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-[#101010] border-t">
          <div className="flex flex-col items-center gap-3">
            {/* Spinner */}
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

            {/* Loading text */}
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading tracks...</span>
          </div>
        </div>
      ) : isArtisttracksError ? (
        <div className="text-red-500 text-center py-6">
          Something went wrong while loading tracks.
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
            <div className="col-span-9 ml-2">Track</div>
            <div className="col-span-3 text-right"></div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 mr-2">
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`group grid grid-cols-12 gap-4 items-center px-5 py-3 text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer`}
                onClick={() => handlePlayTrack(track)}
              >
                {/* Track Info */}
                <div className="col-span-11 md:col-span-9 flex items-center gap-3">
                  {/* Play / Pause Button */}
                  {currentTrack?.id === track.id ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track);
                      }}
                      className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track);
                      }}
                      className="flex-shrink-0"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Track Title & Artist */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`font-medium truncate ${
                        playingTrackId === track.id
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {track.track_title || "Untitled Track"}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {track.artist?.artist_name || "Unknown Artist"}
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="col-span-1 md:col-span-3 flex items-center justify-end gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="flex-shrink-0"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem asChild disabled={!track.track_url}>
                        <a
                          href={`/api/download?url=${encodeURIComponent(
                            `https://guitarbackingtrack.org/wp-content/uploads/${track.track_url}`
                          )}`}
                          download
                          onClick={(e) => {
                            if (!track.track_url) e.preventDefault();
                          }}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Music className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tracks found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This playlist doesn&apos;t have any tracks yet.
          </p>
        </Card>
      )}
      {track && (
        <div className="rounded-xl shadow-md overflow-hidden">
          {/* Sticky TrackPlayer at the bottom */}
          {currentTrack && (
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <div className="max-w-full">
                <TrackPlayer
                  track={currentTrack}
                  isLoading={false}
                  isError={false}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}