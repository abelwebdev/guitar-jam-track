"use client";

import {
  useGetPlaylistQuery,
  useDeletePlaylistMutation,
  useUpdatePlaylistMutation,
  useGetPlaylistTracksQuery,
  useRemoveTracksFromPlaylistMutation,
  useCreatePlaylistMutation,
} from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MoreVertical, Edit, Trash, Music } from "lucide-react";
import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast, Toaster } from "sonner";

interface PlaylistItem {
  id: number;
  name: string;
  trackCount: number;
}

export default function Playlist() {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editPlaylist, setEditPlaylist] = useState<PlaylistItem | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newPlaylistName, setNewPlaylistName] = useState<string>("");

  const { data: playlists, isError, isLoading, refetch } = useGetPlaylistQuery();
  const { data: playlistTracks, isFetching: tracksLoading } = useGetPlaylistTracksQuery(
    editPlaylist ? { id: editPlaylist.id } : skipToken
  );

  const [deletePlaylist] = useDeletePlaylistMutation();
  const [updatePlaylist] = useUpdatePlaylistMutation();
  const [removeTracksFromPlaylist] = useRemoveTracksFromPlaylistMutation();
  const [createPlaylist, { isLoading: isCreating }] = useCreatePlaylistMutation();

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlaylistName.trim();
    if (!name) return;
    try {
      const created = await createPlaylist({ name }).unwrap();
      toast.success("Playlist created");
      setCreateDialogOpen(false);
      setNewPlaylistName("");
      if (created?.id) {
        await refetch();
      }
    } catch (err) {
      console.error("Create playlist failed:", err);
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || "Failed to create playlist");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white dark:bg-[#101010] border-t">
        <div className="flex flex-col items-center gap-3">
          {/* Spinner */}
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          {/* Loading text */}
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading playlists...</span>
        </div>
      </div>
    );
  }

  const handleEdit = (playlist: PlaylistItem) => {
    setEditPlaylist(playlist);
    setNewName(playlist.name);
    setSelectedTracks([]);
  };
  const handleSaveChanges = async () => {
    if (!editPlaylist) return;

    if (!newName.trim() && selectedTracks.length === 0) {
      toast.info("No changes to save");
      return;
    }
    setIsSaving(true);
    try {
      if (newName.trim() && newName !== editPlaylist.name) {
        await updatePlaylist({
          id: editPlaylist.id,
          name: newName.trim(),
        }).unwrap();
      }
      if (selectedTracks.length > 0) {
        await removeTracksFromPlaylist({
          playlistId: editPlaylist.id,
          trackIds: selectedTracks,
        }).unwrap();
      }
      await refetch();
      toast.success("Playlist updated successfully!");
      setEditPlaylist(null);
      setSelectedTracks([]);
      setNewName("");
    } catch (err: unknown) {
      console.error("Update failed:", err);
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || "Failed to update playlist");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await deletePlaylist(id).unwrap();
      toast.success("Playlist deleted successfully!");
      setDeleteId(null);
      refetch();
    } catch (err: unknown) {
      console.error("Delete failed:", err);
      const error = err as { data?: { error?: string } };
      toast.error(error?.data?.error || "Failed to delete playlist");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="px-6  dark:text-white">
      <Toaster richColors />
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <Button onClick={() => setCreateDialogOpen(true)} className="font-semibold">
          Create Playlist
        </Button>
      </div>
      {/* PLAYLIST CARDS OR EMPTY STATE */}
      {playlists && playlists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {playlists.map((item: PlaylistItem) => (
            <Card
              key={item.id}
              className="hover:shadow-lg transition-shadow bg-gradient-to-br from-slate-800 to-slate-900 text-white cursor-pointer"
              onClick={() =>
                router.push(`/home/playlist/${encodeURIComponent(item.name)}?id=${item.id}`)
              }
            >
              <CardHeader className="p-0 relative">
                <div className="h-48 rounded-t-2xl"></div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full hover:bg-grey-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(item.id);
                        }}
                        className="group cursor-pointer transition-colors data-[highlighted]:text-red-600 dark:data-[highlighted]:text-red-400"
                      >
                        <Trash className="text-gray-500 dark:text-gray-400 group-data-[highlighted]:text-red-600 group-data-[highlighted]:dark:text-red-400 transition-colors mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-xl font-semibold line-clamp-1">
                  {item.name}
                </CardTitle>
                <p className="text-sm text-slate-300">
                  {item.trackCount} {item.trackCount === 1 ? "track" : "tracks"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Music className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No playlists yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first playlist to start organizing tracks.
          </p>

        </Card>
      )}
      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete the playlist
              and all its tracks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="hover:bg-red-700 flex items-center gap-2"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* EDIT DIALOG */}
      <Dialog open={!!editPlaylist} onOpenChange={() => setEditPlaylist(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Playlist Name */}
            <div>
              <label className="text-sm font-medium">Playlist Name</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new playlist name"
                className="mt-1"
              />
            </div>

            {/* Tracks List */}
            <div>
              <p className="text-sm font-medium mb-2">Tracks</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {tracksLoading ? (
                  <p className="text-slate-400 text-sm animate-pulse">Loading tracks...</p>
                ) : playlistTracks && playlistTracks.length > 0 ? (
                  playlistTracks
                    .filter((track) => !selectedTracks.includes(track.id))
                    .map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-gray-100"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {track.track_title || "Untitled Track"}
                          </span>
                          {track.artist?.artist_name && (
                            <span className="text-xs text-slate-400">
                              {track.artist.artist_name}
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-transparent"
                          onClick={() =>
                            setSelectedTracks((prev) => [...prev, track.id])
                          }
                        >
                          <Trash />
                        </Button>
                      </div>
                    ))
                ) : (
                  <p className="text-slate-400 text-sm">No tracks in this playlist.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlaylist(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE PLAYLIST DIALOG */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Playlist</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Playlist Name</label>
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="My Awesome Playlist"
                className="mt-1"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || !newPlaylistName.trim()} className="font-semibold">
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}