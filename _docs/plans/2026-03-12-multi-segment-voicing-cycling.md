---
title: 2026-03-12-multi-segment-voicing-cycling
type: note
permalink: chordexplore/docs/plans/2026-03-12-multi-segment-voicing-cycling
---

# Multi-Segment Voicing Cycling Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cycle through all physical key combinations for block and stride voicing patterns, with tiered playability and a shape counter UI.

**Architecture:** New `findAllSegments()` engine function generates all key combinations via Cartesian product, classifies them as playable vs stretch, and passes them to new `generateMulti()` methods on block and stride patterns. App.tsx wiring is minimal — just a new `useMemo` and shape counter derivation. VoicingPatterns component gains a "Shape N / M" display.

**Tech Stack:** React 19, TypeScript, Vite, Vitest (new — for engine unit tests)

**Spec:** `_docs/specs/2026-03-12-multi-segment-voicing-cycling-design.md`

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `vitest.config.ts` | Vitest configuration |
| Create | `src/engine/voicings.test.ts` | Unit tests for findAllSegments and generateMulti |
| Modify | `package.json` | Add vitest dev dependency and test script |
| Modify | `src/types.ts:44-55` | Add TieredSegments, update PatternStep and VoicingPattern |
| Modify | `src/engine/voicings.ts` | Add findAllSegments(), add generateMulti to block & stride |
| Modify | `src/App.tsx:14,174-189,372,554-560` | Wire tieredSegments, update patternSteps, derive shape counter, pass props |
| Modify | `src/components/VoicingPatterns.tsx:3-9,59-85` | Add shape counter props and display |

---

## Chunk 1: Foundation (Types + Test Setup + Engine Function)

### Task 1: Install Vitest and configure test runner

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Create vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to the `"scripts"` section:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify vitest runs (no tests yet)**

Run: `npm test`
Expected: "No test files found" or similar clean exit.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for engine unit tests"
```

---

### Task 2: Add types (TieredSegments, PatternStep, VoicingPattern updates)

**Files:**
- Modify: `src/types.ts:44-55`

- [ ] **Step 1: Add TieredSegments interface**

After the `GridKeyInfo` interface (line 41), before `PatternStep`, add:

```ts
/** All valid key combinations for a chord, split by playability */
export interface TieredSegments {
  playable: GridKeyInfo[][];
  stretch: GridKeyInfo[][];
  total: number;
  playableCount: number;
}
```

- [ ] **Step 2: Add optional fields to PatternStep**

Update the existing `PatternStep` interface to add `comboIndex` and `isStretch`:

```ts
export interface PatternStep {
  pressed: number[];
  held: number[];
  comboIndex?: number;    // which combination this step belongs to (multi-segment patterns)
  isStretch?: boolean;    // true if this step is from a stretch-tier combo
}
```

- [ ] **Step 3: Add generateMulti to VoicingPattern**

Update the existing `VoicingPattern` interface:

```ts
export interface VoicingPattern {
  id: string;
  name: string;
  loopFrom: number;
  generate: (segment: GridKeyInfo[]) => PatternStep[];
  generateMulti?: (segments: TieredSegments) => PatternStep[];
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors). The new optional fields don't break existing code.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TieredSegments type and multi-segment pattern support to interfaces"
```

---

### Task 3: Implement `findAllSegments()` in voicings.ts

**Files:**
- Modify: `src/engine/voicings.ts`

- [ ] **Step 1: Add TieredSegments import to voicings.ts**

Update the import at line 1:

```ts
import type { NoteName, GridKeyInfo, PatternStep, VoicingPattern, TieredSegments } from '../types';
```

- [ ] **Step 2: Add the isPlayable helper**

After the existing `keysForNote()` function (line 12), add:

```ts
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
```

- [ ] **Step 3: Add the Cartesian product helper**

Below `isPlayable`, add:

```ts
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
```

- [ ] **Step 4: Add the findAllSegments function**

Below the helpers, add:

```ts
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

  // Collect all physical key positions for each chord note
  const positionsPerNote = chordNotes.map(note => keysForNote(note, gridKeys));

  // If any note has zero positions, no combinations possible
  if (positionsPerNote.some(positions => positions.length === 0)) {
    return { playable: [], stretch: [], total: 0, playableCount: 0 };
  }

  // Generate all combinations (Cartesian product)
  const allCombos = cartesian(positionsPerNote);

  // Deduplicate by pitch set (safety check — pitches are unique per physical key,
  // but this guards against edge cases in transposed grids)
  const seen = new Set<string>();
  const unique: GridKeyInfo[][] = [];
  for (const combo of allCombos) {
    const key = combo.map(k => k.pitch).sort((a, b) => a - b).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(combo);
    }
  }

  // Classify and sort
  const playable: GridKeyInfo[][] = [];
  const stretch: GridKeyInfo[][] = [];

  for (const combo of unique) {
    if (isPlayable(combo)) {
      playable.push(combo);
    } else {
      stretch.push(combo);
    }
  }

  // Sort each tier: by lowest pitch ascending, ties broken by second-lowest
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
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors).

