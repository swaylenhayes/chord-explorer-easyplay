import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { NoteName, Mode, ChordCategory, Interval, PatternStep, GridKeyInfo, ResolvedChord, TieredSegments } from './types';
import {
  getDiatonicChords,
  getDiatonicSevenths,
  getDiatonicExtended,
  getSusAddChords,
  getPowerChords,
  getIntervalNotes,
  getScale,
  resolveNumeral,
} from './engine/theory';
import { PROGRESSIONS } from './engine/progressions';
import { VOICING_PATTERNS, findSegment, findAllSegments } from './engine/voicings';
import { getTransposedGridKeys, getRootOffset } from './engine/grid';

type ViewMode = 'easyplay' | 'piano';
import EasyPlayGrid from './components/EasyPlayGrid';
import PianoKeyboard from './components/PianoKeyboard';
import KeySelector from './components/KeySelector';
import ChordSelector from './components/ChordSelector';
import type { ChordMode } from './components/ChordSelector';
import VoicingPatterns from './components/VoicingPatterns';
import CircleOfFifthsSpectrum from './components/CircleOfFifthsSpectrum';
import Legend from './components/Legend';
import AudioControls from './components/AudioControls';
import { AudioEngine } from './engine/audio';
import type { PresetId } from './engine/audio';
import { useArrowNav } from './hooks/useArrowNav';
import { useMIDI } from './hooks/useMIDI';

