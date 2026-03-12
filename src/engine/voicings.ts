import type { NoteName, GridKeyInfo, PatternStep, VoicingPattern, TieredSegments } from '../types';
import { GRID_KEYS } from './grid';

// ─── Segment Finder ───

/**
 * Find all physical keys on the grid that match a given note name.
 * Returns them sorted by ascending pitch.
 */
function keysForNote(note: NoteName, gridKeys: GridKeyInfo[] = GRID_KEYS): GridKeyInfo[] {
  return gridKeys.filter(k => k.note === note).sort((a, b) => a.pitch - b.pitch);
}

/**
 * A combination is "playable" if all keys fit within 2 adjacent row-pairs.
 * Zone A: rows 1-4 (top + middle sections)
 * Zone B: rows 3-6 (middle + bottom sections)
 */
function isPlayable(keys: GridKeyInfo[]): boolean {
  const rows = keys.map(k => k.row);
  const maxRow = Math.max(...rows);
  const minRow = Math.min(...rows);
  return maxRow <= 4 || minRow >= 3;
}

/**
 * Generate Cartesian product of arrays.
 * cartesian([[a,b], [c,d]]) => [[a,c], [a,d], [b,c], [b,d]]
 */
function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesian(rest);
  const result: T[][] = [];
  for (const item of first) {
    for (const combo of restProduct) {
      result.push([item, ...combo]);
    }
  }
  return result;
}

/**
 * Find ALL valid physical key combinations for a chord on the grid.
 * Returns them split into playable (within reach) and stretch (full grid span) tiers,
 * each sorted by lowest pitch ascending.
 *
 * INVARIANT: Each segment preserves the input chordNotes order.
 * segment[0] always corresponds to chordNotes[0] (the root).
 */
export function findAllSegments(
  chordNotes: NoteName[],
  gridKeys: GridKeyInfo[] = GRID_KEYS,
): TieredSegments {
  if (chordNotes.length === 0) {
    return { playable: [], stretch: [], total: 0, playableCount: 0 };
  }

  const positionsPerNote = chordNotes.map(note => keysForNote(note, gridKeys));

  if (positionsPerNote.some(positions => positions.length === 0)) {
    return { playable: [], stretch: [], total: 0, playableCount: 0 };
  }

  const allCombos = cartesian(positionsPerNote);

  const seen = new Set<string>();
  const unique: GridKeyInfo[][] = [];
  for (const combo of allCombos) {
    const key = combo.map(k => k.pitch).sort((a, b) => a - b).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(combo);
    }
  }

  const playable: GridKeyInfo[][] = [];
  const stretch: GridKeyInfo[][] = [];

  for (const combo of unique) {
    if (isPlayable(combo)) {
      playable.push(combo);
    } else {
      stretch.push(combo);
    }
  }

  const sortByPitch = (a: GridKeyInfo[], b: GridKeyInfo[]) => {
    const aPitches = a.map(k => k.pitch).sort((x, y) => x - y);
    const bPitches = b.map(k => k.pitch).sort((x, y) => x - y);
    for (let i = 0; i < Math.min(aPitches.length, bPitches.length); i++) {
      if (aPitches[i] !== bPitches[i]) return aPitches[i] - bPitches[i];
    }
    return 0;
  };

  playable.sort(sortByPitch);
  stretch.sort(sortByPitch);

  return {
    playable,
    stretch,
    total: playable.length + stretch.length,
    playableCount: playable.length,
  };
}

/**
 * Forward segment finder: starting from a root candidate, find each remaining
 * chord tone at or above the root's pitch. Returns null if any tone can't be found.
 */
function findForwardSegment(
  rootKey: GridKeyInfo,
  remainingNotes: NoteName[],
  gridKeys: GridKeyInfo[],
): GridKeyInfo[] | null {
  const segment: GridKeyInfo[] = [rootKey];

  for (const note of remainingNotes) {
    const candidates = keysForNote(note, gridKeys);
    const match = candidates.find(k => k.pitch >= rootKey.pitch);
    if (!match) return null;
    segment.push(match);
  }

  return segment;
}

/**
 * Backward segment finder: starting from an anchor (highest chord tone),
 * find each other chord tone at or below the anchor's pitch.
 * Returns null if any tone can't be found.
 */
