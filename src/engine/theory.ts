import type { NoteName, Mode, Chord, ChordQuality, Interval, ResolvedChord } from '../types';

/**
 * Chromatic scale with the canonical spellings used by the EasyPlay1S stickers.
 * Uses sharps for C#/F# and flats for Eb/Ab/Bb — matching the physical device.
 */
export const CHROMATIC: NoteName[] = [
  'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
];

// ─── Scale definitions ───

const SCALE_INTERVALS: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};

// ─── Triad system (Phase 1) ───

const TRIAD_QUALITIES: Record<Mode, ChordQuality[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'],
  minor: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
};

const NUMERALS: Record<Mode, string[]> = {
  major: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii\u00B0'],
  minor: ['i', 'ii\u00B0', 'III', 'iv', 'v', 'VI', 'VII'],
};

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: '',
  minor: 'm',
  diminished: 'dim',
  augmented: 'aug',
};

const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  major:      [0, 4, 7],
  minor:      [0, 3, 7],
  diminished: [0, 3, 6],
  augmented:  [0, 4, 8],
};

// ─── Seventh chord system ───

type SeventhType = 'maj7' | 'min7' | 'dom7' | 'half-dim7' | 'dim7';

const SEVENTH_INTERVALS: Record<SeventhType, number[]> = {
  'maj7':      [0, 4, 7, 11],
  'min7':      [0, 3, 7, 10],
  'dom7':      [0, 4, 7, 10],
  'half-dim7': [0, 3, 6, 10],
  'dim7':      [0, 3, 6, 9],
};

const SEVENTH_SUFFIX: Record<SeventhType, string> = {
  'maj7': 'maj7',
  'min7': 'm7',
  'dom7': '7',
  'half-dim7': '\u00F87',  // ø7
  'dim7': 'dim7',
};

const SEVENTH_NUMERAL_SUFFIX: Record<SeventhType, string> = {
  'maj7': 'maj7',
  'min7': '7',
  'dom7': '7',
  'half-dim7': '\u00F87',
  'dim7': 'dim7',
};

const DIATONIC_SEVENTH_TYPES: Record<Mode, SeventhType[]> = {
  major: ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'half-dim7'],
  minor: ['min7', 'half-dim7', 'maj7', 'min7', 'min7', 'maj7', 'dom7'],
};

// Maps seventh type back to base triad quality for the Chord interface
const SEVENTH_BASE_QUALITY: Record<SeventhType, ChordQuality> = {
  'maj7': 'major',
  'min7': 'minor',
  'dom7': 'major',
  'half-dim7': 'diminished',
  'dim7': 'diminished',
};

// ─── Extended chord system (9, 11, 13) ───

type ExtendedType = '9' | '11' | '13';

// Extension intervals added on top of the seventh chord
// 9 = 2 semitones above octave (14), 11 = 5 above octave (17), 13 = 9 above octave (21)
const EXTENSION_SEMITONES: Record<ExtendedType, number[]> = {
  '9':  [14],
  '11': [14, 17],
  '13': [14, 17, 21],
};

const EXTENDED_SUFFIX_MAP: Record<string, string> = {
  'maj7-9':  'maj9',   'min7-9':  'm9',   'dom7-9': '9',
  'maj7-11': 'maj11',  'min7-11': 'm11',  'dom7-11': '11',
  'maj7-13': 'maj13',  'min7-13': 'm13',  'dom7-13': '13',
  'half-dim7-9': '\u00F89', 'half-dim7-11': '\u00F811', 'half-dim7-13': '\u00F813',
};

const EXTENDED_NUMERAL_MAP: Record<string, string> = {
  'maj7-9':  'maj9',   'min7-9':  '9',    'dom7-9': '9',
  'maj7-11': 'maj11',  'min7-11': '11',   'dom7-11': '11',
  'maj7-13': 'maj13',  'min7-13': '13',   'dom7-13': '13',
  'half-dim7-9': '\u00F89', 'half-dim7-11': '\u00F811', 'half-dim7-13': '\u00F813',
};

// ─── Sus/Add chord types ───

interface SusAddDef {
  label: string;
  suffix: string;
  intervals: number[];
}

const SUS_ADD_TYPES: SusAddDef[] = [
  { label: 'sus2',  suffix: 'sus2',  intervals: [0, 2, 7] },
  { label: 'sus4',  suffix: 'sus4',  intervals: [0, 5, 7] },
  { label: 'add9',  suffix: 'add9',  intervals: [0, 4, 7, 14] },
  { label: 'add11', suffix: 'add11', intervals: [0, 4, 7, 17] },
  { label: '6th',   suffix: '6',     intervals: [0, 4, 7, 9] },
  { label: '6/9',   suffix: '6/9',   intervals: [0, 4, 7, 9, 14] },
  { label: '7sus4', suffix: '7sus4', intervals: [0, 5, 7, 10] },
];

// ─── Power chord types ───

