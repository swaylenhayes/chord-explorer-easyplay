---
title: 2026-03-12-multi-segment-voicing-cycling-design
type: note
permalink: chordexplore/docs/specs/2026-03-12-multi-segment-voicing-cycling-design
---

# Multi-Segment Voicing Cycling

> Enhancement: cycle through all physical key combinations for block and stride voicing patterns.

---

## Problem

When a voicing pattern (e.g., block) plays, the system finds ONE segment — a single set of physical keys for the chord — and loops it indefinitely. The user wants to see ALL possible fingerings cycle through, building muscle memory for every shape a chord can take on the EasyPlay1S grid.

## Solution

Add a `findAllSegments()` engine function that generates every valid key combination for a chord's notes on the 25-key grid. Pattern generators for block and stride consume the full list and produce steps that cycle through each combination. A shape counter in the UI shows progress.

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Combination filtering | Tiered: playable first, then stretch | Muscle memory for practical shapes first, grid exploration second |
| Ordering within tier | Low-to-high root pitch | Musically intuitive |
| Progress indicator | Explicit counter ("Shape 3 / 8") | Clear feedback for learning |
| End-of-cycle behavior | Continuous loop | Matches current pattern behavior |
| Architecture | Multi-segment generator (Approach A) | Keeps complexity in engine layer; App.tsx changes minimal |
| Scope | Block + stride patterns only | Sequential patterns (ascending, descending, etc.) deferred — need directional animation design |

---

## Data Flow

```
Chord notes [C, E, G]
    ↓
findAllSegments(notes, transposedGridKeys)
    ↓
{ playable: GridKeyInfo[][], stretch: GridKeyInfo[][] }
    ↓
pattern.generateMulti(tieredSegments)   ← new method on block & stride
    ↓
PatternStep[] (with comboIndex + isStretch metadata)
    ↓
App.tsx timer walks steps at BPM (unchanged)
    ↓
Shape counter: patternSteps[currentStep].comboIndex + 1
```

---

## New Engine Function: `findAllSegments()`

### Location
`src/engine/voicings.ts`

### Signature
```ts
interface TieredSegments {
  playable: GridKeyInfo[][];
  stretch: GridKeyInfo[][];
  total: number;
  playableCount: number;
}

function findAllSegments(
  chordNotes: NoteName[],
  gridKeys: GridKeyInfo[]
): TieredSegments
```

### Algorithm

1. **Collect positions**: For each note in `chordNotes`, find all physical keys on the grid that match (using `keysForNote()`). Example for C major: C → [pitch 0, 12, 24], E → [pitch 4, 16], G → [pitch 7, 19].

2. **Cartesian product**: Generate all combinations across the note positions. For C major: 3 × 2 × 2 = 12 raw combinations.

