import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import type { NoteName } from '../types';
import { getTemperatureColor, getTemperatureTextColor } from '../engine/colors';
import { CHROMATIC } from '../engine/theory';

// ─── Piano key dimensions ───
const WHITE_W = 40;
const WHITE_H = 160;
const BLACK_W = 26;
const BLACK_H = 100;
const KEY_GAP = 2;

// ─── Build the 25-key layout (C3 to C5) ───
const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

interface PianoKeyData {
  pitch: number;
  note: NoteName;
  isBlack: boolean;
}

const PIANO_NATURAL_WIDTH = 15 * WHITE_W + 14 * KEY_GAP; // 15 white keys always

/** Compute the left offset for a black key based on which white keys surround it */
function getBlackKeyLeft(pitch: number, whiteKeys: PianoKeyData[]): number {
  const whitesBefore = whiteKeys.filter(k => k.pitch < pitch).length;
  const prevWhiteLeft = (whitesBefore - 1) * (WHITE_W + KEY_GAP);
  const gapCenter = prevWhiteLeft + WHITE_W + KEY_GAP / 2;
  return gapCenter - BLACK_W / 2;
}

// ─── Props ───

interface PianoKeyboardProps {
  rootKey: NoteName;
  scaleNotes: NoteName[];
  highlightedNotes: NoteName[];
  activeChordName?: string;
  onKeyClick?: (note: NoteName) => void;
  /** Pitch indices in grid space (0-24, same as EasyPlay) for key animation */
  pressedPitches?: Set<number>;
  /** Pitch indices in grid space (0-24, same as EasyPlay) for key animation */
  heldPitches?: Set<number>;
  midiPressedPitches?: Set<number>;
}

// ─── Colored Chip (matches NoteChip in ChordSelector) ───

function NoteChip({ note, isPressed, isHeld, rootKey, inScale, dimmed }: {
  note: NoteName;
  isPressed?: boolean;
  isHeld?: boolean;
  rootKey: NoteName;
  inScale: boolean;
  dimmed?: boolean;
}) {
  const bg = getTemperatureColor(note, rootKey);
  const color = getTemperatureTextColor(note, rootKey);
  const active = isPressed || isHeld;
  const muted = !inScale && !active;
  const showRing = inScale && !active && !dimmed;

  // Ring: outer glow + transparent gap + inset ring (no white ring)
  const ringLayers = showRing
    ? [
        `0 0 0 2px oklch(from ${bg} 0.85 0.15 h)`,
      ].join(', ')
    : '';

  return (
    <div
      className="inline-flex items-center justify-center rounded font-bold"
      style={{
        width: 24,
        height: 24,
        minWidth: 24,
        minHeight: 24,
        background: muted ? `oklch(from ${bg} 0.52 0.035 h)` : bg,
        color: muted ? `oklch(from ${bg} 0.84 0.04 h)` : color,
        fontSize: 9,
        opacity: dimmed ? 0.2 : 1,
        border: isPressed
          ? '2px solid #FFF'
          : isHeld
            ? '2px solid rgba(255,255,255,0.7)'
            : 'none',
        transform: active ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 150ms ease-out, opacity 200ms ease',
        textShadow: !muted && color === '#FFFFFF' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
        animation: isHeld
          ? 'key-quiver 0.3s ease-in-out infinite'
          : isPressed
            ? 'key-tap 0.15s ease-out forwards'
            : 'none',
        boxShadow: active
          ? `inset 0 2px 6px rgba(0,0,0,0.5), 0 0 12px oklch(from ${bg} l c h / 0.4)`
          : muted
            ? 'inset 0 2px 4px rgba(0,0,0,0.45)'
            : ringLayers || 'none',
      }}
    >
      {note}
    </div>
  );
}

// ─── Individual Piano Key (clean, no dots, no dimming) ───

