'use client'

import { useEffect, useState, useRef, useCallback } from "react";
import { Howl } from "howler";
import { Play, Pause, Repeat, ListPlus } from "lucide-react";
import { ImVolumeMute2, ImVolumeLow, ImVolumeMedium, ImVolumeHigh } from "react-icons/im";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from 'sonner';
import { useGetPlaylistQuery, useCreatePlaylistMutation, useAddTrackToPlaylistMutation } from "@/services/api";

type SingleTrack = {
  id: number;
  track_title: string | null;
  track_url: string | null;
  artist?: {
    id: number;
    artist_name: string | null;
    backing_track?: string | null;
  } | null;
} | null;
interface TrackPlayerProps {
  track: SingleTrack;
  isLoading: boolean;
  isError: boolean;
}

type LoopStage = "off" | "startSet" | "endSet";

export default function TrackPlayer({ track, isLoading, isError }: TrackPlayerProps) {
  const howlRef = useRef<Howl | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [lastVolume, setLastVolume] = useState(0.5);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopStage, setLoopStage] = useState<LoopStage>("off");
  const [isFullLoop, setIsFullLoop] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: playlists } = useGetPlaylistQuery(undefined, {
    skip: !open,
  });
  const [createPlaylist] = useCreatePlaylistMutation();
  const [addTrackToPlaylist] = useAddTrackToPlaylistMutation();
  // --- Playlist submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!track?.id) return;

    setIsSaving(true);
    try {
      let playlistId = selectedPlaylistId;

      if (playlistName.trim()) {
        const newPlaylist = await createPlaylist({ name: playlistName }).unwrap();
        playlistId = newPlaylist.id;
      }

      if (!playlistId) return;

      // Add track to playlist
      await addTrackToPlaylist({ playlistId, trackId: track.id }).unwrap();
      toast.success('Track added to playlist');

      setPlaylistName("");
      setSelectedPlaylistId(null);
      setOpen(false);
    } catch (err: unknown) {
      // Check for duplicate entry message from backend
      if (err && typeof err === 'object' && 'data' in err && 
          typeof (err as { data?: { error?: string } }).data === 'object' && 
          (err as { data: { error?: string } }).data.error === "Track already exists in the playlist") {
        toast.info('Track already exists in this playlist');
      } else {
        toast.error('Error adding track to playlist');
        console.error(err);
      }
    } finally {
      setIsSaving(false);
    }
  };
  // --- Playback helpers
  const toggleMute = () => {
    if (volume === 0) {
      setVolume(lastVolume || 0.5);
    } else {
      setLastVolume(volume);
      setVolume(0);
    }
  };
  const formatTime = (sec: number) => {
    if (isNaN(sec)) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  const skip = (delta: number) => {
    if (!howlRef.current) return;
    let newTime = (howlRef.current.seek() as number) + delta;
    newTime = Math.max(0, Math.min(howlRef.current.duration(), newTime));
    seek(newTime);
  };
  const seek = (time: number) => {
    if (!howlRef.current) return;
    let clampedTime = time;
    if (loopA !== null && loopB !== null) {
      if (time < loopA) clampedTime = loopA;
      if (time > loopB) clampedTime = loopB;
    }
    howlRef.current.seek(clampedTime);
    setCurrentTime(clampedTime);
  };
  const changeVolume = (value: number) => {
    setVolume(value);
    howlRef.current?.volume(value);
  };
  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    howlRef.current?.rate(rate);
  };
  const togglePlay = () => {
    if (!howlRef.current) return;
    if (isPlaying) {
      howlRef.current.pause();
      setIsPlaying(false);
    } else {
      if (loopA !== null && loopB !== null && (currentTime < loopA || currentTime > loopB)) {
        seek(loopA);
      }
      howlRef.current.play();
      setIsPlaying(true);
    }
  };
  const handleLoopButton = () => {
    if (loopStage === "off") {
      setLoopA(currentTime);
      setLoopB(null);
      setLoopStage("startSet");
    } else if (loopStage === "startSet") {
      setLoopB(currentTime);
      setLoopStage("endSet");
    } else {
      setLoopA(null);
      setLoopB(null);
      setLoopStage("off");
    }
  };
  const toggleFullLoop = () => {
    if (loopStage === "startSet" || loopStage === "endSet") return;
    setIsFullLoop(prev => !prev);
  };
  const getPercent = useCallback((time: number) => (duration ? (time / duration) * 100 : 0), [duration]);
  const commitSeek = (value: number) => {
    seek(value);
    setSeekValue(null);
    setIsSeeking(false);
  };
  const handleLoopDragStart = (marker: 'A' | 'B') => {
    // Loop drag functionality can be implemented here
    console.log(`Dragging loop marker ${marker}`);
  };

  // Howler init
  useEffect(() => {
    if (!track?.track_url) return;

    // Reset player state when track changes
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoopA(null);
    setLoopB(null);
    setLoopStage("off");

    const src = track.track_url.startsWith("http")
      ? track.track_url
      : `https://guitarbackingtrack.org/wp-content/uploads/${track.track_url}`;

    const sound = new Howl({
      src: [src],
      html5: true,
      volume,
      rate: playbackRate,
      loop: isFullLoop,
      onload: () => {
        setDuration(sound.duration());
        sound.play(); // ✅ start playback once loaded
        setIsPlaying(true);
      },
      onend: () => setIsPlaying(false),
      onloaderror: (id, err) => console.error("Howler load error", err),
      onplayerror: (id, err) => {
        console.error("Howler play error", err);
        // fallback: try to resume after user gesture
        sound.once("unlock", () => sound.play());
      },
    });

    howlRef.current = sound;

    return () => {
      sound.stop();
      sound.unload();
      howlRef.current = null;
    };
  }, [track?.track_url]);

  useEffect(() => { if (howlRef.current) howlRef.current.rate(playbackRate); }, [playbackRate]);
  useEffect(() => { if (howlRef.current) howlRef.current.volume(volume); }, [volume]);
  useEffect(() => { if (howlRef.current) howlRef.current.loop(isFullLoop); }, [isFullLoop]);
  
  // --- Progress updater
  useEffect(() => {
    const id = setInterval(() => {
      if (!howlRef.current || !howlRef.current.playing()) return;

      let pos = howlRef.current.seek() as number;

      // Partial loop (A-B loop)
      if (loopA !== null && loopB !== null && pos >= loopB) {
        howlRef.current.seek(loopA);
        pos = loopA;
      }

      setCurrentTime(pos);
    }, 100);

    return () => clearInterval(id);
  }, [loopA, loopB]);

  return (
    <div>
      <Toaster richColors />
      {isLoading && (
        <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-900 border-t">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading track...</span>
          </div>
        </div>
      )}
      {isError && (
        <div className="flex items-center justify-center p-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <span className="text-sm text-red-600 dark:text-red-400">Failed to load track</span>
        </div>
      )}
      {track && (
        <div className="w-full bg-white dark:bg-[#0A0A0A] border-t border-gray-200 dark:border-gray-800 shadow-lg">
          <div className="px-3 sm:px-4 py-3">
            {/* Progress Bar */}
            <div className="relative mb-3 flex justify-center">
              <div className="w-full sm:w-3/4 lg:w-1/2 flex items-center gap-2">
                {/* Left time (current) */}
                <span className="text-sm text-gray-500 w-12 text-right">
                  {formatTime(currentTime)}
                </span>
                {/* Progress bar */}
                <div className="relative flex-1">
                  <Slider
                    value={[isSeeking && seekValue !== null ? seekValue : currentTime]}
                    min={0}
                    max={duration || 0}
                    step={0.01}
                    onValueChange={(val) => {
                      if (!isSeeking) setIsSeeking(true);
                      setSeekValue(val[0]);
                    }}
                    onValueCommit={(val) => commitSeek(val[0])}
                    className="w-full
                      [&_[role=slider]]:h-4
                      [&_[role=slider]]:w-4
                      [&_[role=slider]]:rounded-full
                      [&_[role=slider]]:shadow-md
                      [&_[role=slider]]:border-2
                      [&_[role=slider]]:border-blue-500
                      [&_[role=slider]]:bg-white
                      dark:[&_[role=slider]]:bg-gray-100
                      [&_[role=slider]]:transition-all
                      [&_[role=slider]]:hover:scale-110
                      [&_[role=slider]]:cursor-grab
                      [&_.slider-track]:h-2
                      [&_.slider-track]:bg-gray-300
                      dark:[&_.slider-track]:bg-gray-700
                      [&_.slider-track]:rounded-full
                      [&_.slider-range]:h-full
                      [&_.slider-range]:bg-gradient-to-r
                      [&_.slider-range]:from-blue-500
                      [&_.slider-range]:to-blue-600
                      [&_.slider-range]:rounded-full"
                  />
                  {/* AB Loop Gradient */}
                  {loopA !== null && loopB !== null && (
                    <div
                      className="absolute top-1/2 rounded-full pointer-events-none"
                      style={{
                        transform: "translateY(-50%)",
                        left: `${getPercent(loopA)}%`,
                        width: `${getPercent(loopB) - getPercent(loopA)}%`,
                        background:
                          "linear-gradient(to right, rgba(16,185,129,0.8), rgba(234,179,8,0.8))",
                        zIndex: 0,
                        height: "0.5rem",
                      }}
                    />
                  )}
                  {/* Loop A Marker */}
                  {loopA !== null && (
                    <div
                      className="absolute flex flex-col items-center pointer-events-auto"
                      style={{
                        left: `${getPercent(loopA)}%`,
                        zIndex: 2,
                        transform: "translateX(-50%)",
                        bottom: "100%",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span className="mb-1 px-1.5 py-0.5 text-xs font-bold rounded bg-green-500 text-white shadow-sm">
                        A
                      </span>
                      <div
                        className="w-2 h-5 bg-green-500 rounded-full cursor-grab hover:bg-green-600 transition-colors shadow-sm"
                        onMouseDown={() => handleLoopDragStart("A")}
                        onTouchStart={() => handleLoopDragStart("A")}
                      />
                    </div>
                  )}
                  {/* Loop B Marker */}
                  {loopB !== null && (
                    <div
                      className="absolute flex flex-col items-center pointer-events-auto"
                      style={{
                        left: `${getPercent(loopB)}%`,
                        zIndex: 2,
                        transform: "translateX(-50%)",
                        bottom: "100%",
                        marginBottom: "0.25rem",
                      }}
                    >
                      <span className="mb-1 px-1.5 py-0.5 text-xs font-bold rounded bg-yellow-500 text-white shadow-sm">
                        B
                      </span>
                      <div
                        className="w-2 h-5 bg-yellow-500 rounded-full cursor-grab hover:bg-yellow-600 transition-colors shadow-sm"
                        onMouseDown={() => handleLoopDragStart("B")}
                        onTouchStart={() => handleLoopDragStart("B")}
                      />
                    </div>
                  )}
                </div>
                {/* Right time (duration) */}
                <span className="text-sm text-gray-500 w-12 text-left">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
            {/* Main Control Section */}
            <div className="flex flex-col items-center sm:items-stretch sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Left Track Info */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Track Info Row */}
                <div className="flex justify-center sm:justify-start items-center gap-2 sm:gap-3">
                  <div className="min-w-0 text-center sm:text-left">
                    <h2 className="text-gray-900 dark:text-white text-sm sm:text-base font-semibold truncate">
                      {track?.track_title || "Unknown Track"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm truncate">
                      {track?.artist?.artist_name || "Unknown Artist"}
                    </p>
                  </div>
                </div>
              </div>
              {/* Center Controls */}
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={handleLoopButton}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all
                    ${
                      loopStage === "off"
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        : loopStage === "startSet"
                        ? "bg-green-500 text-white shadow-md hover:bg-green-600"
                        : "bg-yellow-500 text-white shadow-md hover:bg-yellow-600"
                    }`}
                >
                  AB
                </button>

                <button
                  type="button"
                  onClick={() => skip(-5)}
                  aria-label="Rewind 5 seconds"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    className="sm:w-6 sm:h-6"
                  >
                    <path
                      d="M6.492 16.95c2.861 2.733 7.5 2.733 10.362 0 2.861-2.734 2.861-7.166 0-9.9-2.862-2.733-7.501-2.733-10.362 0A7.096 7.096 0 0 0 5.5 8.226"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M5 5v3.111c0 .491.398.889.889.889H9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  onClick={togglePlay}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button
                  type="button"
                  onClick={() => skip(5)}
                  aria-label="Forward 5 seconds"
                  className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    className="sm:w-6 sm:h-6"
                  >
                    <path
                      d="M17.508 16.95c-2.861 2.733-7.5 2.733-10.362 0-2.861-2.734-2.861-7.166 0-9.9 2.861-2.733 7.5-2.733 10.362 0A7.096 7.096 0 0 1 18.5 8.226"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M19 5v3.111c0 .491-.398.889-.889.889H15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button
                  onClick={toggleFullLoop}
                  className={`p-2 rounded-full transition-all ${
                    isFullLoop
                      ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title={isFullLoop ? "Full Track Loop ON" : "Full Track Loop OFF"}
                >
                  <Repeat size={16} />
                </button>
              </div>
              {/* Right Controls */}
              <div className="flex justify-center sm:justify-end items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {volume === 0 ? (
                    <ImVolumeMute2 size={16} className="text-gray-600"/>
                  ) : volume < 0.3 ? (
                    <ImVolumeLow size={16} className="text-gray-600"/>
                  ) : volume < 0.7 ? (
                    <ImVolumeMedium size={16} className="text-gray-600"/>
                  ) : (
                    <ImVolumeHigh size={16} className="text-gray-600"/>
                  )}
                </button>
                <div className="w-16 sm:w-24">
                  <Slider
                    value={[volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(val) => changeVolume(val[0])}
                    onValueCommit={(val) => changeVolume(val[0])}
                    className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:rounded-full [&_[role=slider]]:shadow-md [&_[role=slider]]:border-2 [&_[role=slider]]:border-blue-500 [&_[role=slider]]:bg-white dark:[&_[role=slider]]:bg-gray-100 [&_[role=slider]]:transition-all [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:cursor-grab [&_.slider-track]:h-1.5 [&_.slider-track]:bg-gray-300 dark:[&_.slider-track]:bg-gray-700 [&_.slider-track]:rounded-full [&_.slider-range]:h-full [&_.slider-range]:bg-gradient-to-r [&_.slider-range]:from-blue-500 [&_.slider-range]:to-blue-600 [&_.slider-range]:rounded-full"
                  />
                </div>
                <Select
                  value={String(playbackRate)}
                  onValueChange={(val) => changeSpeed(Number(val))}
                >
                  <SelectTrigger className="w-16 h-8 text-xs border hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <SelectItem key={speed} value={String(speed)}>
                        {speed}x
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Playlist Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 px-2 sm:px-3 h-8 text-xs border hover:border-blue-400 dark:hover:border-blue-500 hover:bg-transparent dark:hover:bg-transparent transition-colors"
                  >
                    <ListPlus className="w-4 h-4" />
                  </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[90vw] max-w-[400px] sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle className="text-base sm:text-lg">
                          Add To Playlist
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-3 sm:gap-4">
                        <div className="grid gap-2 sm:gap-3">
                          <Label
                            htmlFor="playlistName"
                            className="text-xs sm:text-sm"
                          >
                            Playlist Name
                          </Label>
                          <Input
                            id="playlistName"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            placeholder="Enter new playlist name"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div className="grid gap-2 sm:gap-3">
                          <Label className="text-xs sm:text-sm">
                            Choose Playlist
                          </Label>
                          {isLoading && (
                            <p className="text-xs sm:text-sm text-gray-500">
                              Loading...
                            </p>
                          )}
                          {playlists?.length ? (
                            <ul className="space-y-1 sm:space-y-2">
                              {playlists.map((pl) => (
                                <li key={pl.id}>
                                  <label className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                                    <input
                                      type="radio"
                                      name="playlist"
                                      value={pl.id}
                                      checked={selectedPlaylistId === pl.id}
                                      onChange={() =>
                                        setSelectedPlaylistId(pl.id)
                                      }
                                    />
                                    {pl.name}
                                  </label>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            !isLoading && (
                              <p className="text-xs sm:text-sm text-gray-500">
                                No playlists found
                              </p>
                            )
                          )}
                        </div>
                      </div>
                      <DialogFooter className="mt-3 sm:mt-4">
                        <DialogClose asChild>
                          <Button variant="outline" className="text-xs sm:text-sm">
                            Cancel
                          </Button>
                        </DialogClose>
                        <Button
                          type="submit"
                          className="text-xs sm:text-sm flex items-center gap-2"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <span className="loading-spinner w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></span>
                              Saving...
                            </>
                          ) : (
                            "Save changes"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}