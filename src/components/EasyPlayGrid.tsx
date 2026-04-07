import { useRef, useState, useEffect, useMemo } from 'react';
import type { NoteName, BlackKeyPosition } from '../types';
import { getTemperatureColor, getTemperatureTextColor } from '../engine/colors';
import {
  KEY_W, KEY_H, BLACK_W, BLACK_H, GAP, GRID_WIDTH,
  BLACK_ROW_1, BLACK_ROW_3, BLACK_ROW_5,
  WHITE_ROW_2, WHITE_ROW_4, WHITE_ROW_6,
  BLACK_ROW_1_PITCHES, BLACK_ROW_3_PITCHES, BLACK_ROW_5_PITCHES,
  WHITE_ROW_2_PITCHES, WHITE_ROW_4_PITCHES, WHITE_ROW_6_PITCHES,
  transposeWhiteRow, transposeBlackRow,
} from '../engine/grid';

/** Natural pixel width of the grid keys (white key row + left padding for Ab overhang) */
const GRID_NATURAL_WIDTH = GRID_WIDTH + BLACK_W / 2;

interface EasyPlayGridProps {
  rootKey: NoteName;
  highlightedNotes: NoteName[];
  scaleNotes: NoteName[];
  activeChordName?: string;
  onKeyClick?: (note: NoteName) => void;
  interactionRoot?: NoteName;
  chordRoot?: NoteName;
  pressedPitches?: Set<number>;
  heldPitches?: Set<number>;
  midiPressedPitches?: Set<number>;
}