function findBackwardSegment(
  anchorKey: GridKeyInfo,
  rootNote: NoteName,
  otherNotes: NoteName[],
  gridKeys: GridKeyInfo[],
): GridKeyInfo[] | null {
  // Find root at or below anchor
  const rootCandidates = keysForNote(rootNote, gridKeys);
  const rootMatch = [...rootCandidates].reverse().find(k => k.pitch <= anchorKey.pitch);
  if (!rootMatch) return null;

  const segment: GridKeyInfo[] = [rootMatch];

  // Find each other note at or below anchor
  for (const note of otherNotes) {
    const candidates = keysForNote(note, gridKeys);
    const match = [...candidates].reverse().find(k => k.pitch <= anchorKey.pitch);
    if (!match) return null;
    segment.push(match);
  }

  // Add anchor itself
  segment.push(anchorKey);

  return segment;
}

/**
 * Find the best segment of physical keys to play a chord.
 *
 * @param chordNotes - Ordered note names, root first
 * @param direction  - "forward" (low→high) or "backward" (high→low)
 * @param gridKeys   - Transposed grid keys for the current root key (defaults to C-based GRID_KEYS)
 * @returns Array of GridKeyInfo with root at index 0, rest sorted by pitch
 */
export function findSegment(
  chordNotes: NoteName[],
  direction: 'forward' | 'backward' = 'forward',
  gridKeys: GridKeyInfo[] = GRID_KEYS,
): GridKeyInfo[] {
  if (chordNotes.length === 0) return [];

  const rootNote = chordNotes[0];
  const remainingNotes = chordNotes.slice(1);

  if (direction === 'forward') {
    // Try each root instance from lowest pitch upward
    const rootKeys = keysForNote(rootNote, gridKeys).sort((a, b) => a.pitch - b.pitch);
    for (const rk of rootKeys) {
      const segment = findForwardSegment(rk, remainingNotes, gridKeys);
      if (segment) {
        // Root at [0], rest sorted by pitch
        const [root, ...rest] = segment;
        rest.sort((a, b) => a.pitch - b.pitch);
        return [root, ...rest];
      }
    }
  } else {
    // Backward: try each instance of the last chord tone from highest pitch downward
    const lastNote = chordNotes[chordNotes.length - 1];
    const middleNotes = chordNotes.slice(1, -1);
    const anchorKeys = keysForNote(lastNote, gridKeys).sort((a, b) => b.pitch - a.pitch);

    for (const anchorKey of anchorKeys) {
      const segment = findBackwardSegment(anchorKey, rootNote, middleNotes, gridKeys);
      if (segment) {
        // Deduplicate (anchor might equal root for 1-note chords)
        const unique = Array.from(new Map(segment.map(k => [k.pitch, k])).values());
        // Root at [0], rest sorted by pitch
        const rk = unique.find(k => k.note === rootNote && k.pitch <= anchorKey.pitch)!;
        const rest = unique.filter(k => k !== rk).sort((a, b) => a.pitch - b.pitch);
        return [rk, ...rest];
      }
    }
  }

  // Fallback: pick first root instance, nearest instance of each tone regardless of direction
  const rk = keysForNote(rootNote, gridKeys)[0];
  if (!rk) return [];

  const segment: GridKeyInfo[] = [rk];
  for (const note of remainingNotes) {
    const candidates = keysForNote(note, gridKeys);
    const nearest = candidates.reduce((best, k) =>
      Math.abs(k.pitch - rk.pitch) < Math.abs(best.pitch - rk.pitch) ? k : best
    );
    segment.push(nearest);
  }

  const [root, ...rest] = segment;
  rest.sort((a, b) => a.pitch - b.pitch);
  return [root, ...rest];
}

// ─── Pattern Definitions ───

const block: VoicingPattern = {
  id: 'block',
  name: 'Block',
  loopFrom: 0,
  generate(segment) {
    const allPitches = segment.map(k => k.pitch);
    return [
      { pressed: allPitches, held: [] },
      { pressed: [], held: [] },  // release
    ];
  },
  generateMulti(segments) {
    const steps: PatternStep[] = [];
    let i = 0;
    for (const seg of segments.playable) {
      const pitches = seg.map(k => k.pitch);
      steps.push({ pressed: pitches, held: [], comboIndex: i, isStretch: false });
      steps.push({ pressed: [], held: [], comboIndex: i, isStretch: false });
      i++;
    }
    for (const seg of segments.stretch) {
      const pitches = seg.map(k => k.pitch);
      steps.push({ pressed: pitches, held: [], comboIndex: i, isStretch: true });
      steps.push({ pressed: [], held: [], comboIndex: i, isStretch: true });
      i++;
    }
    return steps;
  },
};

