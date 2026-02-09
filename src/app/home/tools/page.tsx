'use client'

import React, { useState } from "react";
import Chord from '@tombatossals/react-chords/lib/Chord'
import { Play, Pause, Gauge, Hash, Zap, Grid } from "lucide-react";
import guitarDb from '@tombatossals/chords-db/lib/guitar.json';

type ToolTab = "metronome" | "tuner" | "chord-library" | "scales";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Map NOTES to the keys used in guitar.json
const NOTE_TO_DB_KEY: Record<string, string> = {
  "C": "C", "C#": "Csharp", "D": "D", "D#": "Eb", "E": "E", "F": "F", 
  "F#": "Fsharp", "G": "G", "G#": "Ab", "A": "A", "A#": "Bb", "B": "B"
};

// Get available suffixes from the DB
const CHORD_VARIATIONS = guitarDb.suffixes;

const SCALES_DATA: Record<string, number[]> = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  Minor: [0, 2, 3, 5, 7, 8, 10],
  "Maj Pentatonic": [0, 2, 4, 7, 9],
  "Min Pentatonic": [0, 3, 5, 7, 10],
  Blues: [0, 3, 5, 6, 7, 10],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
};

const STRINGS_BASE_NOTES = [4, 9, 2, 7, 11, 4];
export default function ToolsPage() {
  const [activeToolTab, setActiveToolTab] = useState<ToolTab>("metronome");
  // tools
  const [metronomeBpm, setMetronomeBpm] = useState(120);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeTick, setMetronomeTick] = useState(0);
  const [isTunerActive, setIsTunerActive] = useState(false);
  const [selectedChordRoot, setSelectedChordRoot] = useState("C");
  const [selectedChordType, setSelectedChordType] = useState("major");
  const [selectedScaleRoot, setSelectedScaleRoot] = useState("A");
  const [selectedScaleType, setSelectedScaleType] = useState("Major");

  // Get chord data from DB
  const dbKey = NOTE_TO_DB_KEY[selectedChordRoot];
  const chordOptions = (guitarDb.chords as any)[dbKey] || [];
  const availableSuffixes = chordOptions.map((c: any) => c.suffix);
  const chordPositions = chordOptions.find((c: any) => c.suffix === selectedChordType)?.positions;

  const handleChordRootChange = (note: string) => {
    setSelectedChordRoot(note);
    const newDbKey = NOTE_TO_DB_KEY[note];
    const nextAvailable = (guitarDb.chords as any)[newDbKey]?.map((c: any) => c.suffix) || [];
    if (!nextAvailable.includes(selectedChordType)) {
      setSelectedChordType(nextAvailable[0] || "major");
    }
  };
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
                {NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleChordRootChange(note)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${selectedChordRoot === note ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
                  >
                    {note}
                  </button>
                ))}
              </div>
              <div className="flex space-x-2 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide max-w-full md:max-w-xl">
                {CHORD_VARIATIONS.map((type) => {
                  const isAvailable = availableSuffixes.includes(type);
                  if (!isAvailable) return null; // 👈 hide instead of disable
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedChordType(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedChordType === type
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-12 items-center justify-center p-8 md:p-12 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-sm">
              <div className="text-center space-y-2">
                <h3 className="text-4xl md:text-5xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                  {selectedChordRoot} {selectedChordType}
                </h3>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  {chordPositions?.length || 0} Variations Found
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                {chordPositions?.map((chord: any, index: number) => (
                  <div key={index} className="relative p-8 md:p-10 bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] shadow-md border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center group">
                    <span className="absolute top-6 right-8 text-[8px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Position {index + 1}
                    </span>
                    <div className="w-40 md:w-48">
                      <Chord
                        chord={chord}
                        instrument={{
                          ...(guitarDb.main as any),
                          tunings: guitarDb.tunings
                        }}
                      />
                    </div>
                  </div>
                ))}
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