export default function App() {
  const [selectedKey, setSelectedKey] = useState<NoteName>('C');
  const [selectedMode, setSelectedMode] = useState<Mode>('major');
  const [category, setCategory] = useState<ChordCategory>('triads');
  const [activeDegree, setActiveDegree] = useState<number | null>(null);

  // Sub-type state
  const [extendedType, setExtendedType] = useState<'9' | '11' | '13'>('9');
  const [susAddIndex, setSusAddIndex] = useState(0);
  const [powerIndex, setPowerIndex] = useState(0);

  // Chord mode (single vs progression)
  const [chordMode, setChordMode] = useState<ChordMode>('single');

  // Intervals state
  const [intervalRoot, setIntervalRoot] = useState<NoteName>(selectedKey);
  const [activeInterval, setActiveInterval] = useState<Interval | null>(null);

  // ─── Voicing pattern state ───
  const [activePattern, setActivePattern] = useState<string | null>(null);
  const [patternStep, _setPatternStep] = useState(0);
  const patternStepRef = useRef(0);
  const setPatternStep = useCallback((n: number) => {
    patternStepRef.current = n;
    _setPatternStep(n);
  }, []);
  const [patternBPM, setPatternBPM] = useState(100);
  const [isPatternPlaying, setIsPatternPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Progression playback state ───
  const [activeProgressionId, setActiveProgressionId] = useState<number | null>(null);
  const [isProgressionPlaying, setIsProgressionPlaying] = useState(false);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [repeats, setRepeats] = useState(2);

  // ─── Refs for pattern-driven progression advancement ───
  const cycleCountRef = useRef(0);
  const patternStoppedRef = useRef(false);
  const repeatsRef = useRef(repeats);
  repeatsRef.current = repeats;

  // ─── Arrow-key navigation ───
  const navContainerRef = useRef<HTMLDivElement>(null);
  useArrowNav(navContainerRef);

  // ─── Audio state ───
  const audioRef = useRef<AudioEngine | null>(null);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const [preset, setPreset] = useState<PresetId>('sax');

  // ─── View mode (EasyPlay grid vs Piano keyboard) ───
  const [activeView, setActiveView] = useState<ViewMode>('easyplay');

  // ─── MIDI state (visual feedback only — no audio from MIDI keys) ───
  const [midiPressedPitches, setMidiPressedPitches] = useState<Set<number>>(new Set());

  const handleMidiNoteOn = useCallback((pitch: number) => {
    setMidiPressedPitches(prev => {
      const next = new Set(prev);
      next.add(pitch);
      return next;
    });
  }, []);

  const handleMidiNoteOff = useCallback((pitch: number) => {
    setMidiPressedPitches(prev => {
      const next = new Set(prev);
      next.delete(pitch);
      return next;
    });
  }, []);

  const midi = useMIDI(handleMidiNoteOn, handleMidiNoteOff, true);
  const hasMidiKeys = midiPressedPitches.size > 0;

  // ─── MIDI pitches for piano (convert absolute → transposed piano space) ───
  const pianoMidiPitches = useMemo(() => {
    if (midiPressedPitches.size === 0) return undefined;
    const offset = getRootOffset(selectedKey);
    return new Set(
      [...midiPressedPitches].map(p => p - offset).filter(p => p >= 0 && p <= 24)
    );
  }, [midiPressedPitches, selectedKey]);

  // Compute chords for current category
  const chords = (() => {
    switch (category) {
      case 'triads': return getDiatonicChords(selectedKey, selectedMode);
      case 'sevenths': return getDiatonicSevenths(selectedKey, selectedMode);
      case 'extended': return getDiatonicExtended(selectedKey, selectedMode, extendedType);
      case 'sus-add': return getSusAddChords(selectedKey, selectedMode, susAddIndex);
      case 'power': return getPowerChords(selectedKey, selectedMode, powerIndex);
      case 'intervals': return []; // intervals don't use degree-based chords
    }
  })();

  const activeChord = activeDegree !== null && category !== 'intervals' ? chords[activeDegree] : null;

  // Scale notes for the current key — always visible as white borders on the grid
  const scaleNotes = getScale(selectedKey, selectedMode);

  // Interval notes for highlighting
  const intervalNotes = activeInterval
    ? getIntervalNotes(intervalRoot, activeInterval.semitones) as NoteName[]
    : [];

  // ─── Progression resolution ───
  const activeProgression = activeProgressionId !== null
    ? PROGRESSIONS.find(p => p.id === activeProgressionId) ?? null
    : null;

  // Ref for timer to access progression state without stale closures
  const progressionCtxRef = useRef({ isPlaying: false, numChords: 0 });
  progressionCtxRef.current = { isPlaying: isProgressionPlaying, numChords: activeProgression?.numerals.length ?? 0 };

  const resolvedProgressionChords: ResolvedChord[] = useMemo(() => {
    if (!activeProgression) return [];
    return activeProgression.numerals.map(num =>
      resolveNumeral(num, selectedKey, selectedMode)
    );
  }, [activeProgression, selectedKey, selectedMode]);

  const currentProgressionChord = isProgressionPlaying
    ? resolvedProgressionChords[currentChordIndex] ?? null
    : null;

  // Determine what to highlight on the grid (progression overrides when playing)
  const highlightedNotes: NoteName[] = (() => {
    if (currentProgressionChord) return currentProgressionChord.notes;
    if (category === 'intervals') return intervalNotes;
    return activeChord?.notes ?? [];
  })();

  // Root note of the active chord (first note in the chord's note array)
  const chordRoot = currentProgressionChord
    ? currentProgressionChord.notes[0]
    : activeChord?.notes[0] ?? undefined;

  const activeChordName = (() => {
    if (currentProgressionChord) {
      return `${currentProgressionChord.numeral} \u00B7 ${currentProgressionChord.name}`;
    }
    if (category === 'intervals') {
      return activeInterval ? `${intervalRoot} + ${activeInterval.shortName}` : undefined;
    }
    return activeChord ? `${activeChord.numeral} \u00B7 ${activeChord.name}` : undefined;
  })();

  // ─── Transposed grid keys (based on physical device pitch setting) ───
  const transposedGridKeys = useMemo(
    () => getTransposedGridKeys(selectedKey),
    [selectedKey],
  );

  // ─── Segment and pattern steps ───
  const segment: GridKeyInfo[] = useMemo(() => {
    if (highlightedNotes.length === 0) return [];
    const pattern = VOICING_PATTERNS.find(p => p.id === activePattern);
    const direction = pattern?.id === 'descending' ? 'backward' as const : 'forward' as const;
    return findSegment(highlightedNotes, direction, transposedGridKeys);
  }, [highlightedNotes, activePattern, transposedGridKeys]);

  const tieredSegments: TieredSegments | null = useMemo(() => {
    if (highlightedNotes.length === 0) return null;
    return findAllSegments(highlightedNotes, transposedGridKeys);
  }, [highlightedNotes, transposedGridKeys]);

  const patternDef = useMemo(
    () => VOICING_PATTERNS.find(p => p.id === activePattern) ?? null,
    [activePattern],
  );

  const patternSteps: PatternStep[] = useMemo(() => {
    if (!patternDef) return [];
    if (patternDef.generateMulti && tieredSegments && tieredSegments.total > 0) {
      return patternDef.generateMulti(tieredSegments);
    }
    if (segment.length === 0) return [];
    return patternDef.generate(segment);
  }, [patternDef, segment, tieredSegments]);

  // ─── Stop animation helper ───
  const stopAnimation = useCallback(() => {
    patternStoppedRef.current = true;
    setIsPatternPlaying(false);
    setPatternStep(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [setPatternStep]);

  // ─── Stop + clear pattern ───
  const clearPattern = useCallback(() => {
    stopAnimation();
    setActivePattern(null);
    cycleCountRef.current = 0;
  }, [stopAnimation]);

  // ─── Animation timer ───
  useEffect(() => {
    if (!isPatternPlaying || patternSteps.length === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const ms = 60000 / patternBPM;
    const stepsLen = patternSteps.length;
    const loopFrom = patternDef?.loopFrom ?? 0;

    timerRef.current = setInterval(() => {
      const next = patternStepRef.current + 1;
      let newStep: number;

      if (next >= stepsLen) {
        newStep = loopFrom;
        // Cycle completed — advance progression if active
        const ctx = progressionCtxRef.current;
        if (ctx.isPlaying && ctx.numChords > 0) {
          cycleCountRef.current += 1;
          if (cycleCountRef.current >= repeatsRef.current) {
            cycleCountRef.current = 0;
            setCurrentChordIndex(i => (i + 1) % ctx.numChords);
          }
        }
      } else {
        newStep = next;
      }

      setPatternStep(newStep);
    }, ms);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPatternPlaying, patternBPM, patternSteps.length, patternDef, setPatternStep]);

  // ─── Pattern toggle handler ───
  const handlePatternToggle = useCallback((patternId: string) => {
    if (activePattern === patternId) {
      // Same pattern: toggle play/stop
      if (isPatternPlaying) {
        stopAnimation();
      } else {
        setPatternStep(0);
        setIsPatternPlaying(true);
      }
    } else {
      // Different pattern: switch and start
      stopAnimation();
      setActivePattern(patternId);
      setPatternStep(0);
      setIsPatternPlaying(true);
    }
  }, [activePattern, isPatternPlaying, stopAnimation]);

  // ─── Stop animation on chord/key/mode/category changes ───
  // When switching categories, clear degree selection and stop animation
  const handleCategoryChange = (cat: ChordCategory) => {
    setCategory(cat);
    setActiveDegree(null);
    setActiveInterval(null);
    clearPattern();
    // Stop and clear any active progression when switching categories
    setIsProgressionPlaying(false);
    setActiveProgressionId(null);
    setCurrentChordIndex(0);
    // Reset interval root to current key when entering intervals mode
    if (cat === 'intervals') {
      setIntervalRoot(selectedKey);
    }
  };

  const handleKeyChange = (key: NoteName) => {
    setSelectedKey(key);
    clearPattern();
  };

  const handleModeChange = (mode: Mode) => {
    setSelectedMode(mode);
    clearPattern();
    // Stop any playing progression since it was built for the previous mode
    setIsProgressionPlaying(false);
    setActiveProgressionId(null);
    setCurrentChordIndex(0);
  };

  const handleChordSelect = (degree: number | null) => {
    setActiveDegree(degree);
    setPatternStep(0); // reset step to avoid out-of-bounds, but keep pattern playing
  };

  const handleIntervalSelect = (interval: Interval | null) => {
    setActiveInterval(interval);
    setPatternStep(0);
  };

  // ─── Progression fallback timer (when no voicing pattern is active) ───
  useEffect(() => {
    if (!isProgressionPlaying || !activeProgression || isPatternPlaying) return;
    const msPerBeat = 60000 / patternBPM;
    const msPerChord = msPerBeat * repeats;
    const timer = setInterval(() => {
      setCurrentChordIndex(i => (i + 1) % activeProgression.numerals.length);
    }, msPerChord);
    return () => clearInterval(timer);
  }, [isProgressionPlaying, activeProgression, isPatternPlaying, patternBPM, repeats]);

  // ─── Chord mode handler ───
  const PROGRESSION_VALID_CATEGORIES: ChordCategory[] = ['triads', 'sevenths', 'extended'];

  const handleChordModeChange = (mode: ChordMode) => {
    setChordMode(mode);
    if (mode === 'single') {
      // Stop any playing progression and reset to clean single-chord state
      setIsProgressionPlaying(false);
      setActiveProgressionId(null);
      setCurrentChordIndex(0);
    } else {
      // Snap to a valid progression category if current one doesn't have progressions
      if (!PROGRESSION_VALID_CATEGORIES.includes(category)) {
        setCategory('triads');
        setActiveDegree(null);
      }
    }
  };

  // ─── Progression handlers ───
  const handleProgressionSelect = (id: number) => {
    cycleCountRef.current = 0;
    if (activeProgressionId === id) {
      if (isProgressionPlaying) {
        setIsProgressionPlaying(false);
      } else {
        setCurrentChordIndex(0);
        setIsProgressionPlaying(true);
      }
    } else {
      setActiveProgressionId(id);
      setCurrentChordIndex(0);
      setIsProgressionPlaying(true);
      // Clear manual chord selection when starting a progression
      setActiveDegree(null);
      setActiveInterval(null);
    }
  };

  // Grid key click — only active in intervals mode
  const handleGridKeyClick = category === 'intervals'
    ? (note: NoteName) => {
        setIntervalRoot(note);
        setPatternStep(0);
      }
    : undefined;

  // ─── Derive pressed/held pitch sets for the grid ───
  const currentStep = isPatternPlaying && patternSteps.length > 0
    ? patternSteps[patternStep]
    : null;

  const currentComboIndex = currentStep?.comboIndex ?? 0;
  const shapeNumber = currentComboIndex + 1;
  const totalCombos = tieredSegments?.total ?? 1;
  const isStretchCombo = currentStep?.isStretch ?? false;
  const isMultiSegmentPattern = patternDef?.generateMulti != null;

  const pressedPitches = useMemo(
    () => new Set(currentStep?.pressed ?? []),
    [currentStep],
  );

  const heldPitches = useMemo(
    () => new Set(currentStep?.held ?? []),
    [currentStep],
  );

  // ─── Derive pressed/held note names for chord section chip animation ───
  const pitchToNote = useMemo(
    () => new Map(transposedGridKeys.map(k => [k.pitch, k.note])),
    [transposedGridKeys],
  );

  const chipAnimationActive = isPatternPlaying && activePattern !== null;

  const pressedNoteNames = useMemo(
    () => chipAnimationActive
      ? new Set((currentStep?.pressed ?? []).map(p => pitchToNote.get(p)).filter(Boolean) as NoteName[])
      : new Set<NoteName>(),
    [chipAnimationActive, currentStep, pitchToNote],
  );

  const heldNoteNames = useMemo(
    () => chipAnimationActive
      ? new Set((currentStep?.held ?? []).map(p => pitchToNote.get(p)).filter(Boolean) as NoteName[])
      : new Set<NoteName>(),
    [chipAnimationActive, currentStep, pitchToNote],
  );

  // ─── Audio engine lifecycle ───
  useEffect(() => {
    audioRef.current = new AudioEngine();
    return () => {
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, []);

  // ─── Audio: chord/progression sound (when no voicing pattern active) ───
  useEffect(() => {
    if (!audioRef.current || isPatternPlaying) return;
    if (patternStoppedRef.current) {
      patternStoppedRef.current = false;
      // Pattern just stopped — silence unless a progression is actively playing
      if (isProgressionPlaying && segment.length > 0) {
        audioRef.current.setNotes(segment.map(k => k.pitch));
      } else {
        audioRef.current.allNotesOff();
      }
      return;
    }
    if (segment.length > 0) {
      audioRef.current.setNotes(segment.map(k => k.pitch));
    } else {
      audioRef.current.allNotesOff();
    }
  }, [segment, isPatternPlaying]);

  // ─── Audio: voicing pattern step sound ───
  useEffect(() => {
    if (!audioRef.current || !isPatternPlaying || !currentStep) return;
    const allPitches = [...new Set([...currentStep.pressed, ...currentStep.held])];
    audioRef.current.setNotes(allPitches);
  }, [currentStep, isPatternPlaying]);

  // ─── Audio: silence when pattern stops ───
  useEffect(() => {
    if (!audioRef.current) return;
    if (!isPatternPlaying && segment.length === 0) {
      audioRef.current.allNotesOff();
    }
  }, [isPatternPlaying, segment]);

  // ─── Audio: volume, mute, preset, and root offset sync ───
  useEffect(() => { audioRef.current?.setVolume(volume); }, [volume]);
  useEffect(() => { audioRef.current?.setMuted(isMuted); }, [isMuted]);
  useEffect(() => { audioRef.current?.setPreset(preset); }, [preset]);
  useEffect(() => { audioRef.current?.setRootOffset(getRootOffset(selectedKey)); }, [selectedKey]);

  return (
    <div className="min-h-screen" style={{ background: '#0C0C14' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-3 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#E8E8F0' }}>
            Chord Explore
          </h1>
          <p className="text-xs mt-1" style={{ color: '#6A6A7E' }}>
            Chord shapes and harmonic functions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* MIDI status */}
          <div className="flex items-center gap-2">
            <div
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: midi.isConnected ? '#5AE85A' : '#3E3E52',
                boxShadow: midi.isConnected ? '0 0 6px #5AE85A88' : 'none',
              }}
            />
            <span className="text-xs" style={{ color: midi.isConnected ? '#7A7A8E' : '#3E3E52' }}>
              {midi.isConnected ? midi.deviceName : 'No MIDI'}
            </span>
          </div>
        <AudioControls
          volume={volume}
          isMuted={isMuted}
          preset={preset}
          onVolumeChange={setVolume}
          onMuteToggle={() => setIsMuted(m => !m)}
          onPresetChange={setPreset}
        />
        </div>
      </div>

      {/* Main layout: grid left, controls right */}
      <div className="px-6 pb-3 flex gap-4 flex-wrap">
        {/* Left: Keyboard view + Circle of Fifths — flex-1 so it absorbs extra width beyond the controls */}
        <div className="flex-1 flex flex-col gap-3" style={{ minWidth: 380 }}>
          {/* View tab switcher */}
          <div className="flex gap-1">
            {(['easyplay', 'piano'] as const).map(view => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className="select-none"
                style={{
                  padding: '5px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: activeView === view ? '#1E1E30' : 'transparent',
                  color: activeView === view ? '#E8E8F0' : '#4A4A5E',
                  border: activeView === view ? '1px solid #2E2E45' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {view === 'easyplay' ? 'EasyPlay' : 'Piano'}
              </button>
            ))}
          </div>

          {activeView === 'easyplay' ? (
            <EasyPlayGrid
              rootKey={selectedKey}
              highlightedNotes={highlightedNotes}
              scaleNotes={scaleNotes}
              activeChordName={activeChordName}
              onKeyClick={handleGridKeyClick}
              interactionRoot={category === 'intervals' ? intervalRoot : undefined}
              chordRoot={chordRoot}
              pressedPitches={isPatternPlaying ? pressedPitches : undefined}
              heldPitches={isPatternPlaying ? heldPitches : undefined}
              midiPressedPitches={hasMidiKeys ? midiPressedPitches : undefined}
            />
          ) : (
            <PianoKeyboard
              rootKey={selectedKey}
              activeChordName={activeChordName}
              onKeyClick={handleGridKeyClick}
              pressedPitches={isPatternPlaying ? pressedPitches : undefined}
              heldPitches={isPatternPlaying ? heldPitches : undefined}
              midiPressedPitches={hasMidiKeys ? pianoMidiPitches : undefined}
            />
          )}

          <CircleOfFifthsSpectrum selectedKey={selectedKey} scaleNotes={scaleNotes} />
          <Legend />
        </div>

        {/* Right: Controls (arrow-key navigation container) */}
        <div ref={navContainerRef} className="flex-1 flex flex-col gap-3" style={{ minWidth: 280, maxWidth: 540 }}>
          <KeySelector
            selectedKey={selectedKey}
            selectedMode={selectedMode}
            onKeyChange={handleKeyChange}
            onModeChange={handleModeChange}
          />
          <ChordSelector
            chordMode={chordMode}
            onChordModeChange={handleChordModeChange}
            category={category}
            onCategoryChange={handleCategoryChange}
            chords={chords}
            activeDegree={activeDegree}
            onChordSelect={handleChordSelect}
            extendedType={extendedType}
            onExtendedTypeChange={setExtendedType}
            susAddIndex={susAddIndex}
            onSusAddIndexChange={setSusAddIndex}
            powerIndex={powerIndex}
            onPowerIndexChange={setPowerIndex}
            activeInterval={activeInterval}
            onIntervalSelect={handleIntervalSelect}
            intervalRoot={intervalRoot}
            intervalNotes={intervalNotes}
            selectedMode={selectedMode}
            activeProgressionId={activeProgressionId}
            isProgressionPlaying={isProgressionPlaying}
            repeats={repeats}
            onProgressionSelect={handleProgressionSelect}
            onRepeatsChange={setRepeats}
            resolvedProgressionChords={resolvedProgressionChords}
            currentChordIndex={currentChordIndex}
            pressedNoteNames={pressedNoteNames}
            heldNoteNames={heldNoteNames}
            selectedKey={selectedKey}
          />
          <VoicingPatterns
            activePattern={activePattern}
            onPatternToggle={handlePatternToggle}
            isPlaying={isPatternPlaying}
            patternBPM={patternBPM}
            onBPMChange={setPatternBPM}
            shapeNumber={shapeNumber}
            totalShapes={totalCombos}
            isStretch={isStretchCombo}
            showShapeCounter={isPatternPlaying && isMultiSegmentPattern && totalCombos > 1}
          />
        </div>
      </div>

    </div>
  );
}
