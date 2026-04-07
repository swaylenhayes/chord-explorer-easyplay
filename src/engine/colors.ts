import type { NoteName } from '../types';

/** Interval Gravity color map — permanent, never changes with key/mode */
export const NOTE_COLORS: Record<NoteName, string> = {
  'C':  '#CC1F16',  // Thunderbird
  'G':  '#E86902',  // Clementine
  'D':  '#E99630',  // Fire Bush
  'A':  '#F2C73D',  // Saffron
  'E':  '#FFEA01',  // Turbo
  'B':  '#94BD3B',  // Sushi
  'F#': '#50B000',  // Limeade
  'C#': '#01ACAB',  // Persian Green
  'Ab': '#2D76BA',  // Mariner
  'Eb': '#1D3DA2',  // Persian Blue
  'Bb': '#0407AF',  // Dark Blue
  'F':  '#6C2EAF',  // Purple Heart
};

export const STICKER_NAMES: Record<NoteName, string> = {
  'C': 'Thunderbird', 'G': 'Clementine', 'D': 'Fire Bush', 'A': 'Saffron',
  'E': 'Turbo', 'B': 'Sushi', 'F#': 'Limeade', 'C#': 'Persian Green',
  'Ab': 'Mariner', 'Eb': 'Persian Blue', 'Bb': 'Dark Blue', 'F': 'Purple Heart',
};

/** Notes with light backgrounds that need dark text */
const DARK_TEXT_NOTES: NoteName[] = ['E', 'A', 'B', 'D'];

export function getNoteColor(note: NoteName): string {
  return NOTE_COLORS[note];
}

export function getTextColor(note: NoteName): string {
  return DARK_TEXT_NOTES.includes(note) ? '#2A2A2A' : '#FFFFFF';
}

/** Circle-of-fifths order for the legend */
export const FIFTHS_ORDER: NoteName[] = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'Ab', 'Eb', 'Bb', 'F',
];

/** Return the 12 notes ordered by fifths distance from the given root */
export function getFifthsFromRoot(root: NoteName): NoteName[] {
  const idx = FIFTHS_ORDER.indexOf(root);
  return [...FIFTHS_ORDER.slice(idx), ...FIFTHS_ORDER.slice(0, idx)];
}

/** Positional temperature palette — index 0 = warmest (root), 11 = coolest (farthest) */
export const TEMPERATURE_PALETTE: string[] = [
  '#CC1F16', '#E86902', '#E99630', '#F2C73D', '#FFEA01', '#94BD3B',
  '#50B000', '#01ACAB', '#2D76BA', '#1D3DA2', '#0407AF', '#6C2EAF',
];

/** Positions that need dark text (lighter background colors) */
const DARK_TEXT_POSITIONS = [2, 3, 4, 5];

/** Enharmonic normalization — maps non-canonical spellings to FIFTHS_ORDER keys */
const ENHARMONIC_MAP: Record<string, NoteName> = {
  'Gb': 'F#', 'Db': 'C#', 'G#': 'Ab', 'D#': 'Eb', 'A#': 'Bb',
  'E#': 'F',  'B#': 'C',  'Cb': 'B',  'Fb': 'E',
};

/** Normalize a note name to its canonical FIFTHS_ORDER spelling */
function normalizeNote(note: string): NoteName {
  return (ENHARMONIC_MAP[note] ?? note) as NoteName;
}

/** Get the circle-of-fifths distance (0–11) from root to note */
export function getTemperaturePosition(note: string, root: string): number {
  const noteIdx = FIFTHS_ORDER.indexOf(normalizeNote(note));
  const rootIdx = FIFTHS_ORDER.indexOf(normalizeNote(root));
  return (noteIdx - rootIdx + 12) % 12;
}

/** Get the temperature-mapped color for a note relative to a root key */
export function getTemperatureColor(note: string, root: string): string {
  return TEMPERATURE_PALETTE[getTemperaturePosition(note, root)];
}

/** Get the text color for a note relative to a root key */
export function getTemperatureTextColor(note: string, root: string): string {
  return DARK_TEXT_POSITIONS.includes(getTemperaturePosition(note, root))
    ? '#2A2A2A' : '#FFFFFF';
}