interface PowerDef {
  label: string;
  suffix: string;
  intervals: number[];
}

const POWER_TYPES: PowerDef[] = [
  { label: '5th',         suffix: '5',     intervals: [0, 7] },
  { label: '5th + oct',   suffix: '5(8)',  intervals: [0, 7, 12] },
];

// ─── Intervals ───

export const INTERVALS: Interval[] = [
  { name: 'Minor 2nd',   shortName: 'm2',  semitones: 1 },
  { name: 'Major 2nd',   shortName: 'M2',  semitones: 2 },
  { name: 'Minor 3rd',   shortName: 'm3',  semitones: 3 },
  { name: 'Major 3rd',   shortName: 'M3',  semitones: 4 },
  { name: 'Perfect 4th',  shortName: 'P4',  semitones: 5 },
  { name: 'Tritone',     shortName: 'TT',  semitones: 6 },
  { name: 'Perfect 5th',  shortName: 'P5',  semitones: 7 },
  { name: 'Minor 6th',   shortName: 'm6',  semitones: 8 },
  { name: 'Major 6th',   shortName: 'M6',  semitones: 9 },
  { name: 'Minor 7th',   shortName: 'm7',  semitones: 10 },
  { name: 'Major 7th',   shortName: 'M7',  semitones: 11 },
  { name: 'Octave',      shortName: 'P8',  semitones: 12 },
];

// ─── Core functions ───

export function transposeNote(note: NoteName, semitones: number): NoteName {
  const idx = CHROMATIC.indexOf(note);
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return CHROMATIC[newIdx];
}

export function getScale(root: NoteName, mode: Mode): NoteName[] {
  return SCALE_INTERVALS[mode].map(interval => transposeNote(root, interval));
}

export function buildChord(root: NoteName, quality: ChordQuality): NoteName[] {
  return CHORD_INTERVALS[quality].map(interval => transposeNote(root, interval));
}

// ─── Diatonic chord generators ───

export function getDiatonicChords(root: NoteName, mode: Mode): Chord[] {
  const scale = getScale(root, mode);
  const qualities = TRIAD_QUALITIES[mode];
  const numerals = NUMERALS[mode];

  return scale.map((scaleNote, i) => {
    const quality = qualities[i];
    const notes = buildChord(scaleNote, quality);
    return {
      degree: i,
      numeral: numerals[i],
      name: scaleNote + QUALITY_SUFFIX[quality],
      quality,
      notes,
    };
  });
}

export function getDiatonicSevenths(root: NoteName, mode: Mode): Chord[] {
  const scale = getScale(root, mode);
  const seventhTypes = DIATONIC_SEVENTH_TYPES[mode];
  const numerals = NUMERALS[mode];

  return scale.map((scaleNote, i) => {
    const seventhType = seventhTypes[i];
    const intervals = SEVENTH_INTERVALS[seventhType];
    const notes = intervals.map(iv => transposeNote(scaleNote, iv)) as NoteName[];
    const baseNumeral = numerals[i].replace('\u00B0', ''); // strip ° for vii
    return {
      degree: i,
      numeral: baseNumeral + SEVENTH_NUMERAL_SUFFIX[seventhType],
      name: scaleNote + SEVENTH_SUFFIX[seventhType],
      quality: SEVENTH_BASE_QUALITY[seventhType],
      notes,
    };
  });
}

export function getDiatonicExtended(root: NoteName, mode: Mode, ext: ExtendedType): Chord[] {
  const scale = getScale(root, mode);
  const seventhTypes = DIATONIC_SEVENTH_TYPES[mode];
  const numerals = NUMERALS[mode];
  const extIntervals = EXTENSION_SEMITONES[ext];

  return scale.map((scaleNote, i) => {
    const seventhType = seventhTypes[i];
    const baseIntervals = SEVENTH_INTERVALS[seventhType];
    const allIntervals = [...baseIntervals, ...extIntervals];
    const notes = allIntervals.map(iv => transposeNote(scaleNote, iv)) as NoteName[];

    const key = `${seventhType}-${ext}`;
    const suffix = EXTENDED_SUFFIX_MAP[key] ?? `${ext}`;
    const numSuffix = EXTENDED_NUMERAL_MAP[key] ?? `${ext}`;
    const baseNumeral = numerals[i].replace('\u00B0', '');

    return {
      degree: i,
      numeral: baseNumeral + numSuffix,
      name: scaleNote + suffix,
      quality: SEVENTH_BASE_QUALITY[seventhType],
      notes,
    };
  });
}

export function getSusAddChords(root: NoteName, mode: Mode, susAddIndex: number): Chord[] {
  const scale = getScale(root, mode);
  const numerals = NUMERALS[mode];
  const def = SUS_ADD_TYPES[susAddIndex];

  return scale.map((scaleNote, i) => {
    const notes = def.intervals.map(iv => transposeNote(scaleNote, iv)) as NoteName[];
    const baseNumeral = numerals[i].replace('\u00B0', '').replace('m', '');
    return {
      degree: i,
      numeral: baseNumeral + def.suffix,
      name: scaleNote + def.suffix,
      quality: 'major' as ChordQuality, // sus/add chords don't have a traditional quality
      notes,
    };
  });
}