- [ ] **Step 6: Commit**

```bash
git add src/engine/voicings.ts
git commit -m "feat: add findAllSegments() with playability classification"
```

---

### Task 4: Unit tests for findAllSegments()

**Files:**
- Create: `src/engine/voicings.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect } from 'vitest';
import { findAllSegments } from './voicings';
import { GRID_KEYS } from './grid';
import type { NoteName } from '../types';

describe('findAllSegments', () => {
  it('returns empty for empty chord notes', () => {
    const result = findAllSegments([], GRID_KEYS);
    expect(result.total).toBe(0);
    expect(result.playable).toEqual([]);
    expect(result.stretch).toEqual([]);
  });

  it('returns correct count for C major triad (C root)', () => {
    // C appears at pitches 0, 12, 24 (rows 2, 4, 6)
    // E appears at pitches 4, 16 (rows 2, 4)
    // G appears at pitches 7, 19 (rows 2, 6)
    // Raw combos: 3 × 2 × 2 = 12
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    expect(result.total).toBe(12);
    expect(result.playableCount + result.stretch.length).toBe(result.total);
  });

  it('preserves chordNotes order in each segment (root at index 0)', () => {
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    for (const seg of [...result.playable, ...result.stretch]) {
      // seg[0] should be a C key, seg[1] an E key, seg[2] a G key
      expect(seg[0].note).toBe('C');
      expect(seg[1].note).toBe('E');
      expect(seg[2].note).toBe('G');
    }
  });

  it('sorts playable tier by lowest pitch ascending', () => {
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    for (let i = 1; i < result.playable.length; i++) {
      const prevMin = Math.min(...result.playable[i - 1].map(k => k.pitch));
      const currMin = Math.min(...result.playable[i].map(k => k.pitch));
      expect(currMin).toBeGreaterThanOrEqual(prevMin);
    }
  });

  it('classifies same-row-pair combos as playable', () => {
    // C3(row2), E3(row2), G3(row2) — all in rows 1-2, clearly playable
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const allRow2 = result.playable.find(seg =>
      seg.every(k => k.row <= 2)
    );
    expect(allRow2).toBeDefined();
  });

  it('classifies full-grid-span combos as stretch', () => {
    // C3(row2, pitch 0) + E4(row4, pitch 16) + G4(row6, pitch 19)
    // spans rows 2-6 → stretch
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const fullSpan = result.stretch.find(seg => {
      const rows = seg.map(k => k.row);
      return Math.min(...rows) <= 2 && Math.max(...rows) >= 5;
    });
    expect(fullSpan).toBeDefined();
  });

  it('handles single-note chord (just root)', () => {
    // C appears 3 times on the grid
    const result = findAllSegments(['C'], GRID_KEYS);
    expect(result.total).toBe(3);
    // All single-note combos are playable
    expect(result.playableCount).toBe(3);
    expect(result.stretch.length).toBe(0);
  });

  it('handles two-note interval', () => {
    // C + G: 3 × 2 = 6 combos
    const result = findAllSegments(['C', 'G'], GRID_KEYS);
    expect(result.total).toBe(6);
  });

  it('handles seventh chord (4 notes)', () => {
    // Cmaj7: C E G B
    // C: 3, E: 2, G: 2, B: 2 → 3 × 2 × 2 × 2 = 24
    const result = findAllSegments(['C', 'E', 'G', 'B'] as NoteName[], GRID_KEYS);
    expect(result.total).toBe(24);
    expect(result.playableCount).toBeGreaterThan(0);
    expect(result.playableCount).toBeLessThan(24); // some should be stretch
  });

  it('deduplicates identical pitch sets', () => {
    // This is a safety check — with unique pitches per key, no dupes expected
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const pitchSets = [...result.playable, ...result.stretch].map(seg =>
      seg.map(k => k.pitch).sort((a, b) => a - b).join(',')
    );
    const unique = new Set(pitchSets);
    expect(unique.size).toBe(pitchSets.length);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/engine/voicings.test.ts
git commit -m "test: add unit tests for findAllSegments()"
```