3. **Deduplicate**: Remove combinations that produce the same pitch set (shouldn't happen given unique physical positions, but safety check).

4. **Classify playability**: A combination is "playable" if all keys fall within 2 adjacent row-pairs. The row-pair zones are:
   - Zone A: rows 1-2 + rows 3-4 (pitches 0–16)
   - Zone B: rows 3-4 + rows 5-6 (pitches 8–24)
   - A combination is playable if all its keys fit within Zone A OR Zone B.

5. **Sort each tier**: By the lowest pitch in the combination (ascending). Ties broken by second-lowest pitch.

6. **Return**: `{ playable, stretch, total: playable.length + stretch.length, playableCount: playable.length }`

### Playability Heuristic

The "2 adjacent row-pairs" rule maps to the physical device: rows 1-2 are the top section (C3–G3), rows 3-4 are the middle (Ab3–E4), rows 5-6 are the bottom (F4–C5). A player can comfortably reach across 2 adjacent sections but not all 3.

In pitch terms:
- Zone A: pitch 0–16 (rows 1-4)
- Zone B: pitch 8–24 (rows 3-6)
- Note the overlap at pitches 8–16 (rows 3-4) — combinations using only middle-row keys are playable in both zones.

A combination is playable if: `max(pitches) - min(pitches) <= 16` AND all keys are within a single zone. The zone check matters because two keys could be 16 semitones apart but in non-adjacent rows (e.g., row 2 + row 6).

Simplified implementation: a combination is playable if `maxRow <= 4` (Zone A) or `minRow >= 3` (Zone B), where row is the `GridKeyInfo.row` value.

---

## Modified Pattern Generators

### Block Pattern

**Current behavior**: Receives one segment → produces `[ON, OFF]` → loops.

**New behavior**: Receives `TieredSegments` → concatenates playable + stretch segments → for each segment produces `[ON, OFF]` → loops over the full sequence.

```ts
const block: VoicingPattern = {
  id: 'block',
  name: 'Block',
  loopFrom: 0,
  generate(segment) { /* unchanged single-segment fallback */ },
  generateMulti(segments: TieredSegments): PatternStep[] {
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
```

### Stride Pattern

**Current behavior**: Receives one segment → produces `[bass, upper]` → loops.

**New behavior**: Same as block but each combo produces `[bass, upper]` instead of `[all, off]`.

```ts
const stride: VoicingPattern = {
  id: 'stride',
  name: 'Stride',
  loopFrom: 0,
  generate(segment) { /* unchanged single-segment fallback */ },
  generateMulti(segments: TieredSegments): PatternStep[] {
    const steps: PatternStep[] = [];
    let i = 0;
    for (const seg of segments.playable) {
      // seg[0] is always the root — see "Segment Ordering Invariant" below
      const [root, ...rest] = seg;
      const upperPitches = rest.sort((a, b) => a.pitch - b.pitch).map(k => k.pitch);
      steps.push({ pressed: [root.pitch], held: [], comboIndex: i, isStretch: false });
      steps.push({ pressed: upperPitches, held: [], comboIndex: i, isStretch: false });
      i++;
    }
    for (const seg of segments.stretch) {
      const [root, ...rest] = seg;
      const upperPitches = rest.sort((a, b) => a.pitch - b.pitch).map(k => k.pitch);
      steps.push({ pressed: [root.pitch], held: [], comboIndex: i, isStretch: true });
      steps.push({ pressed: upperPitches, held: [], comboIndex: i, isStretch: true });
      i++;
    }
    return steps;
  },
};
```

### Segment Ordering Invariant

Each segment array returned by `findAllSegments()` preserves the input `chordNotes` order. `segment[0]` always corresponds to `chordNotes[0]` (the root), `segment[1]` to `chordNotes[1]`, etc. This is guaranteed because the Cartesian product iterates over the note positions in `chordNotes` order, and each combination is assembled in that same order. Generators like stride depend on this invariant for correct bass/upper splitting.

### Other Patterns (unchanged)

Ascending, descending, pedal tap, broken, shell, rolling — continue to use `findSegment()` (single segment) via a compatibility path. Their multi-segment behavior is deferred to a future phase requiring directional animation.

---

## Backward Compatibility: Dual Method Approach

The existing `generate(segment: GridKeyInfo[])` signature stays **untouched** for all 8 patterns. Block and stride additionally implement a `generateMulti()` method that accepts `TieredSegments`.

```ts
interface VoicingPattern {
  id: string;
  name: string;
  loopFrom: number;
  generate: (segment: GridKeyInfo[]) => PatternStep[];     // UNCHANGED — single-segment
  generateMulti?: (segments: TieredSegments) => PatternStep[];  // NEW — multi-segment (block & stride only)
}
```

In App.tsx, the call site checks for `generateMulti`:
- If `patternDef.generateMulti` exists AND `tieredSegments` is available → call `generateMulti(tieredSegments)`
- Otherwise → call `generate(segment)` (single segment, as today)

This avoids union types entirely. Existing patterns compile without changes. Only block and stride gain the new method.

---

## Type Changes

### `types.ts`

```ts
// New
interface TieredSegments {
  playable: GridKeyInfo[][];
  stretch: GridKeyInfo[][];
  total: number;
  playableCount: number;
}

// Modified PatternStep — add optional combo metadata
interface PatternStep {
  pressed: number[];
  held: number[];
  comboIndex?: number;    // NEW — which combination this step belongs to
  isStretch?: boolean;    // NEW — true if this step is from a stretch-tier combo
}

// Modified VoicingPattern — dual method approach
interface VoicingPattern {
  id: string;
  name: string;
  loopFrom: number;
  generate: (segment: GridKeyInfo[]) => PatternStep[];     // UNCHANGED
  generateMulti?: (segments: TieredSegments) => PatternStep[];  // NEW — block & stride only
}
```

---

## App.tsx Changes

### Segment computation (`useMemo`)

```ts
// Existing: single segment
const segment = useMemo(() => findSegment(...), [...]);

// New: add tiered segments for multi-segment patterns
const tieredSegments = useMemo(() => {
  if (highlightedNotes.length === 0) return null;
  return findAllSegments(highlightedNotes, transposedGridKeys);
}, [highlightedNotes, transposedGridKeys]);
```

### Pattern steps (`useMemo`)

```ts
const patternSteps = useMemo(() => {
  if (!patternDef) return [];
  if (patternDef.generateMulti && tieredSegments && tieredSegments.total > 0) {
    return patternDef.generateMulti(tieredSegments);
  }
  if (segment.length === 0) return [];
  return patternDef.generate(segment);
}, [patternDef, segment, tieredSegments]);
```

### Shape counter (derived)

```ts
const currentStep = isPatternPlaying && patternSteps.length > 0
  ? patternSteps[patternStep]
  : null;

const currentComboIndex = currentStep?.comboIndex ?? 0;
const shapeNumber = currentComboIndex + 1;            // 1-indexed for display
const totalCombos = tieredSegments?.total ?? 1;
const isStretchCombo = currentStep?.isStretch ?? false; // from step, not index math
```

Pass `shapeNumber`, `totalCombos`, and `isStretchCombo` to the `VoicingPatterns` component.

---

## UI: Shape Counter

### Location
`src/components/VoicingPatterns.tsx` — displayed when a multi-segment pattern is actively playing.

### Display

```
Block ▶  ·  Shape 3 / 8
```

When crossing into stretch territory:

```
Block ▶  ·  Shape 7 / 8  (stretch)
```

### Styling
- Same font/color as existing BPM display
- `(stretch)` label in `#E86902` (Clementine) to differentiate without alarming
- Counter hidden when pattern is stopped or when pattern is single-segment

---

## Audio Behavior

The single `segment` variable (from `findSegment()`) continues to be computed and drives audio in the non-pattern case. When a multi-segment pattern is playing, audio is driven by `patternSteps[currentStep].pressed` and `.held` — this already works today and naturally picks up the new combo pitches as steps advance. The diff-based `setNotes()` handles smooth transitions between combos that share some pitches. No new audio logic needed.

---

## Progression Mode Interaction

In progression mode, the repeats slider controls how many pattern cycles play before advancing to the next chord. With multi-segment patterns, one "cycle" = one full pass through ALL combos. The cycle-completion detection in the timer already fires when `next >= stepsLen`, which now naturally means "all combos played." No change needed.

---

## Scope Boundaries

### In scope (this spec)
- `findAllSegments()` with playability classification
- Block pattern: cycle through all combos
- Stride pattern: cycle through all combos
- Shape counter UI
- Tier label ("stretch") when applicable

### Out of scope (future phases)
- Multi-segment cycling for ascending, descending, pedal tap, broken, shell, rolling
- Directional animation / gestalt shape lines between sequential presses
- User-configurable playability threshold
- Combo filtering by hand size preference