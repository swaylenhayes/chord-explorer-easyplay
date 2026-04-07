import type { NoteName, BlackKeyPosition, GridKeyInfo } from '../types';
import { CHROMATIC, transposeNote } from './theory';

// Key dimensions matching the physical EasyPlay1S
export const KEY_W = 64;
export const KEY_H = 64;
export const BLACK_W = 39;
export const BLACK_H = 36;
export const GAP = 8;
export const COL_PITCH = KEY_W + GAP; // center-to-center between white keys

/**
 * Compute left-edge px so a black key centers on the gap
 * between white column `i` and column `i+1`.
 */
const gapCenter = (i: number): number =>
  i * COL_PITCH + KEY_W + (GAP - BLACK_W) / 2;

/** Left offset for the Ab key that hangs off the left edge of Row 3 */
const leftHang = -BLACK_W / 2 + 4;

// Row 1 (black) above Row 2 (C D E F G)
export const BLACK_ROW_1: BlackKeyPosition[] = [
  { note: 'C#', left: gapCenter(0) },
  { note: 'Eb', left: gapCenter(1) },
  { note: 'F#', left: gapCenter(3) },
];

// Row 3 (black) above Row 4 (A B C D E)
export const BLACK_ROW_3: BlackKeyPosition[] = [
  { note: 'Ab', left: leftHang },
  { note: 'Bb', left: gapCenter(0) },
  { note: 'C#', left: gapCenter(2) },
  { note: 'Eb', left: gapCenter(3) },
];

// Row 5 (black) above Row 6 (F G A B C)
export const BLACK_ROW_5: BlackKeyPosition[] = [
  { note: 'F#', left: gapCenter(0) },
  { note: 'Ab', left: gapCenter(1) },
  { note: 'Bb', left: gapCenter(2) },
];

// White key rows
export const WHITE_ROW_2: NoteName[] = ['C', 'D', 'E', 'F', 'G'];
export const WHITE_ROW_4: NoteName[] = ['A', 'B', 'C', 'D', 'E'];
export const WHITE_ROW_6: NoteName[] = ['F', 'G', 'A', 'B', 'C'];

/** Total pixel width of a white key row (5 keys + 4 gaps) */
export const GRID_WIDTH = 5 * KEY_W + 4 * GAP;

// ─── Pitch-indexed key map ───
// Each physical key gets a unique chromatic pitch (0 = C3, 24 = C5).
// This is used by the voicing pattern system to identify specific keys.

/** Convert note name to semitone offset (0-11) */
function semitone(note: NoteName): number {
  return CHROMATIC.indexOf(note);
}

/**
 * All 25 physical keys in pitch order (C3 to C5).
 * Row numbers match the visual grid: 1-2 (top pair), 3-4 (middle pair), 5-6 (bottom pair).
 * Black key rows are odd, white key rows are even.
 */
export const GRID_KEYS: GridKeyInfo[] = [
  // Row 2 (white): C D E F G — octave 3 (pitch 0-7)
  // Row 1 (black): C# Eb F# — octave 3
  { note: 'C',  pitch: semitone('C'),       row: 2, isBlack: false },  // 0
  { note: 'C#', pitch: semitone('C#'),      row: 1, isBlack: true  },  // 1
  { note: 'D',  pitch: semitone('D'),       row: 2, isBlack: false },  // 2
  { note: 'Eb', pitch: semitone('Eb'),      row: 1, isBlack: true  },  // 3
  { note: 'E',  pitch: semitone('E'),       row: 2, isBlack: false },  // 4
  { note: 'F',  pitch: semitone('F'),       row: 2, isBlack: false },  // 5
  { note: 'F#', pitch: semitone('F#'),      row: 1, isBlack: true  },  // 6
  { note: 'G',  pitch: semitone('G'),       row: 2, isBlack: false },  // 7
  // Row 4 (white): A B C D E — octave 3→4 (pitch 8-16)
  // Row 3 (black): Ab Bb C# Eb — octave 3→4
  { note: 'Ab', pitch: semitone('Ab'),       row: 3, isBlack: true  },  // 8
  { note: 'A',  pitch: semitone('A'),       row: 4, isBlack: false },  // 9
  { note: 'Bb', pitch: semitone('Bb'),      row: 3, isBlack: true  },  // 10
  { note: 'B',  pitch: semitone('B'),       row: 4, isBlack: false },  // 11
  { note: 'C',  pitch: semitone('C') + 12,  row: 4, isBlack: false },  // 12
  { note: 'C#', pitch: semitone('C#') + 12, row: 3, isBlack: true  },  // 13
  { note: 'D',  pitch: semitone('D') + 12,  row: 4, isBlack: false },  // 14
  { note: 'Eb', pitch: semitone('Eb') + 12, row: 3, isBlack: true  },  // 15
  { note: 'E',  pitch: semitone('E') + 12,  row: 4, isBlack: false },  // 16
  // Row 6 (white): F G A B C — octave 4→5 (pitch 17-24)
  // Row 5 (black): F# Ab Bb — octave 4
  { note: 'F',  pitch: semitone('F') + 12,  row: 6, isBlack: false },  // 17
  { note: 'F#', pitch: semitone('F#') + 12, row: 5, isBlack: true  },  // 18
  { note: 'G',  pitch: semitone('G') + 12,  row: 6, isBlack: false },  // 19
  { note: 'Ab', pitch: semitone('Ab') + 12, row: 5, isBlack: true  },  // 20
  { note: 'A',  pitch: semitone('A') + 12,  row: 6, isBlack: false },  // 21
  { note: 'Bb', pitch: semitone('Bb') + 12, row: 5, isBlack: true  },  // 22
  { note: 'B',  pitch: semitone('B') + 12,  row: 6, isBlack: false },  // 23
  { note: 'C',  pitch: semitone('C') + 24,  row: 6, isBlack: false },  // 24
].sort((a, b) => a.pitch - b.pitch) as GridKeyInfo[];