---

## Chunk 2: Pattern Generators (Block + Stride generateMulti)

### Task 5: Add `generateMulti` to block pattern

**Files:**
- Modify: `src/engine/voicings.ts:136-147` (block pattern definition)

- [ ] **Step 1: Add generateMulti method to block**

Replace the existing block definition with:

```ts
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add src/engine/voicings.ts
git commit -m "feat: add generateMulti to block voicing pattern"
```

---

### Task 6: Add `generateMulti` to stride pattern

**Files:**
- Modify: `src/engine/voicings.ts:267-279` (stride pattern definition)

- [ ] **Step 1: Add generateMulti method to stride**

Replace the existing stride definition with:

```ts
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
  generateMulti(segments) {
    const steps: PatternStep[] = [];
    let i = 0;
    // seg[0] is always the root — segment ordering invariant from findAllSegments
    for (const seg of segments.playable) {
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

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean.

- [ ] **Step 3: Commit**

```bash
git add src/engine/voicings.ts
git commit -m "feat: add generateMulti to stride voicing pattern"
```

---

### Task 7: Unit tests for generateMulti (block and stride)

**Files:**
- Modify: `src/engine/voicings.test.ts`

- [ ] **Step 1: Update the import at the top of the test file**

Merge `VOICING_PATTERNS` into the existing import:

```ts
import { findAllSegments, VOICING_PATTERNS } from './voicings';
```

- [ ] **Step 2: Add block generateMulti tests**

Append to the test file:

```ts

