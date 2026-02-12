import type { Progression } from '../types';

/** Active progressions — filtered by mode + chord category in the UI */
export const PROGRESSIONS: Progression[] = [
  // ─── Major + Triads ───
  { id: 1,  name: 'Rock/Folk',           numerals: ['I', 'IV', 'V', 'I'],           mode: 'major', chordCategory: 'triads' },
  { id: 2,  name: 'Pop/Modern Rock',     numerals: ['I', 'V', 'vi', 'IV'],          mode: 'major', chordCategory: 'triads' },
  { id: 3,  name: 'Pop/EDM',             numerals: ['vi', 'IV', 'I', 'V'],          mode: 'major', chordCategory: 'triads' },
  { id: 4,  name: "50's/Oldies",         numerals: ['I', 'vi', 'IV', 'V'],          mode: 'major', chordCategory: 'triads' },
  { id: 5,  name: 'Singer Songwriter',     numerals: ['I', 'IV', 'vi', 'V'],          mode: 'major', chordCategory: 'triads' },
  { id: 18, name: 'R&B',                   numerals: ['IV', 'V', 'iii', 'vi'],        mode: 'major', chordCategory: 'triads' },
  { id: 20, name: 'Ballad/Folk',         numerals: ['I', 'V/vii', 'vi'],            mode: 'major', chordCategory: 'triads' },

  // ─── Minor + Triads ───
  { id: 9,  name: 'Flamenco/Spanish',    numerals: ['i', 'VII', 'VI', 'V'],         mode: 'minor', chordCategory: 'triads' },
  { id: 10, name: 'Standard Minor',        numerals: ['i', 'iv', 'V'],                mode: 'minor', chordCategory: 'triads' },
  { id: 11, name: 'Epic Minor',            numerals: ['i', 'VI', 'VII'],              mode: 'minor', chordCategory: 'triads' },
  { id: 12, name: 'Minor/Indie/Alt',   numerals: ['i', 'v', 'VI', 'VII'],         mode: 'minor', chordCategory: 'triads' },

  // ─── Major + Sevenths ───
  { id: 7,  name: 'Jazz',                  numerals: ['ii7', 'V7', 'Imaj7'],          mode: 'major', chordCategory: 'sevenths' },
  { id: 8,  name: 'Jazz/Standards',      numerals: ['Imaj7', 'vi7', 'ii7', 'V7'],   mode: 'major', chordCategory: 'sevenths' },
  { id: 6,  name: '12-Bar Blues',           numerals: ['I7','I7','I7','I7','IV7','IV7','I7','I7','V7','IV7','I7','V7'], mode: 'major', chordCategory: 'sevenths' },

  // ─── Minor + Sevenths ───
  { id: 14, name: 'Funk/R&B',            numerals: ['i7', 'IV7'],                   mode: 'minor', chordCategory: 'sevenths' },

  // ─── Major + Extended 9ths ───
  { id: 19, name: 'Neo-Soul Smooth',       numerals: ['Imaj9', 'IVmaj9'],             mode: 'major', chordCategory: 'extended', extendedType: '9' },
];

/**
 * Deferred progressions — require borrowed chords (♭VII, ♭VI, ♭II) that don't map
 * to the current major/minor diatonic system. Will be enabled with modal chord support.
 */
export const DEFERRED_PROGRESSIONS: Progression[] = [
  { id: 13, name: 'Mixolydian Rock',     numerals: ['I', '\u266dVII', 'IV'],          mode: 'major', chordCategory: 'triads' },
  { id: 16, name: 'Aeolian Cadence',     numerals: ['\u266dVI', '\u266dVII', 'I'],    mode: 'major', chordCategory: 'triads' },
  { id: 17, name: 'Cinematic Rock',      numerals: ['I', '\u266dVI', '\u266dVII', 'I'], mode: 'major', chordCategory: 'triads' },
];
