import type { Chord, ChordCategory, NoteName, Interval, Mode, ResolvedChord } from '../types';
import { INTERVALS } from '../engine/theory';
import { PROGRESSIONS } from '../engine/progressions';
import { getTemperatureColor, getTemperatureTextColor } from '../engine/colors';

function NoteChip({ note, isPressed, isHeld, rootKey }: { note: NoteName; isPressed?: boolean; isHeld?: boolean; rootKey: NoteName }) {
  const bg = getTemperatureColor(note, rootKey);
  const color = getTemperatureTextColor(note, rootKey);
  const active = isPressed || isHeld;
  return (
    <div
      className="inline-flex items-center justify-center rounded font-bold"
      style={{
        width: 28,
        height: 28,
        background: bg,
        color,
        fontSize: 10,
        opacity: active ? 1 : (isPressed === undefined && isHeld === undefined) ? 1 : 0.35,
        border: isPressed
          ? '2px solid #FFF'
          : isHeld
            ? '2px solid rgba(255,255,255,0.7)'
            : '1px solid rgba(255,255,255,0.12)',
        transform: active ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 150ms ease-out, opacity 150ms ease, border 150ms ease',
        textShadow: color === '#FFFFFF' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
        animation: isHeld
          ? 'key-quiver 0.3s ease-in-out infinite'
          : isPressed
            ? 'key-tap 0.15s ease-out forwards'
            : 'none',
        boxShadow: active
          ? `inset 0 2px 6px rgba(0,0,0,0.5), 0 0 12px ${bg}66`
          : 'none',
      }}
    >
      {note}
    </div>
  );
}

function NoteChipRow({ notes, pressedNotes, heldNotes, rootKey }: { notes: NoteName[]; pressedNotes?: Set<NoteName>; heldNotes?: Set<NoteName>; rootKey: NoteName }) {
  const hasAnimation = (pressedNotes && pressedNotes.size > 0) || (heldNotes && heldNotes.size > 0);
  return (
    <div className="flex gap-1.5">
      {notes.map((note, i) => (
        <NoteChip
          key={`${note}-${i}`}
          note={note}
          isPressed={hasAnimation ? pressedNotes?.has(note) : undefined}
          isHeld={hasAnimation ? heldNotes?.has(note) : undefined}
          rootKey={rootKey}
        />
      ))}
    </div>
  );
}

export type ChordMode = 'single' | 'progression';

interface ChordSelectorProps {
  chordMode: ChordMode;
  onChordModeChange: (mode: ChordMode) => void;
  category: ChordCategory;
  onCategoryChange: (cat: ChordCategory) => void;
  // Degree-based categories (triads, 7ths, extended, sus-add, power)
  chords: Chord[];
  activeDegree: number | null;
  onChordSelect: (degree: number | null) => void;
  // Extended sub-type
  extendedType: '9' | '11' | '13';
  onExtendedTypeChange: (t: '9' | '11' | '13') => void;
  // Sus/Add sub-type
  susAddIndex: number;
  onSusAddIndexChange: (i: number) => void;
  // Power sub-type
  powerIndex: number;
  onPowerIndexChange: (i: number) => void;
  // Intervals mode
  activeInterval: Interval | null;
  onIntervalSelect: (interval: Interval | null) => void;
  intervalRoot: NoteName;
  intervalNotes: NoteName[];
  // Progression mode
  selectedMode: Mode;
  activeProgressionId: number | null;
  isProgressionPlaying: boolean;
  repeats: number;
  onProgressionSelect: (id: number) => void;
  onRepeatsChange: (r: number) => void;
  resolvedProgressionChords: ResolvedChord[];
  currentChordIndex: number;
  pressedNoteNames: Set<NoteName>;
  heldNoteNames: Set<NoteName>;
  selectedKey: NoteName;
}

const CATEGORIES: { id: ChordCategory; label: string }[] = [
  { id: 'triads', label: 'Triads' },
  { id: 'sevenths', label: '7ths' },
  { id: 'extended', label: 'Extended' },
  { id: 'intervals', label: 'Intervals' },
  { id: 'sus-add', label: 'Sus/Add' },
  { id: 'power', label: 'Power' },
];

const PROGRESSION_CATEGORIES: { id: ChordCategory; label: string }[] = [
  { id: 'triads', label: 'Triads' },
  { id: 'sevenths', label: '7ths' },
  { id: 'extended', label: 'Extended' },
];

const SUS_ADD_LABELS = ['sus2', 'sus4', 'add9', 'add11', '6th', '6/9', '7sus4'];
const POWER_LABELS = ['5th', '5th + oct'];