describe('block generateMulti', () => {
  const blockPattern = VOICING_PATTERNS.find(p => p.id === 'block')!;

  it('generates 2 steps per combo (ON + OFF)', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    expect(steps.length).toBe(segments.total * 2);
  });

  it('sets comboIndex sequentially across all combos', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    const indices = steps.map(s => s.comboIndex!);
    // Should go 0,0,1,1,2,2,...
    for (let i = 0; i < indices.length; i += 2) {
      expect(indices[i]).toBe(i / 2);
      expect(indices[i + 1]).toBe(i / 2);
    }
  });

  it('marks playable combos as isStretch=false, stretch combos as isStretch=true', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    const playableSteps = steps.filter(s => !s.isStretch);
    const stretchSteps = steps.filter(s => s.isStretch);
    expect(playableSteps.length).toBe(segments.playableCount * 2);
    expect(stretchSteps.length).toBe(segments.stretch.length * 2);
  });

  it('playable steps come before stretch steps', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    if (segments.stretch.length === 0) return; // skip if no stretch combos
    const steps = blockPattern.generateMulti!(segments);
    const firstStretchIdx = steps.findIndex(s => s.isStretch);
    const lastPlayableIdx = steps.findLastIndex(s => !s.isStretch);
    expect(firstStretchIdx).toBeGreaterThan(lastPlayableIdx);
  });

  it('ON steps have non-empty pressed, OFF steps have empty pressed', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].pressed.length).toBeGreaterThan(0);  // ON
      expect(steps[i + 1].pressed.length).toBe(0);         // OFF
    }
  });
});
```

- [ ] **Step 3: Add stride generateMulti tests**

Append to the test file:

```ts
describe('stride generateMulti', () => {
  const stridePattern = VOICING_PATTERNS.find(p => p.id === 'stride')!;

  it('generates 2 steps per combo (bass + upper)', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    expect(steps.length).toBe(segments.total * 2);
  });

  it('bass step has single pitch (root), upper step has remaining pitches', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].pressed.length).toBe(1);         // bass (root only)
      expect(steps[i + 1].pressed.length).toBe(2);     // upper (E + G)
    }
  });

  it('sets comboIndex and isStretch correctly', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    const playableSteps = steps.filter(s => !s.isStretch);
    expect(playableSteps.length).toBe(segments.playableCount * 2);
  });

  it('handles single-note chord (upper step has empty pressed)', () => {
    const segments = findAllSegments(['C'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    // Each combo: bass step has 1 pitch, upper step has 0 pitches
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].pressed.length).toBe(1);
      expect(steps[i + 1].pressed.length).toBe(0);
    }
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/engine/voicings.test.ts
git commit -m "test: add unit tests for block and stride generateMulti"
```

---

## Chunk 3: App Wiring + UI

### Task 8: Wire tieredSegments and shape counter in App.tsx

**Files:**
- Modify: `src/App.tsx:14,174-189,372-374,554-560`

- [ ] **Step 1: Update import**

In `src/App.tsx` line 14, add `findAllSegments` to the import:

```ts
import { VOICING_PATTERNS, findSegment, findAllSegments } from './engine/voicings';
```

Also add `TieredSegments` to the type import on line 2:

```ts
import type { NoteName, Mode, ChordCategory, Interval, PatternStep, GridKeyInfo, ResolvedChord, TieredSegments } from './types';
```

- [ ] **Step 2: Add tieredSegments useMemo**

After the existing `segment` useMemo (line 179), add:

```ts
  const tieredSegments: TieredSegments | null = useMemo(() => {
    if (highlightedNotes.length === 0) return null;
    return findAllSegments(highlightedNotes, transposedGridKeys);
  }, [highlightedNotes, transposedGridKeys]);
```

- [ ] **Step 3: Update patternSteps useMemo**

Replace the existing `patternSteps` useMemo (lines 186-189) with:

```ts
  const patternSteps: PatternStep[] = useMemo(() => {
    if (!patternDef) return [];
    if (patternDef.generateMulti && tieredSegments && tieredSegments.total > 0) {
      return patternDef.generateMulti(tieredSegments);
    }
    if (segment.length === 0) return [];
    return patternDef.generate(segment);
  }, [patternDef, segment, tieredSegments]);
```

- [ ] **Step 4: Derive shape counter values**

After the existing `currentStep` derivation (around line 372-374), add:

```ts
  const currentComboIndex = currentStep?.comboIndex ?? 0;
  const shapeNumber = currentComboIndex + 1;
  const totalCombos = tieredSegments?.total ?? 1;
  const isStretchCombo = currentStep?.isStretch ?? false;
  const isMultiSegmentPattern = patternDef?.generateMulti != null;
```

- [ ] **Step 5: Fix pitchToNote map for multi-segment patterns**

The existing `pitchToNote` map (around line 387-389) is built from the single `segment`, which only contains pitches from one combination. Multi-segment patterns produce steps with pitches from ALL combinations. Update it to use the full transposed grid:

```ts
  const pitchToNote = useMemo(
    () => new Map(transposedGridKeys.map(k => [k.pitch, k.note])),
    [transposedGridKeys],
  );
```

This ensures chip animations in ChordSelector work for any pitch on the grid, not just the single-segment pitches.

- [ ] **Step 6: Pass shape counter props to VoicingPatterns**

Update the `<VoicingPatterns>` JSX (around line 554-560) to include the new props:

```tsx
          <VoicingPatterns
            activePattern={activePattern}
            onPatternToggle={handlePatternToggle}
            isPlaying={isPatternPlaying}
            patternBPM={patternBPM}
            onBPMChange={setPatternBPM}
            shapeNumber={shapeNumber}
            totalShapes={totalCombos}
            isStretch={isStretchCombo}
            showShapeCounter={isPatternPlaying && isMultiSegmentPattern}
          />
```

- [ ] **Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Will fail — VoicingPatterns doesn't accept the new props yet. That's Task 9.

- [ ] **Step 8: Commit (WIP — completes with Task 9)**

Don't commit yet — wait for Task 9 to complete the circuit.

---

### Task 9: Add shape counter to VoicingPatterns component

**Files:**
- Modify: `src/components/VoicingPatterns.tsx:3-9,59-85`

- [ ] **Step 1: Update props interface**

Replace the existing `VoicingPatternsProps` interface:

```ts
interface VoicingPatternsProps {
  activePattern: string | null;
  onPatternToggle: (patternId: string) => void;
  isPlaying: boolean;
  patternBPM: number;
  onBPMChange: (bpm: number) => void;
  shapeNumber: number;
  totalShapes: number;
  isStretch: boolean;
  showShapeCounter: boolean;
}
```

- [ ] **Step 2: Destructure new props**

Update the function signature:

```ts
export default function VoicingPatterns({
  activePattern,
  onPatternToggle,
  isPlaying,
  patternBPM,
  onBPMChange,
  shapeNumber,
  totalShapes,
  isStretch,
  showShapeCounter,
}: VoicingPatternsProps) {
```

- [ ] **Step 3: Add shape counter display**

Inside the component, after the pattern buttons div and before the BPM slider section, add the shape counter:

```tsx
      {/* Shape counter — visible when multi-segment pattern is cycling */}
      {showShapeCounter && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: '#7A7A8E' }}>
            Shape {shapeNumber} / {totalShapes}
          </span>
          {isStretch && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{ color: '#E86902', background: '#E8690215' }}
            >
              stretch
            </span>
          )}
        </div>
      )}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors).

