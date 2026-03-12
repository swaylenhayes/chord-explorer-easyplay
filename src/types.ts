export type NoteName = 'C' | 'C#' | 'D' | 'Eb' | 'E' | 'F' | 'F#' | 'G' | 'Ab' | 'A' | 'Bb' | 'B';

export type Mode = 'major' | 'minor';

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented';

export type ChordCategory = 'triads' | 'sevenths' | 'extended' | 'intervals' | 'sus-add' | 'power';

export interface Chord {
  degree: number;         // 0-based scale degree index
  numeral: string;        // e.g. "I", "ii", "Imaj7"
  name: string;           // e.g. "C", "Dm7", "Cmaj9"
  quality: ChordQuality;
  notes: NoteName[];      // Notes to highlight on the grid
  fullNotes?: NoteName[]; // Full theoretical notes (before voicing drops)
  voicingNote?: string;   // e.g. "5th omitted" for extended chord voicings
}

export interface Interval {
  name: string;           // e.g. "Perfect 5th"
  shortName: string;      // e.g. "P5"
  semitones: number;
}

export interface GridKey {
  note: NoteName;
  type: 'white' | 'black';
}

export interface BlackKeyPosition {
  note: NoteName;
  left: number;
}

/** A physical key on the grid with its unique chromatic pitch */
export interface GridKeyInfo {
  note: NoteName;
  pitch: number;      // 0 (C3) to 24 (C5), unique per physical key
  row: number;        // 1-6 (top to bottom)
  isBlack: boolean;
}

/** All valid key combinations for a chord, split by playability */
export interface TieredSegments {
  playable: GridKeyInfo[][];
  stretch: GridKeyInfo[][];
  total: number;
  playableCount: number;
}

/** A single step in a voicing pattern animation */
export interface PatternStep {
  pressed: number[];  // pitch indices being tapped this step
  held: number[];     // pitch indices sustained from a previous step
  comboIndex?: number;
  isStretch?: boolean;
}

/** Definition of a voicing pattern */
export interface VoicingPattern {
  id: string;
  name: string;
  loopFrom: number;   // step index to loop back to (0 = full replay, 1 = skip intro)
  generate: (segment: GridKeyInfo[]) => PatternStep[];
  generateMulti?: (segments: TieredSegments) => PatternStep[];
}

// ─── Phase 3: Progressions ───

export interface Progression {
  id: number;
  name: string;
  numerals: string[];       // e.g. ["I", "IV", "V", "I"]
  mode: Mode;               // which key mode this progression applies to
  chordCategory: 'triads' | 'sevenths' | 'extended';
  extendedType?: '9' | '11' | '13';  // only for extended category
}

export interface ResolvedChord {
  numeral: string;        // Original numeral string for display
  name: string;           // Resolved name, e.g. "Bb" or "G/B"
  notes: NoteName[];      // Concrete notes to highlight
  quality: ChordQuality;
}
