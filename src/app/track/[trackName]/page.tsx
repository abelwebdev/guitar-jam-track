'use client'

import Header from "@/components/Header"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useGetSingleTrackQuery } from "@/services/api";
import { Play, Music } from "lucide-react";

type LocalBackingTrack = {
  id: number;
  artist_id: number | null;
  track_title: string | null;
  track_url: string | null;
  artist?: {
    id: number;
    artist_name: string | null;
  } | null;
};

export default function TrackPage() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") ?? "";
  const { data: track, isLoading, isError } = useGetSingleTrackQuery(idParam);
  const [artistImage, setArtistImage] = useState<string | null>(null);
  const [artistBio, setArtistBio] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState(track);
  const router = useRouter();

  const handleTrackSelect = (otherTrack: LocalBackingTrack) => {
    setCurrentTrack({
      ...otherTrack,
      artist: track?.artist,
    });
    router.push(`?id=${otherTrack.id}`);
  };
  
  useEffect(() => {
    if (track) {
      setCurrentTrack(track);
    }
  }, [track]);
    
  useEffect(() => {
    const artistName = track?.artist?.artist_name;
    if (!artistName) return;
    const formattedName = artistName.trim() //.replace(/\s+/g, "-");
    fetch(
      `https://www.theaudiodb.com/api/v1/json/123/search.php?s=${encodeURIComponent(
        formattedName
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        const img =
          data?.artists && Array.isArray(data.artists)
            ? data.artists[0]?.strArtistThumb
            : null;
        setArtistImage(img);

        const bio = 
          data?.artists && Array.isArray(data.artists)
            ? data.artists[0]?.strBiographyEN
            : null;

        const trimmed = bio.slice(0, 450);
        const lastFullStop = trimmed.lastIndexOf(".");
        const formattedBio = lastFullStop !== -1 ? trimmed.slice(0, lastFullStop + 1) : trimmed;
        setArtistBio(formattedBio);
      })
      .catch(
        () => setArtistImage("")
      );
  }, [track?.artist?.artist_name]);

  return (
    <>
      <Header />
      {/* Main content */}
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        
        <div className="w-full max-w-4xl space-y-6">
          {isLoading && (
            <div className="rounded-xl border shadow-md overflow-hidden bg-white dark:bg-gray-900 animate-pulse">
              {/* Skeleton layout */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6">
                <div className="w-[300px] h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg shadow" />
                <div className="flex-1 space-y-4 w-full">
                  <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded mt-4" />
                </div>
              </div>
              <div className="p-6 border-t dark:border-gray-700">
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
              </div>
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center h-60 text-red-500">
              Something went wrong. Please try again.
            </div>
          )}
          {track && (
            <div className="flex flex-col items-center dark:bg-gray-900 p-4 sm:p-0 pt-28">
              <div className="rounded-xl border shadow-md overflow-hidden bg-white dark:bg-gray-900 w-full">
                {/* Artist Image + Track Info */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6">
                  {artistImage && (
                    <Image
                      src={artistImage}
                      alt=""
                      width={300}
                      height={300}
                      className="rounded-lg object-cover shadow"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentTrack?.track_title}
                    </h1>
                    <h2 className="text-lg text-gray-600 dark:text-gray-400">
                      {track?.artist?.artist_name}
                    </h2>
                    <p className="text-gray-800 dark:text-gray-200 text-base md:text-lg leading-relaxed mt-4">
                      {artistBio}
                    </p>
                  </div>
                </div>
                {/* Audio Player + Download */}
                <div className="p-6 border-t dark:border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {currentTrack?.track_url ? (
                    <>
                      <audio
                        controls
                        key={currentTrack.id}
                        className="w-full md:w-[70%] lg:w-[75%] rounded-md"
                      >
                        <source
                          src={`https://guitarbackingtrack.org/wp-content/uploads/${currentTrack.track_url}`}
                        />
                        Your browser does not support the audio element.
                      </audio>
                      <div className="w-full md:w-auto flex justify-center md:justify-start">
                        <a
                          href={`/api/download?url=${encodeURIComponent(
                            `https://guitarbackingtrack.org/wp-content/uploads/${currentTrack.track_url}`
                          )}`}
                          className="inline-flex items-center gap-2 px-5 py-2 text-[15px] font-semibold text-white bg-blue-500 rounded-lg shadow-md transition-all duration-200 hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        >
                          Download
                        </a>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 dark:text-gray-300">
                      No audio preview available.
                    </div>
                  )}
                </div>
                {/* Other Tracks */}
                {Array.isArray(track?.artist?.backing_track) && track.artist.backing_track.length > 0 && (
                  <div className="p-6 border-t dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      More backing tracks by {track?.artist?.artist_name}
                    </h3>
                    <ul className="space-y-3">
                      {track.artist.backing_track
                        .filter((t): t is LocalBackingTrack => typeof t === 'object' && t !== null && 'id' in t)
                        .map((otherTrack) => {
                          const isPlaying = currentTrack?.id === otherTrack.id;
                          return (
                            <li key={otherTrack.id}>
                              <button
                                onClick={() => handleTrackSelect(otherTrack)}
                                className={`w-full flex items-center gap-3 text-left px-4 py-2 rounded-md transition ${
                                  isPlaying
                                    ? "bg-blue-500 text-white font-semibold shadow-md"
                                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200"
                                }`}
                              >
                                {isPlaying ? (
                                  <Play className="w-5 h-5" />
                                ) : (
                                  <Music className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                )}
                                <span>{otherTrack.track_title}</span>
                              </button>
                            </li>
                          );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}