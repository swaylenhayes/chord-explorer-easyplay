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