/** Look up all grid keys matching a given note name */
export function getKeysForNote(note: NoteName): GridKeyInfo[] {
  return GRID_KEYS.filter(k => k.note === note);
}

// ─── Row-based pitch lookup ───
// Maps each visual row's keys to their unique pitch values.
// Used by the EasyPlayGrid to tag each rendered Key with its pitch index.

/** Pitch values for black keys in Row 1, in the same order as BLACK_ROW_1 */
export const BLACK_ROW_1_PITCHES: number[] = [1, 3, 6]; // C#3, Eb3, F#3

/** Pitch values for white keys in Row 2, in the same order as WHITE_ROW_2 */
export const WHITE_ROW_2_PITCHES: number[] = [0, 2, 4, 5, 7]; // C3, D3, E3, F3, G3

/** Pitch values for black keys in Row 3, in the same order as BLACK_ROW_3 */
export const BLACK_ROW_3_PITCHES: number[] = [8, 10, 13, 15]; // Ab3, Bb3, C#4, Eb4

/** Pitch values for white keys in Row 4, in the same order as WHITE_ROW_4 */
export const WHITE_ROW_4_PITCHES: number[] = [9, 11, 12, 14, 16]; // A3, B3, C4, D4, E4

/** Pitch values for black keys in Row 5, in the same order as BLACK_ROW_5 */
export const BLACK_ROW_5_PITCHES: number[] = [18, 20, 22]; // F#4, Ab4, Bb4

/** Pitch values for white keys in Row 6, in the same order as WHITE_ROW_6 */
export const WHITE_ROW_6_PITCHES: number[] = [17, 19, 21, 23, 24]; // F4, G4, A4, B4, C5

// ─── Grid transposition ───
// When the EasyPlay1S pitch wheel is set to a key other than C,
// every physical key shifts by a fixed semitone offset. The physical
// layout (white vs black, positions) doesn't change — only the note names.

/** Semitone offset from C for a given root key */
export function getRootOffset(rootKey: NoteName): number {
  return CHROMATIC.indexOf(rootKey);
}

/** Transpose a white row's note names by the root key offset */
export function transposeWhiteRow(baseNotes: NoteName[], rootKey: NoteName): NoteName[] {
  const offset = getRootOffset(rootKey);
  if (offset === 0) return baseNotes;
  return baseNotes.map(n => transposeNote(n, offset));
}

/** Transpose a black row's note names (preserving positions) by the root key offset */
export function transposeBlackRow(baseKeys: BlackKeyPosition[], rootKey: NoteName): BlackKeyPosition[] {
  const offset = getRootOffset(rootKey);
  if (offset === 0) return baseKeys;
  return baseKeys.map(k => ({ ...k, note: transposeNote(k.note, offset) }));
}

/** Get the full 25-key GRID_KEYS array with note names transposed for a given root key */
export function getTransposedGridKeys(rootKey: NoteName): GridKeyInfo[] {
  const offset = getRootOffset(rootKey);
  if (offset === 0) return GRID_KEYS;
  return GRID_KEYS.map(k => ({ ...k, note: transposeNote(k.note, offset) }));
}
