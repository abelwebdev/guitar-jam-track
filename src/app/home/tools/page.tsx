'use client'

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Search,
  Music2,
  Mic2,
  Settings,
  History,
  Heart,
  Clock,
  ListMusic,
  Gauge,
  Repeat,
  Info,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Users,
  Library,
  Disc,
  Star,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  Save,
  User as UserIcon,
  ChevronDown,
  Menu,
  ChevronUp,
  Wrench,
  Fingerprint,
  Hash,
  Zap,
  Grid,
  Anchor,
  Moon,
  Sun,
  FolderPlus,
  Music,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  Lightbulb,
  Share2,
} from "lucide-react";
import {
  BackingTrack,
  PlayerState,
  TheoryInsight,
  User,
  Playlist,
} from "../../../types/types";

type DashboardView =
  | "home"
  | "artists"
  | "tracks"
  | "playlists"
  | "favorites"
  | "tools";
type ToolTab = "metronome" | "tuner" | "chord-library" | "scales";

const ITEMS_PER_PAGE = 10;
const ARTISTS_PER_PAGE = 12;

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const CHORD_VARIATIONS = ["Maj", "Min", "7", "Maj7", "m7", "sus2", "sus4"];
const SCALES_DATA: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  "Maj Pentatonic": [0, 2, 4, 7, 9],
  "Min Pentatonic": [0, 3, 5, 7, 10],
  Blues: [0, 3, 5, 6, 7, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const CHORD_DATA: Record<string, Record<string, number[]>> = {
  C: {
    Maj: [-1, 3, 2, 0, 1, 0],
    Min: [-1, 3, 5, 5, 4, 3],
    "7": [-1, 3, 2, 3, 1, 0],
    Maj7: [-1, 3, 2, 0, 0, 0],
    m7: [-1, 3, 5, 3, 4, 3],
    sus2: [-1, 3, 0, 0, 1, -1],
    sus4: [-1, 3, 3, 0, 1, 1],
  },
  D: {
    Maj: [-1, -1, 0, 2, 3, 2],
    Min: [-1, -1, 0, 2, 3, 1],
    "7": [-1, -1, 0, 2, 1, 2],
    Maj7: [-1, -1, 0, 2, 2, 2],
    m7: [-1, -1, 0, 2, 1, 1],
    sus2: [-1, -1, 0, 2, 3, 0],
    sus4: [-1, -1, 0, 2, 3, 3],
  },
  E: {
    Maj: [0, 2, 2, 1, 0, 0],
    Min: [0, 2, 2, 0, 0, 0],
    "7": [0, 2, 0, 1, 0, 0],
    Maj7: [0, 2, 1, 1, 0, 0],
    m7: [0, 2, 0, 0, 0, 0],
    sus2: [0, 2, 2, 4, 0, 0],
    sus4: [0, 2, 2, 2, 0, 0],
  },
  F: {
    Maj: [1, 3, 3, 2, 1, 1],
    Min: [1, 3, 3, 1, 1, 1],
    "7": [1, 3, 1, 2, 1, 1],
    Maj7: [-1, -1, 3, 2, 1, 0],
    m7: [1, 3, 1, 1, 1, 1],
    sus2: [1, 3, 3, 0, 1, 1],
    sus4: [1, 3, 3, 3, 1, 1],
  },
  G: {
    Maj: [3, 2, 0, 0, 0, 3],
    Min: [3, 5, 5, 3, 3, 3],
    "7": [3, 2, 0, 0, 0, 1],
    Maj7: [3, 2, 0, 0, 0, 2],
    m7: [3, 1, 0, 0, 3, 1],
    sus2: [3, 0, 0, 0, 3, 3],
    sus4: [3, 3, 0, 0, 3, 3],
  },
  A: {
    Maj: [-1, 0, 2, 2, 2, 0],
    Min: [-1, 0, 2, 2, 1, 0],
    "7": [-1, 0, 2, 0, 2, 0],
    Maj7: [-1, 0, 2, 1, 2, 0],
    m7: [-1, 0, 2, 0, 1, 0],
    sus2: [-1, 0, 2, 2, 0, 0],
    sus4: [-1, 0, 2, 2, 3, 0],
  },
  B: {
    Maj: [-1, 2, 4, 4, 4, 2],
    Min: [-1, 2, 4, 4, 3, 2],
    "7": [-1, 2, 4, 2, 4, 2],
    Maj7: [-1, 2, 4, 3, 4, 2],
    m7: [-1, 2, 4, 2, 3, 2],
    sus2: [-1, 2, 4, 4, 2, 2],
    sus4: [-1, 2, 4, 4, 5, 2],
  },
};

const STRINGS_BASE_NOTES = [4, 11, 7, 2, 9, 4]; // E2, A2, D3, G3, B3, E4 indices


export default function ToolsPage() {
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>("metronome");
  // tools
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeTick, setMetronomeTick] = useState(0);
  const [isTunerActive, setIsTunerActive] = useState(false);
  const [selectedChordRoot, setSelectedChordRoot] = useState("C");
  const [selectedChordType, setSelectedChordType] = useState("Maj");
  const [selectedScaleRoot, setSelectedScaleRoot] = useState("C");
  const [selectedScaleType, setSelectedScaleType] = useState("Major");
  const currentChord = CHORD_DATA[selectedChordRoot]?.[selectedChordType] || null;
  const isNoteInScale = (
    stringIndex: number,
    fret: number,
    rootNote: string,
    scaleType: string,
  ) => {
    const rootIndex = NOTES.indexOf(rootNote);
    const scaleIntervals = SCALES_DATA[scaleType];
    const stringBaseNote = STRINGS_BASE_NOTES[stringIndex];
    const currentNoteIndex = (stringBaseNote + fret) % 12;
    const intervalFromRoot = (currentNoteIndex - rootIndex + 12) % 12;
    return scaleIntervals.includes(intervalFromRoot);
  };

  return (
    <div className="pt-8 pb-24 px-6 md:px-12 animate-in fade-in duration-500 space-y-12">
      <div className="flex items-center space-x-1 p-1 bg-zinc-100 dark:bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full sm:w-fit overflow-x-auto scrollbar-hide shadow-sm">
        <button
          onClick={() => setActiveToolTab("metronome")}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === "metronome" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
        >
          <Gauge size={14} />
          <span>Metronome</span>
        </button>
        <button
          onClick={() => setActiveToolTab("tuner")}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === "tuner" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
        >
          <Zap size={14} />
          <span>Tuner</span>
        </button>
        <button
          onClick={() => setActiveToolTab("chord-library")}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === "chord-library" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
        >
          <Hash size={14} />
          <span>Chord Map</span>
        </button>
        <button
          onClick={() => setActiveToolTab("scales")}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeToolTab === "scales" ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
        >
          <Grid size={14} />
          <span>Scale Explorer</span>
        </button>
      </div>

      <div className="min-h-[400px]">
        {activeToolTab === "metronome" && (
          <div className="animate-in fade-in zoom-in-95 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 md:p-16 flex flex-col items-center justify-center space-y-12 relative overflow-hidden shadow-sm">
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-indigo-600 transition-opacity duration-75 ${metronomeTick === 0 ? "opacity-100" : "opacity-0"}`}
            />
            <div className="text-center space-y-4">
              <h3 className="text-7xl font-black text-zinc-900 dark:text-white tracking-tighter">
                {metronomeBpm}
                <span className="text-lg text-zinc-400 dark:text-zinc-600 ml-2">
                  BPM
                </span>
              </h3>
              <div className="flex space-x-3 justify-center">
                {[0, 1, 2, 3].map((t) => (
                  <div
                    key={t}
                    className={`w-3 h-3 rounded-full transition-all duration-150 ${metronomeTick === t ? (t === 0 ? "bg-indigo-500 scale-150 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "bg-zinc-400") : "bg-zinc-200 dark:bg-zinc-800"}`}
                  />
                ))}
              </div>
            </div>
            <div className="w-full max-w-sm space-y-8">
              <input
                type="range"
                min="40"
                max="220"
                value={metronomeBpm}
                onChange={(e) =>
                  setMetronomeBpm(parseInt(e.target.value))
                }
                className="w-full accent-indigo-600 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() =>
                  setIsMetronomePlaying(!isMetronomePlaying)
                }
                className={`w-full py-5 rounded-[1.5rem] font-black text-base flex items-center justify-center space-x-3 transition-all ${isMetronomePlaying ? "bg-zinc-800 text-white shadow-xl" : "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30"}`}
              >
                {isMetronomePlaying ? (
                  <Pause size={24} fill="white" />
                ) : (
                  <Play size={24} fill="white" className="ml-1" />
                )}
                <span>{isMetronomePlaying ? "Stop" : "Start"}</span>
              </button>
            </div>
          </div>
        )}

        {activeToolTab === "tuner" && (
          <div className="animate-in fade-in zoom-in-95 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-12 shadow-sm">
            <div className="text-center">
              <span
                className={`text-8xl font-black transition-colors ${isTunerActive ? "text-emerald-500" : "text-zinc-200 dark:text-zinc-800"}`}
              >
                E
              </span>
              <p
                className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${isTunerActive ? "text-emerald-500" : "text-zinc-300 dark:text-zinc-700"}`}
              >
                In Tune
              </p>
            </div>
            <button
              onClick={() => setIsTunerActive(!isTunerActive)}
              className={`px-10 py-4 rounded-2xl font-black text-sm transition-all ${isTunerActive ? "bg-zinc-800 text-white" : "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20"}`}
            >
              {isTunerActive ? "Disable Tuner" : "Enable Microphone"}
            </button>
          </div>
        )}

        {activeToolTab === "chord-library" && (
          <div className="animate-in fade-in zoom-in-95 space-y-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                {NOTES.filter((n) =>
                  ["C", "D", "E", "F", "G", "A", "B"].includes(n),
                ).map((note) => (
                  <button
                    key={note}
                    onClick={() => setSelectedChordRoot(note)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedChordRoot === note ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                  >
                    {note}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                {CHORD_VARIATIONS.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedChordType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedChordType === type ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-12 items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-4xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                  {selectedChordRoot} {selectedChordType}
                </h3>
                <p className="text-zinc-500 font-medium">
                  Common voicing for guitar.
                </p>
              </div>

              <div className="relative p-8 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-48 h-64 border-l-2 border-zinc-300 dark:border-zinc-700 relative flex justify-between px-2 pt-8">
                  <div className="absolute top-0 left-0 w-full h-2 bg-zinc-800 dark:bg-zinc-100 rounded-full" />
                  {[1, 2, 3, 4, 5].map((f) => (
                    <div
                      key={f}
                      className="absolute w-full h-px bg-zinc-200 dark:bg-zinc-700"
                      style={{ top: `${f * 20 + 8}%` }}
                    />
                  ))}
                  {STRINGS_BASE_NOTES.map((_, sIdx) => {
                    const fret = currentChord
                      ? currentChord[5 - sIdx]
                      : -1;
                    return (
                      <div
                        key={sIdx}
                        className="h-full w-px bg-zinc-200 dark:bg-zinc-600 relative"
                      >
                        {fret === 0 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-500">
                            O
                          </div>
                        )}
                        {fret === -1 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-500">
                            X
                          </div>
                        )}
                        {fret > 0 && (
                          <div
                            className="absolute w-6 h-6 bg-indigo-600 border-2 border-indigo-400 rounded-full -left-[11px] shadow-lg shadow-indigo-600/30 flex items-center justify-center text-[8px] text-white font-black"
                            style={{
                              top: `${(fret - 0.5) * 20 + 8}%`,
                            }}
                          >
                            {fret}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeToolTab === "scales" && (
          <div className="animate-in fade-in zoom-in-95 space-y-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                {NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => setSelectedScaleRoot(note)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedScaleRoot === note ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                  >
                    {note}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
                {Object.keys(SCALES_DATA).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedScaleType(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedScaleType === type ? "bg-indigo-600 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] overflow-x-auto custom-scrollbar">
              <div className="min-w-[800px] space-y-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                    {selectedScaleRoot} {selectedScaleType} Scale
                  </h3>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                      <span className="text-[10px] font-black uppercase text-zinc-400">
                        Scale Note
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black uppercase text-zinc-400">
                        Root Note
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative h-48 flex flex-col justify-between pt-4 pb-4 px-4 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                  {[1, 2, 3, 4, 5, 6].map((sIdx) => (
                    <div
                      key={sIdx}
                      className="h-px w-full bg-zinc-200 dark:bg-zinc-700 relative"
                    >
                      {Array.from({ length: 13 }).map((_, fIdx) => {
                        const isScaleNote = isNoteInScale(
                          sIdx - 1,
                          fIdx,
                          selectedScaleRoot,
                          selectedScaleType,
                        );
                        const noteName =
                          NOTES[
                            (STRINGS_BASE_NOTES[sIdx - 1] + fIdx) % 12
                          ];
                        const isRoot = noteName === selectedScaleRoot;

                        return (
                          <React.Fragment key={fIdx}>
                            {fIdx > 0 && (
                              <div
                                className="absolute top-[-24px] h-[48px] w-px bg-zinc-100 dark:bg-zinc-800"
                                style={{ left: `${fIdx * 7.69}%` }}
                              />
                            )}
                            {isScaleNote && (
                              <div
                                className={`absolute -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg transition-all ${isRoot ? "bg-emerald-500 scale-110" : "bg-indigo-600 opacity-90"}`}
                                style={{
                                  left: `${fIdx * 7.69 + 3.84}%`,
                                  top: "50%",
                                }}
                              >
                                {noteName}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ))}
                  <div className="absolute bottom-[-24px] left-0 w-full flex justify-between px-4">
                    {Array.from({ length: 13 }).map((_, i) => (
                      <span
                        key={i}
                        className="text-[8px] font-black text-zinc-400 w-6 text-center"
                        style={{ marginLeft: i === 0 ? "0" : "auto" }}
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}