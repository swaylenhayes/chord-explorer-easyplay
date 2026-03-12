import { useRef, useState, useEffect } from 'react';
import type { NoteName } from '../types';
import { getNoteColor, getTextColor } from '../engine/colors';
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

const ALL_PIANO_KEYS: PianoKeyData[] = Array.from({ length: 25 }, (_, pitch) => ({
  pitch,
  note: CHROMATIC[pitch % 12] as NoteName,
  isBlack: BLACK_SEMITONES.has(pitch % 12),
}));

const WHITE_KEYS = ALL_PIANO_KEYS.filter(k => !k.isBlack);
const BLACK_KEYS_DATA = ALL_PIANO_KEYS.filter(k => k.isBlack);

const PIANO_NATURAL_WIDTH = WHITE_KEYS.length * WHITE_W + (WHITE_KEYS.length - 1) * KEY_GAP;

/** Compute the left offset for a black key based on which white keys surround it */
function getBlackKeyLeft(pitch: number): number {
  const whitesBefore = WHITE_KEYS.filter(k => k.pitch < pitch).length;
  const prevWhiteLeft = (whitesBefore - 1) * (WHITE_W + KEY_GAP);
  const gapCenter = prevWhiteLeft + WHITE_W + KEY_GAP / 2;
  return gapCenter - BLACK_W / 2;
}

// ─── Props ───

interface PianoKeyboardProps {
  highlightedNotes: NoteName[];
  scaleNotes: NoteName[];
  activeChordName?: string;
  onKeyClick?: (note: NoteName) => void;
  /** Pitch indices in piano space (0=C3, already offset by rootKey) for key animation */
  pressedPitches?: Set<number>;
  /** Pitch indices in piano space (0=C3, already offset by rootKey) for key animation */
  heldPitches?: Set<number>;
  midiPressedPitches?: Set<number>;
}

// ─── Colored Chip (matches NoteChip in ChordSelector) ───

function NoteChip({ note, isPressed, isHeld }: {
  note: NoteName;
  isPressed?: boolean;
  isHeld?: boolean;
}) {
  const bg = getNoteColor(note);
  const color = getTextColor(note);
  const active = isPressed || isHeld;
  // Non-active chips stay in their default look — no dimming, no outline changes
  return (
    <div
      className="inline-flex items-center justify-center rounded font-bold"
      style={{
        width: 24,
        height: 24,
        background: bg,
        color,
        fontSize: 9,
        border: active
          ? (isPressed ? '2px solid #FFF' : '2px solid rgba(255,255,255,0.7)')
          : '1px solid rgba(255,255,255,0.12)',
        transform: active ? 'scale(0.92)' : 'scale(1)',
        transition: 'transform 150ms ease-out, border 150ms ease',
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

// ─── Individual Piano Key (clean, no dots, no dimming) ───

function PianoKey({
  isBlack,
  onClick,
  isPressed,
  isHeld,
  isMidiPressed,
}: {
  isBlack: boolean;
  onClick?: () => void;
  isPressed?: boolean;
  isHeld?: boolean;
  isMidiPressed?: boolean;
}) {
  const active = isPressed || isHeld;

  const bg = active
    ? (isBlack ? '#333' : '#D8D8D8')
    : isBlack ? '#1A1A1A' : '#F0F0F0';

  return (
    <div
      onClick={onClick}
      style={{
        width: isBlack ? BLACK_W : WHITE_W,
        height: isBlack ? BLACK_H : WHITE_H,
        background: bg,
        borderRadius: isBlack ? '0 0 4px 4px' : '0 0 6px 6px',
        border: isMidiPressed
          ? '2.5px solid #00E5FF'
          : isPressed
            ? '2.5px solid #FFF'
            : isHeld
              ? '2.5px solid rgba(255,255,255,0.7)'
              : isBlack
                ? '1px solid #333'
                : '1px solid #CCC',
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
  activeChordName,
  onKeyClick,
  pressedPitches,
  heldPitches,
  midiPressedPitches,
}: PianoKeyboardProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (!w) return;
      const padding = 40; // account for panel padding (p-5 = 20px each side)
      setZoom((w - padding) / PIANO_NATURAL_WIDTH);
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={panelRef}
      className="rounded-xl p-5"
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
        <div className="relative" style={{ width: PIANO_NATURAL_WIDTH, height: 28, marginBottom: 6 }}>
          {BLACK_KEYS_DATA.map((k) => (
            <div
              key={`chip-b-${k.pitch}`}
              className="absolute flex justify-center"
              style={{
                left: getBlackKeyLeft(k.pitch),
                width: BLACK_W,
                top: 0,
              }}
            >
              <NoteChip
                note={k.note}
                isPressed={pressedPitches?.has(k.pitch)}
                isHeld={heldPitches?.has(k.pitch)}
              />
            </div>
          ))}
        </div>

        {/* Piano keys */}
        <div className="relative" style={{ width: PIANO_NATURAL_WIDTH, height: WHITE_H }}>
          {/* White keys (rendered first, underneath) */}
          {WHITE_KEYS.map((k, i) => (
            <div
              key={`w-${k.pitch}`}
              className="absolute"
              style={{ left: i * (WHITE_W + KEY_GAP), top: 0 }}
            >
              <PianoKey
                isBlack={false}
                onClick={onKeyClick ? () => onKeyClick(k.note) : undefined}
                isPressed={pressedPitches?.has(k.pitch)}
                isHeld={heldPitches?.has(k.pitch)}
                isMidiPressed={midiPressedPitches?.has(k.pitch)}
              />
            </div>
          ))}

          {/* Black keys (rendered second, on top) */}
          {BLACK_KEYS_DATA.map((k) => (
            <div
              key={`b-${k.pitch}`}
              className="absolute"
              style={{ left: getBlackKeyLeft(k.pitch), top: 0 }}
            >
              <PianoKey
                isBlack
                onClick={onKeyClick ? () => onKeyClick(k.note) : undefined}
                isPressed={pressedPitches?.has(k.pitch)}
                isHeld={heldPitches?.has(k.pitch)}
                isMidiPressed={midiPressedPitches?.has(k.pitch)}
              />
            </div>
          ))}
        </div>

        {/* White key note chips — row below the keyboard, centered under each white key */}
        <div className="relative" style={{ width: PIANO_NATURAL_WIDTH, height: 28, marginTop: 6 }}>
          {WHITE_KEYS.map((k, i) => (
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
                isPressed={pressedPitches?.has(k.pitch)}
                isHeld={heldPitches?.has(k.pitch)}
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
