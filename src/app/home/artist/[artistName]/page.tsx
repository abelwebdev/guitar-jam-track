"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useGetSingleTrackQuery, useGetArtistTracksQuery } from "@/services/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import TrackPlayer from "../../track/[trackName]/components/TrackPlayer";
import { Card } from "@/components/ui/card";
import { Play, Pause, Music, Download, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export type BackingTrack = {
  id: number;
  track_title: string | null;
  track_url: string | null;
};

export default function ArtistTrackList() {
  const params = useParams();
  const searchParams = useSearchParams();
  const artistName = decodeURIComponent((params.artistName as string) ?? "").replace(/_/g, " ");
  const artistId = searchParams.get("id") ?? "";
  const { data: tracks, isLoading: isArtistLoading } = useGetArtistTracksQuery(artistId);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);

  const { data: currentTrack, isLoading: trackLoading, error: trackError } = useGetSingleTrackQuery(
    currentTrackId ? String(currentTrackId) : skipToken
  );
  const handlePlayTrack = (track: BackingTrack) => {
    if (playingTrackId === track.id) {
      // If same track is playing, pause it
      setPlayingTrackId(null);
      setCurrentTrackId(null);
    } else {
      // Play new track
      setCurrentTrackId(track.id);
      setPlayingTrackId(track.id);
    }
  };

    const tracksLength = tracks?.length ?? 0;
  
  return (
    <div>
      <section className="px-4 max-w-4xl mx-auto pb-28 sm:pb-0">
        {isArtistLoading ? (
          <div className="flex items-center justify-center h-64 bg-white dark:bg-[#101010] border-t">
            <div className="flex flex-col items-center gap-3">
              {/* Spinner */}
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>

              {/* Loading text */}
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading tracks...</span>
            </div>
          </div>
        ) : tracks && tracks.length > 0 ? (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {artistName}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {tracksLength} {tracksLength === 1 ? "track" : "tracks"}
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                <div className="col-span-9 ml-2">Track</div>
                <div className="col-span-3 text-right"></div>
              </div>

              {/* Track List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className={`group grid grid-cols-12 gap-4 items-center px-5 py-3 text-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer`}
                    onClick={() => handlePlayTrack(track)}
                  >
                    <div className="col-span-11 md:col-span-9 flex items-center gap-3">
                      {/* Play / Pause Button */}
                      {playingTrackId === track.id ? (
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

                      {/* Track Info */}
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
                          {artistName || "Unknown Artist"}
                        </span>
                      </div>
                    </div>
                  {/* Actions */}
                  <div className="col-span-1 md:col-span-3 justify-self-end flex items-center justify-end gap-2">
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
          </>
        ) : (
          // No Tracks Found
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
      </section>
      {/* Fixed Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
          <div className="max-w-full">
            <TrackPlayer 
              track={currentTrack} 
              isLoading={trackLoading}
              isError={!!trackError}
            />
          </div>
        </div>
      )}
    </div>
  );
}