- [ ] **Step 5: Verify build succeeds**

Run: `npm run build`
Expected: Clean build.

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/components/VoicingPatterns.tsx
git commit -m "feat: wire multi-segment voicing cycling with shape counter UI"
```

---

### Task 10: Manual verification and final commit

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify block pattern cycling**

1. Select C major, triads, numeral I
2. Click Block pattern, then click again to play
3. Confirm: the grid cycles through multiple finger positions for C-E-G, not just the first one
4. Confirm: "Shape N / M" counter appears and increments
5. Confirm: when reaching stretch combos, "(stretch)" label appears in orange

- [ ] **Step 3: Verify stride pattern cycling**

1. Same chord selection
2. Click Stride, play
3. Confirm: bass note alternates with upper notes, cycling through different positions
4. Confirm: shape counter works

- [ ] **Step 4: Verify other patterns are unaffected**

1. Click Ascending — should still play single segment (no shape counter)
2. Click Descending — same
3. Click any other pattern — same

- [ ] **Step 5: Verify seventh chord has more combos**

1. Switch to Sevenths, Imaj7
2. Play Block — should show more shapes (up to 24)
3. Confirm playable ones come first

- [ ] **Step 6: Verify progression mode still works**

1. Switch to progression mode, pick a progression
2. Play with Block pattern active
3. Confirm: full combo cycle completes, then advances to next chord in progression

- [ ] **Step 7: Play the system sound on completion**

Run: `afplay /System/Library/Sounds/Glass.aiff`