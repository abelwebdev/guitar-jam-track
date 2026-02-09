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
  const [metronomeBpm, setMetronomeBpm] = useState(60);
  const [isMetronomePlaying, setIsMetronomePlaying] = useState(false);
  const [metronomeTick, setMetronomeTick] = useState(0);
  const [metronomeTimeSignature, setMetronomeTimeSignature] = useState<'2/4' | '3/4' | '4/4' | '5/4' | '6/8' | '7/8'>('4/4');
  const [metronomeVolume, setMetronomeVolume] = useState(0.3);
  const [metronomeSoundType, setMetronomeSoundType] = useState<'click' | 'beep' | 'wood' | 'digital'>('click');
  const metronomeIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const [isTunerActive, setIsTunerActive] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string>('');
  const [detectedFrequency, setDetectedFrequency] = useState<number>(0);
  const [cents, setCents] = useState<number>(0);
  const audioContextTunerRef = React.useRef<AudioContext | null>(null);
  const analyserRef = React.useRef<AnalyserNode | null>(null);
  const micStreamRef = React.useRef<MediaStream | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
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

  // Tuner pitch detection
  const frequencyToNote = React.useCallback((frequency: number) => {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    const roundedNote = Math.round(noteNum) + 69;
    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
    return {
      note: NOTES[roundedNote % 12],
      octave: Math.floor(roundedNote / 12) - 1,
      cents: cents
    };
  }, []);

  const autoCorrelate = React.useCallback((buffer: Float32Array, sampleRate: number) => {
    let SIZE = buffer.length;
    let rms = 0;
    
    for (let i = 0; i < SIZE; i++) {
      const val = buffer[i];
      rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    
    // Lower threshold for better sensitivity
    if (rms < 0.005) return -1;
    
    let r1 = 0, r2 = SIZE - 1;
    const thres = 0.1; // Lower threshold
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    }
    
    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;
    
    const c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
      for (let j = 0; j < SIZE - i; j++) {
        c[i] = c[i] + buffer[j] * buffer[j + i];
      }
    }
    
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    
    let T0 = maxpos;
    
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2;
    const b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    
    return sampleRate / T0;
  }, []);

  const updatePitch = React.useCallback(() => {
    if (!analyserRef.current || !audioContextTunerRef.current) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    
    const frequency = autoCorrelate(buffer, audioContextTunerRef.current.sampleRate);
    
    // Guitar frequency range: E2 (82Hz) to E6 (1318Hz)
    if (frequency > 60 && frequency < 1500) {
      const noteInfo = frequencyToNote(frequency);
      setDetectedNote(`${noteInfo.note}${noteInfo.octave}`);
      setDetectedFrequency(frequency);
      setCents(noteInfo.cents);
    }
    
    if (isTunerActive) {
      animationFrameRef.current = requestAnimationFrame(updatePitch);
    }
  }, [isTunerActive, frequencyToNote, autoCorrelate]);

  const startTuner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      audioContextTunerRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextTunerRef.current.createMediaStreamSource(stream);
      
      analyserRef.current = audioContextTunerRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      source.connect(analyserRef.current);
      
      setIsTunerActive(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please grant permission.');
    }
  };

  const stopTuner = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextTunerRef.current) {
      audioContextTunerRef.current.close();
    }
    
    setIsTunerActive(false);
    setDetectedNote('');
    setDetectedFrequency(0);
    setCents(0);
  };

  // Start pitch detection loop when tuner becomes active
  React.useEffect(() => {
    if (isTunerActive && analyserRef.current && audioContextTunerRef.current) {
      updatePitch();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTunerActive, updatePitch]);

  React.useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextTunerRef.current) {
        audioContextTunerRef.current.close();
      }
    };
  }, []);

  // Metronome audio playback
  const playMetronomeClick = React.useCallback((isAccent: boolean) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const baseVolume = metronomeVolume;
    const volume = isAccent ? baseVolume : baseVolume * 0.5;
    
    // Different sound types
    switch (metronomeSoundType) {
      case 'click':
        // Sharp, short click
        oscillator.frequency.value = isAccent ? 1000 : 800;
        gainNode.gain.value = volume;
        oscillator.start(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.stop(ctx.currentTime + 0.05);
        break;
        
      case 'beep':
        // Longer, softer beep
        oscillator.frequency.value = isAccent ? 880 : 660;
        oscillator.type = 'sine';
        gainNode.gain.value = volume * 0.8;
        oscillator.start(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
        
      case 'wood':
        // Woody, percussive sound
        oscillator.frequency.value = isAccent ? 200 : 150;
        oscillator.type = 'triangle';
        gainNode.gain.value = volume;
        oscillator.start(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        oscillator.stop(ctx.currentTime + 0.08);
        break;
        
      case 'digital':
        // Electronic, square wave
        oscillator.frequency.value = isAccent ? 1200 : 900;
        oscillator.type = 'square';
        gainNode.gain.value = volume * 0.6;
        oscillator.start(ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        oscillator.stop(ctx.currentTime + 0.06);
        break;
    }
  }, [metronomeVolume, metronomeSoundType]);

  // Metronome effect
  React.useEffect(() => {
    if (isMetronomePlaying) {
      // Get beats per measure from time signature
      const beatsPerMeasure = parseInt(metronomeTimeSignature.split('/')[0]);
      const interval = 60000 / metronomeBpm;
      let currentBeat = 0;
      
      // Play immediately on start
      playMetronomeClick(true);
      setMetronomeTick(0);
      
      metronomeIntervalRef.current = setInterval(() => {
        currentBeat = (currentBeat + 1) % beatsPerMeasure;
        setMetronomeTick(currentBeat);
        playMetronomeClick(currentBeat === 0);
      }, interval);
      
      return () => {
        if (metronomeIntervalRef.current) {
          clearInterval(metronomeIntervalRef.current);
        }
      };
    } else {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
      setMetronomeTick(0);
    }
  }, [isMetronomePlaying, metronomeBpm, metronomeTimeSignature, metronomeVolume, metronomeSoundType, playMetronomeClick]);

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
          <div className="animate-in fade-in zoom-in-95 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 sm:p-10 md:p-16 flex flex-col items-center justify-center space-y-8 sm:space-y-12 relative overflow-hidden shadow-sm">
            {/* Visual indicator bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-2 transition-all duration-75 ${metronomeTick === 0 ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-700"}`}
            />
            
            <div className="text-center space-y-4 sm:space-y-6">
              {/* BPM Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <button
                    onClick={() => setMetronomeBpm(Math.max(40, metronomeBpm - 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all hover:scale-110 active:scale-95 flex items-center justify-center font-black text-xl sm:text-2xl"
                    title="Decrease BPM"
                  >
                    −
                  </button>
                  <h3 className="text-6xl sm:text-8xl md:text-9xl font-black text-zinc-900 dark:text-white tracking-tighter tabular-nums min-w-[150px] sm:min-w-[200px] md:min-w-[280px]">
                    {metronomeBpm}
                  </h3>
                  <button
                    onClick={() => setMetronomeBpm(Math.min(240, metronomeBpm + 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200 transition-all hover:scale-110 active:scale-95 flex items-center justify-center font-black text-xl sm:text-2xl"
                    title="Increase BPM"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  Beats Per Minute
                </p>
              </div>

              {/* Start/Stop Button */}
              <button
                onClick={() => setIsMetronomePlaying(!isMetronomePlaying)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full font-black flex items-center justify-center transition-all hover:scale-110 active:scale-95 mx-auto ${
                  isMetronomePlaying 
                    ? "bg-red-600 text-white shadow-2xl shadow-red-600/30 hover:bg-red-700" 
                    : "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700"
                }`}
              >
                {isMetronomePlaying ? (
                  <Pause size={28} fill="white" className="sm:w-9 sm:h-9" />
                ) : (
                  <Play size={28} fill="white" className="ml-1 sm:w-9 sm:h-9" />
                )}
              </button>
              
              {/* Beat indicators */}
              <div className="flex space-x-3 sm:space-x-4 justify-center">
                {Array.from({ length: parseInt(metronomeTimeSignature.split('/')[0]) }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-100 ${
                      metronomeTick === i 
                        ? i === 0 
                          ? "bg-indigo-600 scale-150 shadow-[0_0_20px_rgba(99,102,241,0.8)]" 
                          : "bg-indigo-400 scale-125 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        : "bg-zinc-200 dark:bg-zinc-800 scale-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-md space-y-6 sm:space-y-8">
              {/* BPM Slider */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <span>40</span>
                  <span>Tempo</span>
                  <span>240</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="220"
                  value={metronomeBpm}
                  onChange={(e) => setMetronomeBpm(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 sm:h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:h-2 sm:hover:h-2.5 transition-all"
                />
              </div>

              {/* Volume Control */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <span>0%</span>
                  <span>Volume</span>
                  <span>100%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={metronomeVolume}
                  onChange={(e) => setMetronomeVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 sm:h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer hover:h-2 sm:hover:h-2.5 transition-all"
                />
              </div>

              {/* Time Signature */}
              <div className="space-y-3 sm:space-y-4">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block text-center">
                  Time Signature
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '2/4', label: '2/4' },
                    { value: '3/4', label: '3/4' },
                    { value: '4/4', label: '4/4' },
                    { value: '5/4', label: '5/4' },
                    { value: '6/8', label: '6/8' },
                    { value: '7/8', label: '7/8' }
                  ].map((sig) => (
                    <button
                      key={sig.value}
                      onClick={() => setMetronomeTimeSignature(sig.value as any)}
                      className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl font-black text-sm sm:text-base transition-all ${
                        metronomeTimeSignature === sig.value
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:scale-105"
                      }`}
                    >
                      {sig.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Type */}
              <div className="space-y-3 sm:space-y-4">
                <label className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 block text-center">
                  Sound Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'click', label: 'Click' },
                    { value: 'beep', label: 'Beep' },
                    { value: 'wood', label: 'Wood' },
                    { value: 'digital', label: 'Digital' }
                  ].map((sound) => (
                    <button
                      key={sound.value}
                      onClick={() => setMetronomeSoundType(sound.value as any)}
                      className={`px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all ${
                        metronomeSoundType === sound.value
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:scale-105"
                      }`}
                    >
                      {sound.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick BPM presets */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center pt-2 sm:pt-4">
                {[60, 80, 100, 120, 140, 160, 180].map((bpm) => (
                  <button
                    key={bpm}
                    onClick={() => setMetronomeBpm(bpm)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${
                      metronomeBpm === bpm
                        ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:scale-105"
                    }`}
                  >
                    {bpm}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeToolTab === "tuner" && (
          <div className="animate-in fade-in zoom-in-95 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 sm:p-10 md:p-16 flex flex-col items-center justify-center space-y-8 sm:space-y-12 shadow-sm">
            <div className="text-center space-y-6">
              {/* Detected Note */}
              <div className="space-y-2">
                <span
                  className={`text-7xl sm:text-8xl md:text-9xl font-black transition-colors ${
                    isTunerActive && detectedNote
                      ? Math.abs(cents) < 5
                        ? "text-emerald-500"
                        : Math.abs(cents) < 20
                        ? "text-amber-500"
                        : "text-red-500"
                      : "text-zinc-200 dark:text-zinc-800"
                  }`}
                >
                  {detectedNote || '—'}
                </span>
                <p className="text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  {isTunerActive ? (detectedFrequency > 0 ? `${detectedFrequency.toFixed(1)} Hz` : 'Listening...') : 'Chromatic Tuner'}
                </p>
              </div>

              {/* Tuning Indicator */}
              {isTunerActive && detectedNote && (
                <div className="w-full max-w-md space-y-4">
                  {/* Visual tuning bar */}
                  <div className="relative h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                    {/* Center line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-400 dark:bg-zinc-600 z-10" />
                    
                    {/* Tuning indicator */}
                    <div
                      className={`absolute top-1/2 -translate-y-1/2 w-2 h-8 rounded-full transition-all duration-100 ${
                        Math.abs(cents) < 5
                          ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]"
                          : Math.abs(cents) < 20
                          ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                          : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                      }`}
                      style={{
                        left: `calc(50% + ${Math.max(-45, Math.min(45, cents))}%)`,
                        transform: 'translateX(-50%) translateY(-50%)'
                      }}
                    />
                    
                    {/* Gradient zones */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-emerald-500/10 to-red-500/10" />
                  </div>

                  {/* Cents display */}
                  <div className="flex items-center justify-center space-x-2">
                    <span className={`text-2xl sm:text-3xl font-black tabular-nums ${
                      Math.abs(cents) < 5
                        ? "text-emerald-500"
                        : Math.abs(cents) < 20
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}>
                      {cents > 0 ? '+' : ''}{cents}
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                      cents
                    </span>
                  </div>

                  {/* Status text */}
                  <p className={`text-sm font-black uppercase tracking-widest ${
                    Math.abs(cents) < 5
                      ? "text-emerald-500"
                      : cents > 0
                      ? "text-red-500"
                      : "text-red-500"
                  }`}>
                    {Math.abs(cents) < 5 ? '✓ In Tune' : cents > 0 ? '↑ Too Sharp' : '↓ Too Flat'}
                  </p>
                </div>
              )}
            </div>

            {/* Control Button */}
            <button
              onClick={() => isTunerActive ? stopTuner() : startTuner()}
              className={`px-8 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] font-black text-sm sm:text-base uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${
                isTunerActive 
                  ? "bg-red-600 text-white shadow-2xl shadow-red-600/30 hover:bg-red-700" 
                  : "bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700"
              }`}
            >
              {isTunerActive ? "Stop Tuner" : "Start Tuner"}
            </button>

            {/* Guitar String Reference */}
            <div className="w-full max-w-md">
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 text-center mb-4">
                Standard Tuning Reference
              </p>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { string: '6', note: 'E2', freq: '82.4' },
                  { string: '5', note: 'A2', freq: '110.0' },
                  { string: '4', note: 'D3', freq: '146.8' },
                  { string: '3', note: 'G3', freq: '196.0' },
                  { string: '2', note: 'B3', freq: '246.9' },
                  { string: '1', note: 'E4', freq: '329.6' }
                ].map((s) => (
                  <div key={s.string} className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center">
                    <p className="text-xs font-black text-zinc-400 dark:text-zinc-600 mb-1">{s.string}</p>
                    <p className="text-lg font-black text-zinc-900 dark:text-white">{s.note}</p>
                    <p className="text-[8px] font-bold text-zinc-400 dark:text-zinc-600">{s.freq}Hz</p>
                  </div>
                ))}
              </div>
            </div>
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