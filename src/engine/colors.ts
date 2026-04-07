import type { NoteName } from '../types';

/** Interval Gravity color map — oklch palette with better perceptual spread */
export const NOTE_COLORS: Record<NoteName, string> = {
  'C':  'oklch(0.61 0.26 32)',   // warm red
  'G':  'oklch(0.67 0.22 38)',   // orange
  'D':  'oklch(0.78 0.20 64)',   // amber
  'A':  'oklch(0.89 0.17 90)',   // gold
  'E':  'oklch(0.88 0.20 115)',  // yellow-green
  'B':  'oklch(0.78 0.20 145)',  // green
  'F#': 'oklch(0.65 0.18 175)',  // teal-green
  'C#': 'oklch(0.62 0.13 210)',  // cyan
  'Ab': 'oklch(0.60 0.16 245)',  // blue
  'Eb': 'oklch(0.55 0.20 270)',  // deep blue
  'Bb': 'oklch(0.55 0.22 300)',  // violet
  'F':  'oklch(0.60 0.20 340)',  // magenta
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
  'oklch(0.61 0.26 32)',  'oklch(0.67 0.22 38)',  'oklch(0.78 0.20 64)',
  'oklch(0.89 0.17 90)',  'oklch(0.88 0.20 115)', 'oklch(0.78 0.20 145)',
  'oklch(0.65 0.18 175)', 'oklch(0.62 0.13 210)', 'oklch(0.60 0.16 245)',
  'oklch(0.55 0.20 270)', 'oklch(0.55 0.22 300)', 'oklch(0.60 0.20 340)',
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
