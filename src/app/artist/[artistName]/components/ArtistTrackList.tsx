"use client";

import Link from "next/link";

export type BackingTrack = {
  id: number;
  track_title: string | null;
  track_url: string | null;
};

export default function ArtistTrackList({ tracks, artist }: { tracks: BackingTrack[] | null, artist: string }) {
  return (
    <>
      {!tracks || tracks.length === 0 ? (
        <div className="text-center text-slate-500 dark:text-gray-300 py-8">
          No tracks found for this artist.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {tracks.map((track) => (
            <Link href={`/track/${(track.track_title ?? "").replace(/\s+/g, "_")}?id=${track.id}`} key={track.id}>
              <li className="rounded-lg border p-4 hover:shadow-sm transition-shadow bg-white dark:bg-gray-800">
                <div className="font-medium text-black dark:text-white mb-2">
                  {track.track_title ?? "Untitled Track"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {artist}
                </div>
              </li>
            </Link>
          ))}
        </ul>
      )}
    </>
  );
}