function Key({
  note,
  isBlack,
  highlighted,
  dimmed,
  inScale,
  onClick,
  isRoot,
  scaleDegree,
  showRoot,
  isPressed,
  isHeld,
  isMidiPressed,
  rootKey,
}: {
  note: NoteName;
  isBlack: boolean;
  highlighted: boolean;
  dimmed: boolean;
  inScale: boolean;
  onClick?: () => void;
  isRoot?: boolean;
  scaleDegree?: number;
  showRoot?: boolean;
  isPressed?: boolean;
  isHeld?: boolean;
  isMidiPressed?: boolean;
  rootKey: NoteName;
}) {
  const w = isBlack ? BLACK_W : KEY_W;
  const h = isBlack ? BLACK_H : KEY_H;
  const bg = getTemperatureColor(note, rootKey);
  const textColor = getTemperatureTextColor(note, rootKey);

  // Separate tap vs held visuals
  const active = isPressed || isHeld;
  const outOfScale = !inScale && !highlighted && !dimmed && !isMidiPressed;
  // Show 3-layer ring on in-scale keys in default state
  const showRing = inScale && !highlighted && !active && !isMidiPressed && !dimmed && !isRoot;

  // Out-of-scale: muted background + pressed-in shadow
  const bgColor = outOfScale ? `oklch(from ${bg} 0.52 0.07 h)` : bg;
  const labelColor = outOfScale ? `oklch(from ${bg} 0.84 0.06 h)` : textColor;
  const outOfScaleShadow = outOfScale ? 'inset 0 2px 4px rgba(0,0,0,0.45)' : '';

  // In-scale ring stack + depth lift
  const ringLayers = showRing
    ? [
        `inset 0 0 0 1px oklch(from ${bg} 0.92 0.04 h)`,
        `inset 0 0 0 4px transparent`,
        `0 0 0 2px oklch(from ${bg} 0.85 0.15 h)`,
        `0 6px 14px -4px rgba(0,0,0,0.55)`,
      ].join(', ')
    : '';

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center select-none"
      data-key
      style={{
        width: w,
        height: h,
        borderRadius: isBlack ? 16 : 26,
        background: bgColor,
        opacity: dimmed && !isMidiPressed ? 0.2 : 1,
        transform: isMidiPressed
          ? 'scale(0.92)'
          : active
            ? 'scale(0.92)'
            : highlighted ? 'scale(1.12)'
              : showRing ? 'translateY(-1px)' : 'scale(1)',
        transition: 'transform 150ms ease-out, box-shadow 150ms ease-out, opacity 200ms ease',
        boxShadow: [
          isMidiPressed
            ? `0 0 20px #00E5FF88, inset 0 2px 6px rgba(0,0,0,0.5)`
            : active
              ? `inset 0 2px 6px rgba(0,0,0,0.5), 0 0 16px oklch(from ${bg} l c h / 0.4)`
              : highlighted
                ? `0 0 24px oklch(from ${bg} l c h / 0.6), 0 4px 16px rgba(0,0,0,0.4)`
                : ringLayers || outOfScaleShadow || '0 2px 8px rgba(0,0,0,0.2)',
          highlighted ? 'inset 0 0 0 1.5px #000' : '',
        ].filter(Boolean).join(', '),
        border: isMidiPressed
          ? '2.5px solid #00E5FF'
          : isPressed
            ? '2.5px solid #FFF'
            : isHeld
              ? '2.5px solid rgba(255,255,255,0.7)'
              : isRoot
                ? '2.5px solid #FFD700'
                : highlighted
                  ? '2.5px solid #FFF'
                  : 'none',
        zIndex: isMidiPressed ? 15 : highlighted || isRoot || active ? 10 : 1,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        animation: isHeld
          ? 'key-quiver 0.3s ease-in-out infinite'
          : isPressed
            ? 'key-tap 0.15s ease-out forwards'
            : 'none',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontSize: isBlack ? 11 : 16,
          color: labelColor,
          textShadow: !outOfScale && textColor === '#FFFFFF' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        {note}
      </span>

      {/* Bottom-left: chord root indicator */}
      {showRoot && !dimmed && (
        <span
          style={{
            position: 'absolute',
            bottom: isBlack ? 8 : 12,
            left: isBlack ? 8 : 12,
            fontSize: isBlack ? 8 : 10,
            fontWeight: 600,
            color: textColor,
            opacity: 0.5,
            lineHeight: 1,
          }}
        >
          R
        </span>
      )}

      {/* Bottom-right: scale degree number */}
      {scaleDegree && !dimmed && (
        <span
          style={{
            position: 'absolute',
            bottom: isBlack ? 8 : 12,
            right: isBlack ? 8 : 12,
            fontSize: isBlack ? 8 : 10,
            fontWeight: 600,
            color: textColor,
            opacity: 0.5,
            lineHeight: 1,
          }}
        >
          {scaleDegree}
        </span>
      )}
    </div>
  );
}

function BlackRow({
  keys,
  pitches,
  highlightedNotes,
  scaleNotes,
  hasActiveChord,
  onKeyClick,
  interactionRoot,
  chordRoot,
  pressedPitches,
  heldPitches,
  midiPressedPitches,
  rootKey,
}: {
  keys: BlackKeyPosition[];
  pitches: number[];
  highlightedNotes: NoteName[];
  scaleNotes: NoteName[];
  hasActiveChord: boolean;
  onKeyClick?: (note: NoteName) => void;
  interactionRoot?: NoteName;
  chordRoot?: NoteName;
  pressedPitches?: Set<number>;
  heldPitches?: Set<number>;
  midiPressedPitches?: Set<number>;
  rootKey: NoteName;
}) {
  return (
    <div className="relative" style={{ height: BLACK_H, width: GRID_WIDTH }}>
      {keys.map((bk, i) => {
        const degreeIdx = scaleNotes.indexOf(bk.note);
        const pitch = pitches[i];
        return (
          <div key={`${bk.note}-${i}`} className="absolute" style={{ left: bk.left, top: 0 }}>
            <Key
              note={bk.note}
              isBlack
              highlighted={highlightedNotes.includes(bk.note)}
              dimmed={hasActiveChord && !highlightedNotes.includes(bk.note)}
              inScale={degreeIdx >= 0}
              onClick={onKeyClick ? () => onKeyClick(bk.note) : undefined}
              isRoot={interactionRoot === bk.note}
              scaleDegree={degreeIdx >= 0 ? degreeIdx + 1 : undefined}
              showRoot={chordRoot === bk.note}
              isPressed={pressedPitches?.has(pitch)}
              isHeld={heldPitches?.has(pitch)}
              isMidiPressed={midiPressedPitches?.has(pitch)}
              rootKey={rootKey}
            />
          </div>
        );
      })}
    </div>
  );
}

function WhiteRow({
  notes,
  pitches,
  highlightedNotes,
  scaleNotes,
  hasActiveChord,
  onKeyClick,
  interactionRoot,
  chordRoot,
  pressedPitches,
  heldPitches,
  midiPressedPitches,
  rootKey,
}: {
  notes: NoteName[];
  pitches: number[];
  highlightedNotes: NoteName[];
  scaleNotes: NoteName[];
  hasActiveChord: boolean;
  onKeyClick?: (note: NoteName) => void;
  interactionRoot?: NoteName;
  chordRoot?: NoteName;
  pressedPitches?: Set<number>;
  heldPitches?: Set<number>;
  midiPressedPitches?: Set<number>;
  rootKey: NoteName;
}) {
  return (
    <div className="flex" style={{ gap: GAP }}>
      {notes.map((note, i) => {
        const degreeIdx = scaleNotes.indexOf(note);
        const pitch = pitches[i];
        return (
          <Key
            key={`${note}-${i}`}
            note={note}
            isBlack={false}
            highlighted={highlightedNotes.includes(note)}
            dimmed={hasActiveChord && !highlightedNotes.includes(note)}
            inScale={degreeIdx >= 0}
            onClick={onKeyClick ? () => onKeyClick(note) : undefined}
            isRoot={interactionRoot === note}
            scaleDegree={degreeIdx >= 0 ? degreeIdx + 1 : undefined}
            showRoot={chordRoot === note}
            isPressed={pressedPitches?.has(pitch)}
            isHeld={heldPitches?.has(pitch)}
            isMidiPressed={midiPressedPitches?.has(pitch)}
            rootKey={rootKey}
          />
        );
      })}
    </div>
  );
}

export default function EasyPlayGrid({
  rootKey,
  highlightedNotes,
  scaleNotes,
  activeChordName,
  onKeyClick,
  interactionRoot,
  chordRoot,
  pressedPitches,
  heldPitches,
  midiPressedPitches,
}: EasyPlayGridProps) {
  const hasActiveChord = highlightedNotes.length > 0;
  const panelRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);

  // Transpose grid rows based on the physical device pitch setting
  const tBlack1 = useMemo(() => transposeBlackRow(BLACK_ROW_1, rootKey), [rootKey]);
  const tWhite2 = useMemo(() => transposeWhiteRow(WHITE_ROW_2, rootKey), [rootKey]);
  const tBlack3 = useMemo(() => transposeBlackRow(BLACK_ROW_3, rootKey), [rootKey]);
  const tWhite4 = useMemo(() => transposeWhiteRow(WHITE_ROW_4, rootKey), [rootKey]);
  const tBlack5 = useMemo(() => transposeBlackRow(BLACK_ROW_5, rootKey), [rootKey]);
  const tWhite6 = useMemo(() => transposeWhiteRow(WHITE_ROW_6, rootKey), [rootKey]);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (!w) return;
      const maxZoom = 768 / GRID_NATURAL_WIDTH;
      setZoom(Math.min(maxZoom, Math.max(1, w / GRID_NATURAL_WIDTH)));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowProps = {
    highlightedNotes,
    scaleNotes,
    hasActiveChord,
    onKeyClick,
    interactionRoot,
    chordRoot,
    pressedPitches,
    heldPitches,
    midiPressedPitches,
    rootKey,
  };

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
          EASYPLAY1S
        </span>
        {activeChordName && (
          <span className="text-sm font-bold" style={{ color: '#E8E8F0' }}>
            {activeChordName}
          </span>
        )}
      </div>

      <div style={{ zoom, width: 'fit-content', margin: '0 auto' }}>
        <div
          className="flex flex-col items-start"
          style={{ gap: 4, paddingLeft: BLACK_W / 2 }}
        >
        {/* Rows 1-2 */}
        <BlackRow keys={tBlack1} pitches={BLACK_ROW_1_PITCHES} {...rowProps} />
        <WhiteRow notes={tWhite2} pitches={WHITE_ROW_2_PITCHES} {...rowProps} />

        {/* Rows 3-4 */}
        <div style={{ marginTop: 4 }}>
          <BlackRow keys={tBlack3} pitches={BLACK_ROW_3_PITCHES} {...rowProps} />
        </div>
        <WhiteRow notes={tWhite4} pitches={WHITE_ROW_4_PITCHES} {...rowProps} />

        {/* Rows 5-6 */}
        <div style={{ marginTop: 4 }}>
          <BlackRow keys={tBlack5} pitches={BLACK_ROW_5_PITCHES} {...rowProps} />
        </div>
        <WhiteRow notes={tWhite6} pitches={WHITE_ROW_6_PITCHES} {...rowProps} />
      </div>
      </div>

      <div className="mt-3 flex gap-4">
        <span style={{ fontSize: 10, color: '#3E3E52' }}>Rows 1-2: {tWhite2[0]}3-{tWhite2[4]}3</span>
        <span style={{ fontSize: 10, color: '#3E3E52' }}>Rows 3-4: {tWhite4[0]}3-{tWhite4[4]}4</span>
        <span style={{ fontSize: 10, color: '#3E3E52' }}>Rows 5-6: {tWhite6[0]}4-{tWhite6[4]}5</span>
      </div>
    </div>
  );
}