export function getPowerChords(root: NoteName, mode: Mode, powerIndex: number): Chord[] {
  const scale = getScale(root, mode);
  const numerals = NUMERALS[mode];
  const def = POWER_TYPES[powerIndex];

  return scale.map((scaleNote, i) => {
    const notes = def.intervals.map(iv => transposeNote(scaleNote, iv)) as NoteName[];
    const baseNumeral = numerals[i].replace('\u00B0', '');
    return {
      degree: i,
      numeral: baseNumeral + def.suffix,
      name: scaleNote + def.suffix,
      quality: 'major' as ChordQuality,
      notes,
    };
  });
}

export function getIntervalNotes(root: NoteName, semitones: number): NoteName[] {
  return [root, transposeNote(root, semitones)];
}

export { SUS_ADD_TYPES, POWER_TYPES };
export type { SusAddDef, PowerDef };

export const ALL_NOTES: NoteName[] = [...CHROMATIC];

// ─── Numeral parser (Phase 3: Progressions) ───

/** Ordered longest-first so VII matches before VI before V, etc. */
const NUMERAL_TOKENS = [
  'VII', 'vii', 'III', 'iii',
  'VI', 'vi', 'IV', 'iv', 'II', 'ii',
  'V', 'v', 'I', 'i',
];

const NUMERAL_DEGREE: Record<string, number> = {
  I: 0, II: 1, III: 2, IV: 3, V: 4, VI: 5, VII: 6,
};

function parseBaseNumeral(s: string): { degree: number; isUpper: boolean; suffix: string } | null {
  for (const token of NUMERAL_TOKENS) {
    if (s.startsWith(token)) {
      return {
        degree: NUMERAL_DEGREE[token.toUpperCase()],
        isUpper: token === token.toUpperCase(),
        suffix: s.slice(token.length),
      };
    }
  }
  return null;
}

/**
 * Parses a Roman numeral string and resolves it to concrete notes in the given key/mode.
 * Handles: diatonic (I-vii), sevenths (7/maj7), extended (maj9), borrowed (♭VII),
 * and slash chords (V/vii).
 */
export function resolveNumeral(numeral: string, key: NoteName, mode: Mode): ResolvedChord {
  const scale = getScale(key, mode);

  let baseStr = numeral;
  let slashDegreeStr: string | undefined;
  const slashIdx = numeral.indexOf('/');
  if (slashIdx >= 0) {
    baseStr = numeral.slice(0, slashIdx);
    slashDegreeStr = numeral.slice(slashIdx + 1);
  }

  const isBorrowed = baseStr.startsWith('\u266d');
  if (isBorrowed) baseStr = baseStr.slice(1);

  const parsed = parseBaseNumeral(baseStr);
  if (!parsed) throw new Error(`Cannot parse numeral: ${numeral}`);
  const { degree, isUpper, suffix } = parsed;

  let root = scale[degree];
  if (isBorrowed) root = transposeNote(root, -1);

  let intervals: number[];
  let quality: ChordQuality;
  let nameSuffix: string;

  if (suffix === '\u00B0') {
    intervals = CHORD_INTERVALS.diminished;
    quality = 'diminished';
    nameSuffix = 'dim';
  } else if (suffix === 'maj9') {
    intervals = [0, 4, 11, 14];
    quality = 'major';
    nameSuffix = 'maj9';
  } else if (suffix === 'maj7') {
    intervals = SEVENTH_INTERVALS.maj7;
    quality = 'major';
    nameSuffix = 'maj7';
  } else if (suffix === '7') {
    if (isUpper) {
      intervals = SEVENTH_INTERVALS.dom7;
      quality = 'major';
      nameSuffix = '7';
    } else {
      intervals = SEVENTH_INTERVALS.min7;
      quality = 'minor';
      nameSuffix = 'm7';
    }
  } else {
    if (isUpper) {
      intervals = CHORD_INTERVALS.major;
      quality = 'major';
      nameSuffix = '';
    } else {
      intervals = CHORD_INTERVALS.minor;
      quality = 'minor';
      nameSuffix = 'm';
    }
  }

  const notes = intervals.map(iv => transposeNote(root, iv)) as NoteName[];

  let displayName = root + nameSuffix;
  if (slashDegreeStr) {
    const slashParsed = parseBaseNumeral(slashDegreeStr);
    if (slashParsed) {
      const bassNote = scale[slashParsed.degree];
      displayName += '/' + bassNote;
      if (!notes.includes(bassNote)) {
        notes.unshift(bassNote);
      }
    }
  }

  return { numeral, name: displayName, notes, quality };
}