function PianoKey({
  isBlack,
  onClick,
  isPressed,
  isHeld,
  isMidiPressed,
  noteColor,
  inScale,
  dimmed,
}: {
  isBlack: boolean;
  onClick?: () => void;
  isPressed?: boolean;
  isHeld?: boolean;
  isMidiPressed?: boolean;
  noteColor?: string;
  inScale: boolean;
  dimmed?: boolean;
}) {
  const active = isPressed || isHeld;

  // Active (pressed/held): hue-matched color wash
  // Dimmed (chord active, not in chord): faded
  // In-scale at rest: bright white / dark black
  // Out-of-scale at rest: match chip muted color
  let bg: string;
  if (active && noteColor) {
    bg = `oklch(from ${noteColor} ${isBlack ? '0.45' : '0.85'} ${isBlack ? '0.14' : '0.08'} h)`;
  } else if (dimmed) {
    bg = isBlack ? '#1A1A1A' : '#888';
  } else if (isBlack) {
    bg = inScale
      ? 'linear-gradient(to bottom, #1A1A1A, #0A0A0A)'
      : (noteColor ? `oklch(from ${noteColor} 0.30 0.035 h)` : '#2A2A2A');
  } else {
    bg = inScale
      ? '#FFFFFF'
      : '#C0C0C0';
  }

  return (
    <div
      onClick={onClick}
      style={{
        width: isBlack ? BLACK_W : WHITE_W,
        height: isBlack ? BLACK_H : WHITE_H,
        background: bg,
        borderRadius: isBlack ? '0 0 4px 4px' : '0 0 6px 6px',
        border: isMidiPressed
          ? (isBlack ? '1.5px solid #00E5FF' : '2.5px solid #00E5FF')
          : isPressed
            ? (isBlack ? '1.5px solid #FFF' : '2.5px solid #FFF')
            : isHeld
              ? (isBlack ? '1.5px solid rgba(255,255,255,0.7)' : '2.5px solid rgba(255,255,255,0.7)')
              : isBlack
                ? (inScale ? '1px solid #444' : '1px solid #333')
                : (inScale ? '1px solid #DDD' : '1px solid #AAA'),
        cursor: onClick ? 'pointer' : 'default',
        transform: active ? 'scaleY(0.99)' : 'scaleY(1)',
        transformOrigin: 'top',
        transition: 'transform 100ms ease-out, box-shadow 150ms ease-out, background 100ms ease',
        boxShadow: isMidiPressed
          ? '0 0 20px #00E5FF88'
          : isBlack
            ? '0 2px 4px rgba(0,0,0,0.5)'
            : '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: isBlack ? 10 : 1,
        animation: isHeld
          ? 'piano-quiver 0.3s ease-in-out infinite'
          : isPressed
            ? 'piano-tap 0.15s ease-out forwards'
            : 'none',
      }}
    />
  );
}

// ─── Main Component ───