export default function ChordSelector({
  chordMode,
  onChordModeChange,
  category,
  onCategoryChange,
  chords,
  activeDegree,
  onChordSelect,
  extendedType,
  onExtendedTypeChange,
  susAddIndex,
  onSusAddIndexChange,
  powerIndex,
  onPowerIndexChange,
  activeInterval,
  onIntervalSelect,
  intervalRoot,
  intervalNotes,
  selectedMode,
  activeProgressionId,
  isProgressionPlaying,
  repeats,
  onProgressionSelect,
  onRepeatsChange,
  resolvedProgressionChords,
  currentChordIndex,
  pressedNoteNames,
  heldNoteNames,
  selectedKey,
}: ChordSelectorProps) {
  const activeChord = activeDegree !== null && category !== 'intervals' ? chords[activeDegree] : null;

  const activeProgression = activeProgressionId !== null
    ? PROGRESSIONS.find(p => p.id === activeProgressionId) ?? null
    : null;

  // Filter progressions for progression mode
  const filteredProgressions = PROGRESSIONS.filter(p => {
    if (p.mode !== selectedMode) return false;
    if (p.chordCategory !== category) return false;
    if (p.chordCategory === 'extended' && p.extendedType !== extendedType) return false;
    return true;
  });

  const categoryTabs = chordMode === 'progression' ? PROGRESSION_CATEGORIES : CATEGORIES;

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#131320', border: '1px solid #1E1E2E' }}
    >
      <div className="text-sm font-semibold tracking-widest mb-3" style={{ color: '#4A4A5E' }}>
        CHORDS
      </div>

      {/* Single / Progression toggle */}
      <div className="flex gap-1.5 mb-3" data-nav-group>
        {(['single', 'progression'] as ChordMode[]).map(mode => {
          const isActive = chordMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onChordModeChange(mode)}
              className="flex-1 rounded-lg font-bold py-2 transition-all duration-150"
              style={{
                fontSize: 14,
                background: isActive ? '#1E1E30' : 'transparent',
                border: isActive ? '1.5px solid rgba(255,255,255,0.85)' : '1.5px solid #1A1A28',
                color: isActive ? '#E8E8F0' : '#4A4A5E',
              }}
            >
              {mode === 'single' ? 'Single' : 'Progression'}
            </button>
          );
        })}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-3" data-nav-group>
        {categoryTabs.map(cat => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-150"
              style={{
                fontSize: 13,
                background: isActive ? '#1E1E30' : 'transparent',
                border: isActive ? '1px solid #2E2E45' : '1px solid #1A1A28',
                color: isActive ? '#E8E8F0' : '#5A5A6E',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ═══ SINGLE MODE ═══ */}
      {chordMode === 'single' && (
        <>
          {/* Sub-type selectors */}
          {category === 'extended' && (
            <div className="flex gap-1.5 mb-3" data-nav-group>
              {(['9', '11', '13'] as const).map(t => {
                const isActive = extendedType === t;
                return (
                  <button
                    key={t}
                    onClick={() => onExtendedTypeChange(t)}
                    className="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-150"
                    style={{
                      fontSize: 13,
                      background: isActive ? '#1E1E30' : 'transparent',
                      border: isActive ? '1px solid #2E2E45' : '1px solid #1A1A28',
                      color: isActive ? '#E8E8F0' : '#5A5A6E',
                    }}
                  >
                    {t}ths
                  </button>
                );
              })}
            </div>
          )}

          {category === 'sus-add' && (
            <div className="flex gap-1.5 mb-3" data-nav-group>
              {SUS_ADD_LABELS.map((label, i) => {
                const isActive = susAddIndex === i;
                return (
                  <button
                    key={label}
                    onClick={() => onSusAddIndexChange(i)}
                    className="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-150"
                    style={{
                      fontSize: 13,
                      background: isActive ? '#1E1E30' : 'transparent',
                      border: isActive ? '1px solid #2E2E45' : '1px solid #1A1A28',
                      color: isActive ? '#E8E8F0' : '#5A5A6E',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {category === 'power' && (
            <div className="flex gap-1.5 mb-3" data-nav-group>
              {POWER_LABELS.map((label, i) => {
                const isActive = powerIndex === i;
                return (
                  <button
                    key={label}
                    onClick={() => onPowerIndexChange(i)}
                    className="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-150"
                    style={{
                      fontSize: 13,
                      background: isActive ? '#1E1E30' : 'transparent',
                      border: isActive ? '1px solid #2E2E45' : '1px solid #1A1A28',
                      color: isActive ? '#E8E8F0' : '#5A5A6E',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Degree-based chord buttons */}
          {category !== 'intervals' && (
            <>
              <div className="flex gap-1.5 flex-wrap" data-nav-group>
                {chords.map(chord => {
                  const isActive = chord.degree === activeDegree;
                  return (
                    <button
                      key={chord.degree}
                      onClick={() => onChordSelect(isActive ? null : chord.degree)}
                      className="px-2.5 py-1.5 rounded-lg font-mono transition-all duration-150"
                      style={{
                        background: isActive ? '#1E1E35' : '#0F0F18',
                        border: isActive ? '1.5px solid rgba(255,255,255,0.85)' : '1px solid #1A1A28',
                        color: isActive ? '#FFF' : '#6A6A7E',
                        fontSize: 12,
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <span className="font-bold">{chord.numeral}</span>
                      <span className="ml-1.5 opacity-50" style={{ fontSize: 10 }}>
                        {chord.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeChord && (
                <div className="mt-3 pt-2" style={{ borderTop: '1px solid #1A1A28' }}>
                  <div className="text-xs mb-1.5" style={{ color: '#7A7A8E' }}>
                    <span className="font-bold" style={{ color: '#E8E8F0' }}>{activeChord.numeral}</span>
                    <span className="mx-1">&middot;</span>
                    Notes: {activeChord.notes.join(' \u00B7 ')}
                  </div>
                  <NoteChipRow notes={activeChord.notes} pressedNotes={pressedNoteNames} heldNotes={heldNoteNames} rootKey={selectedKey} />
                </div>
              )}
            </>
          )}

          {/* Intervals mode */}
          {category === 'intervals' && (
            <>
              <div className="text-xs mb-2 text-center" style={{ color: '#7A7A8E' }}>
                Root: <span className="font-bold" style={{ color: '#E8E8F0' }}>{intervalRoot}</span>
                <span className="ml-2" style={{ color: '#4A4A5E' }}>
                  Tap grid key to change root
                </span>
              </div>
              <div className="flex gap-1.5 flex-wrap" data-nav-group>
                {INTERVALS.map(interval => {
                  const isActive = activeInterval?.semitones === interval.semitones;
                  return (
                    <button
                      key={interval.semitones}
                      onClick={() => onIntervalSelect(isActive ? null : interval)}
                      className="px-2 py-1.5 rounded-lg transition-all duration-150"
                      style={{
                        background: isActive ? '#1E1E35' : '#0F0F18',
                        border: isActive ? '1.5px solid rgba(255,255,255,0.85)' : '1px solid #1A1A28',
                        color: isActive ? '#FFF' : '#6A6A7E',
                        fontSize: 11,
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      <span className="font-bold">{interval.shortName}</span>
                      <span className="ml-1 opacity-50" style={{ fontSize: 9 }}>
                        {interval.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {activeInterval && (
                <div className="mt-3 pt-2" style={{ borderTop: '1px solid #1A1A28' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: '#6A6A7E' }}>
                      {activeInterval.name}:
                    </span>
                    <NoteChipRow notes={intervalNotes} pressedNotes={pressedNoteNames} heldNotes={heldNoteNames} rootKey={selectedKey} />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ═══ PROGRESSION MODE ═══ */}
      {chordMode === 'progression' && (
        <>
          {/* Extended sub-type selector */}
          {category === 'extended' && (
            <div className="flex gap-1.5 mb-3" data-nav-group>
              {(['9', '11', '13'] as const).map(t => {
                const isActive = extendedType === t;
                return (
                  <button
                    key={t}
                    onClick={() => onExtendedTypeChange(t)}
                    className="flex-1 py-1.5 rounded-lg font-semibold transition-all duration-150"
                    style={{
                      fontSize: 13,
                      background: isActive ? '#1E1E30' : 'transparent',
                      border: isActive ? '1px solid #2E2E45' : '1px solid #1A1A28',
                      color: isActive ? '#E8E8F0' : '#5A5A6E',
                    }}
                  >
                    {t}ths
                  </button>
                );
              })}
            </div>
          )}

          {/* Progression buttons */}
          {filteredProgressions.length > 0 ? (
            <div className="flex gap-1.5 flex-wrap" data-nav-group>
              {filteredProgressions.map(prog => {
                const isActive = prog.id === activeProgressionId;
                const isPlaying = isActive && isProgressionPlaying;
                return (
                  <button
                    key={prog.id}
                    onClick={() => onProgressionSelect(prog.id)}
                    className="px-2.5 py-1.5 rounded-lg font-mono transition-all duration-150"
                    style={{
                      background: isActive ? '#1E1E35' : '#0F0F18',
                      border: isPlaying
                        ? '1.5px solid rgba(255,255,255,0.85)'
                        : isActive
                          ? '1px solid #3A3A55'
                          : '1px solid #1A1A28',
                      color: isActive ? '#FFF' : '#6A6A7E',
                      fontSize: 12,
                      transform: isActive ? 'scale(1.05)' : 'scale(1)',
                    }}
                  >
                    <span className="font-bold">{prog.name}</span>
                    {isPlaying && (
                      <span className="ml-1.5" style={{ color: '#5AE85A', fontSize: 10 }}>
                        {'\u25B6'}
                      </span>
                    )}
                    {isActive && !isProgressionPlaying && (
                      <span className="ml-1.5" style={{ color: '#6A6A7E', fontSize: 10 }}>
                        {'\u23F8'}
                      </span>
                    )}
                    <div
                      className="mt-0.5 font-normal"
                      style={{ fontSize: 10, color: isActive ? '#7A7A8E' : '#4A4A5E' }}
                    >
                      {prog.numerals.join(' \u2013 ')}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-center py-2" style={{ color: '#4A4A5E' }}>
              No progressions for this selection
            </div>
          )}

          {/* Chord note chips — 2-column grid */}
          {activeProgressionId !== null && resolvedProgressionChords.length > 0 && (
            <div className="mt-3 pt-2" style={{ borderTop: '1px solid #1A1A28' }}>
              <div className="flex flex-col gap-2">
                {Array.from(
                  { length: Math.ceil(resolvedProgressionChords.length / 2) },
                  (_, rowIdx) => {
                    const leftIdx = rowIdx * 2;
                    const rightIdx = rowIdx * 2 + 1;
                    const left = resolvedProgressionChords[leftIdx];
                    const right = resolvedProgressionChords[rightIdx];
                    const isLeftActive = isProgressionPlaying && leftIdx === currentChordIndex;
                    const isRightActive = isProgressionPlaying && rightIdx === currentChordIndex;
                    return (
                      <div key={rowIdx} className="flex items-center gap-2">
                        {/* Left chord */}
                        <div
                          className="flex-1 min-w-0 rounded-lg px-2 py-1.5 transition-all duration-200"
                          style={{
                            background: isLeftActive ? '#1A1A30' : 'transparent',
                            opacity: isProgressionPlaying && !isLeftActive ? 0.45 : 1,
                          }}
                        >
                          <div className="text-xs mb-1 flex items-center gap-1.5">
                            {isLeftActive && (
                              <span style={{ color: '#5AE85A', fontSize: 8 }}>{'\u25B6'}</span>
                            )}
                            <span className="font-bold" style={{ color: isLeftActive ? '#E8E8F0' : '#7A7A8E' }}>
                              {activeProgression?.numerals[leftIdx]}
                            </span>
                            <span style={{ color: '#4A4A5E', fontSize: 10 }}>
                              {left.name}
                            </span>
                          </div>
                          <NoteChipRow
                            notes={left.notes}
                            pressedNotes={isLeftActive ? pressedNoteNames : undefined}
                            heldNotes={isLeftActive ? heldNoteNames : undefined}
                            rootKey={selectedKey}
                          />
                        </div>
                        {right && (
                          <div
                            className="flex-1 min-w-0 rounded-lg px-2 py-1.5 transition-all duration-200"
                            style={{
                              background: isRightActive ? '#1A1A30' : 'transparent',
                              opacity: isProgressionPlaying && !isRightActive ? 0.45 : 1,
                            }}
                          >
                            <div className="text-xs mb-1 flex items-center gap-1.5">
                              {isRightActive && (
                                <span style={{ color: '#5AE85A', fontSize: 8 }}>{'\u25B6'}</span>
                              )}
                              <span className="font-bold" style={{ color: isRightActive ? '#E8E8F0' : '#7A7A8E' }}>
                                {activeProgression?.numerals[rightIdx]}
                              </span>
                              <span style={{ color: '#4A4A5E', fontSize: 10 }}>
                                {right.name}
                              </span>
                            </div>
                            <NoteChipRow
                              notes={right.notes}
                              pressedNotes={isRightActive ? pressedNoteNames : undefined}
                              heldNotes={isRightActive ? heldNoteNames : undefined}
                              rootKey={selectedKey}
                            />
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Repeats slider — visible when a progression is active */}
          {activeProgressionId !== null && (
            <div className="mt-3 pt-2" style={{ borderTop: '1px solid #1A1A28' }}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium" style={{ color: '#6A6A7E', minWidth: 52 }}>
                  Repeats
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={repeats}
                  onChange={e => onRepeatsChange(Number(e.target.value))}
                  className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3A3A55 ${((repeats - 1) / 9) * 100}%, #1A1A28 ${((repeats - 1) / 9) * 100}%)`,
                    accentColor: '#5A5A75',
                  }}
                />
                <span
                  className="text-xs font-mono font-bold"
                  style={{ color: '#E8E8F0', minWidth: 20, textAlign: 'right' }}
                >
                  {repeats}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
