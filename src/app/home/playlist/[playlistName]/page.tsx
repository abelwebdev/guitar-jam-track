"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useGetPlaylistTracksQuery, useGetSingleTrackQuery, useRemoveTracksFromPlaylistMutation } from "@/services/api";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { Play, Pause, Music, MoreHorizontal, Trash2, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TrackPlayer from "../../track/[trackName]/components/TrackPlayer";
import { useState } from "react";
import { toast, Toaster } from "sonner";

type BackingTrack = {
  id: number;
  artist_id: number | null;
  track_title: string | null;
  track_url: string | null;
  artist?: {
    id: number;
    artist_name: string | null;
  } | null;
};

export default function PlaylistTracks() {
  const searchParams = useSearchParams();
  const params = useParams<{ playlistName: string }>();
  const playlistName = params?.playlistName;
  const displayPlaylistName = playlistName ? decodeURIComponent(playlistName) : "";
  const router = useRouter();
  const idParam = searchParams.get("id");
  const id = idParam ? Number(idParam) : undefined;

  const { data: tracks, error, isLoading, refetch } = useGetPlaylistTracksQuery(
    id ? { id } : skipToken
  );
  const [currentTrackId, setCurrentTrackId] = useState<number | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<BackingTrack | null>(null);

  // Fetch the current track details for the player
  const { data: currentTrack, isLoading: trackLoading, error: trackError } = useGetSingleTrackQuery(
    currentTrackId ? String(currentTrackId) : skipToken
  );
  // Delete mutation
  const [removeTracksFromPlaylist, { isLoading: isDeleting }] = useRemoveTracksFromPlaylistMutation();

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
  const handleDeleteTrack = async () => {
    if (!trackToDelete || !id) return;

    try {
      await removeTracksFromPlaylist({
        playlistId: id,
        trackIds: [trackToDelete.id]
      }).unwrap();

      // Refetch the playlist tracks to update the UI
      await refetch();

      toast.success('Track removed from playlist');
      
      // If the deleted track was playing, stop it
      if (playingTrackId === trackToDelete.id) {
        setPlayingTrackId(null);
        setCurrentTrackId(null);
      }
      
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
    } catch (error) {
      toast.error('Failed to remove track from playlist');
      console.error('Delete error:', error);
    }
  };
  const openDeleteDialog = (track: BackingTrack) => {
    setTrackToDelete(track);
    setDeleteDialogOpen(true);
  };
  const viewArtistPage = (track: BackingTrack) => {
    if (track.artist?.id) {
      router.push(
        `/home/artist/${track.artist.artist_name?.replace(/\s+/g, "_")}?id=${track.artist.id}`
      );
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
          <Separator />
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    const errormsg = (error as { data?: { error?: string } })?.data?.error || "Unable to load playlist tracks. Please try again later.";

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <Music className="h-12 w-12 mx-auto text-gray-400 mb-4" />

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>

          <p className="text-gray-600 dark:text-gray-400">
            {errormsg}
          </p>
        </Card>
      </div>
    );
  }


  return (
    <TooltipProvider>
      <Toaster richColors />
      <div className="px-4 max-w-4xl mx-auto pb-28 sm:pb-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {displayPlaylistName} playlist
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {tracks?.length || 0} tracks
          </p>
        </div>

        {tracks && tracks.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
            {/* Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/50">
              <div className="col-span-9">Track</div>
              <div className="col-span-3 text-right"></div>
            </div>

            {/* Track List */}
            <div className="divide-y divide-border">
              {tracks.map((track) => {
                const isPlaying = playingTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`group grid grid-cols-12 gap-4 items-center px-5 py-3 cursor-pointer transition-all
                      `}
                    onClick={() => handlePlayTrack(track)}
                  >
                    {/* Track Info + Play */}
                    <div className="col-span-11 md:col-span-9 flex items-center gap-3 min-w-0">
                      {/* Play/Pause */}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayTrack(track);
                        }}
                        className={`flex-shrink-0 transition-colors ${
                          isPlaying
                            ? "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            : "text-foreground/70 hover:text-foreground"
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Track Text */}
                      <div className="flex flex-col min-w-0">
                        <span
                          className={`truncate font-medium ${
                            isPlaying
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-foreground"
                          }`}
                        >
                          {track.track_title || "Untitled Track"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {track.artist?.artist_name || "Unknown Artist"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 md:col-span-3 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            className="text-foreground/70 hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-44 rounded-xl border border-border bg-background shadow-md"
                        >
                          <DropdownMenuItem asChild disabled={!track.track_url}>
                            <a
                              href={`/api/download?url=${encodeURIComponent(
                                `https://guitarbackingtrack.org/wp-content/uploads/${track.track_url}`
                              )}`}
                              download
                              onClick={(e) => {
                                if (!track.track_url) e.preventDefault();
                                e.stopPropagation();
                              }}
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4 text-muted-foreground" />
                              <span>Download</span>
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              viewArtistPage(track);
                            }}
                            disabled={!track.artist?.id}
                            className="cursor-pointer"
                          >
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            View Artist
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(track);
                            }}
                            className="group cursor-pointer transition-colors data-[highlighted]:text-red-600 dark:data-[highlighted]:text-red-400"
                          >
                            <Trash2 className="text-gray-500 dark:text-gray-400 group-data-[highlighted]:text-red-600 group-data-[highlighted]:dark:text-red-400 transition-colors mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Music className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No tracks in this playlist
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add some tracks to start listening.
            </p>
          </Card>
        )}

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

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                Remove Track
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove &quot;{trackToDelete?.track_title || 'this track'}&quot; from the playlist?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setTrackToDelete(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTrack}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Remove Track
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}