export default function PianoKeyboard({
  rootKey,
  scaleNotes,
  highlightedNotes,
  activeChordName,
  onKeyClick,
  pressedPitches,
  heldPitches,
  midiPressedPitches,
}: PianoKeyboardProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // ─── Fixed key data (C3–C5, never transposes) ───
  const gridOffset = CHROMATIC.indexOf(rootKey);
  const allPianoKeys = useMemo(() => {
    return Array.from({ length: 25 }, (_, pitch) => ({
      pitch,
      note: CHROMATIC[pitch % 12] as NoteName,
      isBlack: BLACK_SEMITONES.has(pitch % 12),
    }));
  }, []);

  // Convert grid-space pitch sets to piano-space (shift by root offset)
  const toPianoSet = useCallback((gridSet: Set<number> | undefined) => {
    if (!gridSet || gridSet.size === 0) return undefined;
    const s = new Set<number>();
    for (const p of gridSet) {
      const pp = p + gridOffset;
      if (pp >= 0 && pp <= 24) s.add(pp);
    }
    return s;
  }, [gridOffset]);

  const pianoPressed = useMemo(() => toPianoSet(pressedPitches), [pressedPitches, toPianoSet]);
  const pianoHeld = useMemo(() => toPianoSet(heldPitches), [heldPitches, toPianoSet]);

  const whiteKeys = useMemo(() => allPianoKeys.filter(k => !k.isBlack), [allPianoKeys]);
  const blackKeysData = useMemo(() => allPianoKeys.filter(k => k.isBlack), [allPianoKeys]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (!w) return;
      const padding = 16; // account for panel padding (px-2 = 8px each side)
      const available = Math.min(w - padding, 900);
      setZoom(available / PIANO_NATURAL_WIDTH);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="rounded-xl px-2 py-3"
      style={{ background: '#131320', border: '1px solid #1E1E2E' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm font-semibold tracking-widest"
          style={{ color: '#4A4A5E' }}
        >
          PIANO
        </span>
        {activeChordName && (
          <span className="text-sm font-bold" style={{ color: '#E8E8F0' }}>
            {activeChordName}
          </span>
        )}
      </div>

      <div style={{ zoom }}>
        {/* Black key note chips — row above the keyboard, centered over each black key */}
        <div className="relative" style={{ width: PIANO_NATURAL_WIDTH, height: 24, marginBottom: 6 }}>
          {blackKeysData.map((k) => (
            <div
              key={`chip-b-${k.pitch}`}
              className="absolute flex justify-center"
              style={{
                left: getBlackKeyLeft(k.pitch, whiteKeys),
                width: BLACK_W,
                top: 0,
              }}
            >
              <NoteChip
                note={k.note}
                isPressed={pianoPressed?.has(k.pitch)}
                isHeld={pianoHeld?.has(k.pitch)}
                rootKey={rootKey}
                inScale={scaleNotes.includes(k.note)}
                dimmed={highlightedNotes.length > 0 && !highlightedNotes.includes(k.note)}
              />
            </div>
          ))}
        </div>

        {/* Piano keys */}
        <div className="relative" style={{ width: PIANO_NATURAL_WIDTH, height: WHITE_H }}>
          {/* White keys (rendered first, underneath) */}
          {whiteKeys.map((k, i) => (
            <div
              key={`w-${k.pitch}`}
              className="absolute"
              style={{ left: i * (WHITE_W + KEY_GAP), top: 0 }}
            >
              <PianoKey
                isBlack={false}
                onClick={onKeyClick ? () => onKeyClick(k.note) : undefined}
                isPressed={pianoPressed?.has(k.pitch)}
                isHeld={pianoHeld?.has(k.pitch)}
                isMidiPressed={midiPressedPitches?.has(k.pitch)}
                noteColor={getTemperatureColor(k.note, rootKey)}
                inScale={scaleNotes.includes(k.note)}
                dimmed={highlightedNotes.length > 0 && !highlightedNotes.includes(k.note)}
              />
            </div>
          ))}

          {/* Black keys (rendered second, on top) */}
          {blackKeysData.map((k) => (
            <div
              key={`b-${k.pitch}`}
              className="absolute"
              style={{ left: getBlackKeyLeft(k.pitch, whiteKeys), top: 0 }}
            >
              <PianoKey
                isBlack
                onClick={onKeyClick ? () => onKeyClick(k.note) : undefined}
                isPressed={pianoPressed?.has(k.pitch)}
                isHeld={pianoHeld?.has(k.pitch)}
                isMidiPressed={midiPressedPitches?.has(k.pitch)}
                noteColor={getTemperatureColor(k.note, rootKey)}
                inScale={scaleNotes.includes(k.note)}
                dimmed={highlightedNotes.length > 0 && !highlightedNotes.includes(k.note)}
              />
            </div>
          ))}
        </div>

        {/* White key note chips — row below the keyboard, centered under each white key */}
        <div className="relative" style={{ width: PIANO_NATURAL_WIDTH, height: 24, marginTop: 6 }}>
          {whiteKeys.map((k, i) => (
            <div
              key={`chip-w-${k.pitch}`}
              className="absolute flex justify-center"
              style={{
                left: i * (WHITE_W + KEY_GAP),
                width: WHITE_W,
                top: 0,
              }}
            >
              <NoteChip
                note={k.note}
                isPressed={pianoPressed?.has(k.pitch)}
                isHeld={pianoHeld?.has(k.pitch)}
                rootKey={rootKey}
                inScale={scaleNotes.includes(k.note)}
                dimmed={highlightedNotes.length > 0 && !highlightedNotes.includes(k.note)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <span style={{ fontSize: 10, color: '#3E3E52' }}>C3 — C5 (25 keys)</span>
      </div>
    </div>
  );
}