const ascending: VoicingPattern = {
  id: 'ascending',
  name: 'Ascending',
  loopFrom: 0,
  generate(segment) {
    // Sort by pitch (root first, then ascending)
    const [root, ...rest] = segment;
    const sorted = [root, ...rest.sort((a, b) => a.pitch - b.pitch)];
    return sorted.map(k => ({ pressed: [k.pitch], held: [] }));
  },
};

const descending: VoicingPattern = {
  id: 'descending',
  name: 'Descending',
  loopFrom: 0,
  generate(segment) {
    // Highest to lowest
    const sorted = [...segment].sort((a, b) => b.pitch - a.pitch);
    return sorted.map(k => ({ pressed: [k.pitch], held: [] }));
  },
};

const pedalTap: VoicingPattern = {
  id: 'pedal-tap',
  name: 'Pedal Tap',
  loopFrom: 1,  // skip intro on repeat
  generate(segment) {
    const [root, ...rest] = segment;
    const sorted = rest.sort((a, b) => a.pitch - b.pitch);
    const steps: PatternStep[] = [
      { pressed: [root.pitch], held: [] },  // intro: root alone
    ];
    for (const k of sorted) {
      steps.push({ pressed: [k.pitch], held: [root.pitch] });
    }
    // For 2-note chords, add a root-only rest so the single upper note visibly toggles
    if (sorted.length === 1) {
      steps.push({ pressed: [], held: [root.pitch] });
    }
    return steps;
  },
};

const brokenChord: VoicingPattern = {
  id: 'broken',
  name: 'Broken',
  loopFrom: 0,
  generate(segment) {
    const [root, ...rest] = segment;
    const sorted = [root, ...rest.sort((a, b) => a.pitch - b.pitch)];

    if (sorted.length <= 2) {
      // Alternate between the two notes
      return sorted.map(k => ({ pressed: [k.pitch], held: [] }));
    }

    // Alberti: 1st, 2nd, last, 2nd
    const first = sorted[0];
    const second = sorted[1];
    const last = sorted[sorted.length - 1];
    return [
      { pressed: [first.pitch], held: [] },
      { pressed: [second.pitch], held: [] },
      { pressed: [last.pitch], held: [] },
      { pressed: [second.pitch], held: [] },
    ];
  },
};

const shellVoicing: VoicingPattern = {
  id: 'shell',
  name: 'Shell',
  loopFrom: 0,
  generate(segment) {
    const [root, ...rest] = segment;
    const sorted = rest.sort((a, b) => a.pitch - b.pitch);
    const steps: PatternStep[] = [
      { pressed: [root.pitch], held: [] },  // intro: root alone
    ];
    for (const k of sorted) {
      steps.push({ pressed: [k.pitch], held: [root.pitch] });
    }
    // Release step
    steps.push({ pressed: [], held: [] });
    return steps;
  },
};

const rolling: VoicingPattern = {
  id: 'rolling',
  name: 'Rolling',
  loopFrom: 0,
  generate(segment) {
    const [root, ...rest] = segment;
    const sorted = [root, ...rest.sort((a, b) => a.pitch - b.pitch)];
    const steps: PatternStep[] = [];

    for (let i = 0; i < sorted.length; i++) {
      steps.push({
        pressed: [sorted[i].pitch],
        held: sorted.slice(0, i).map(k => k.pitch),
      });
    }

    // Sustain step: all held, none newly pressed
    steps.push({
      pressed: [],
      held: sorted.map(k => k.pitch),
    });

    // Release step
    steps.push({ pressed: [], held: [] });

    return steps;
  },
};

const stride: VoicingPattern = {
  id: 'stride',
  name: 'Stride',
  loopFrom: 0,
  generate(segment) {
    const [root, ...rest] = segment;
    const upperPitches = rest.sort((a, b) => a.pitch - b.pitch).map(k => k.pitch);
    return [
      { pressed: [root.pitch], held: [] },
      { pressed: upperPitches, held: [] },
    ];
  },
};

/** All available voicing patterns in display order */
export const VOICING_PATTERNS: VoicingPattern[] = [
  block,
  ascending,
  descending,
  pedalTap,
  brokenChord,
  shellVoicing,
  rolling,
  stride,
];
