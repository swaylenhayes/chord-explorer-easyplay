import { describe, it, expect } from 'vitest';
import { findAllSegments, VOICING_PATTERNS } from './voicings';
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
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    expect(result.total).toBe(12);
    expect(result.playableCount + result.stretch.length).toBe(result.total);
  });

  it('preserves chordNotes order in each segment (root at index 0)', () => {
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    for (const seg of [...result.playable, ...result.stretch]) {
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
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const allRow2 = result.playable.find(seg =>
      seg.every(k => k.row <= 2)
    );
    expect(allRow2).toBeDefined();
  });

  it('classifies full-grid-span combos as stretch', () => {
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const fullSpan = result.stretch.find(seg => {
      const rows = seg.map(k => k.row);
      return Math.min(...rows) <= 2 && Math.max(...rows) >= 5;
    });
    expect(fullSpan).toBeDefined();
  });

  it('handles single-note chord (just root)', () => {
    const result = findAllSegments(['C'], GRID_KEYS);
    expect(result.total).toBe(3);
    expect(result.playableCount).toBe(3);
    expect(result.stretch.length).toBe(0);
  });

  it('handles two-note interval', () => {
    const result = findAllSegments(['C', 'G'], GRID_KEYS);
    expect(result.total).toBe(6);
  });

  it('handles seventh chord (4 notes)', () => {
    const result = findAllSegments(['C', 'E', 'G', 'B'] as NoteName[], GRID_KEYS);
    expect(result.total).toBe(24);
    expect(result.playableCount).toBeGreaterThan(0);
    expect(result.playableCount).toBeLessThan(24);
  });

  it('deduplicates identical pitch sets', () => {
    const result = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const pitchSets = [...result.playable, ...result.stretch].map(seg =>
      seg.map(k => k.pitch).sort((a, b) => a - b).join(',')
    );
    const unique = new Set(pitchSets);
    expect(unique.size).toBe(pitchSets.length);
  });
});

describe('block generateMulti', () => {
  const blockPattern = VOICING_PATTERNS.find(p => p.id === 'block')!;

  it('generates 2 steps per combo (ON + OFF)', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    expect(steps.length).toBe(segments.total * 4);
  });

  it('sets comboIndex consistently within each double-tap group', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    // 4 steps per combo: ON-OFF-ON-OFF, all same comboIndex
    for (let i = 0; i < steps.length; i += 4) {
      const idx = steps[i].comboIndex;
      expect(steps[i + 1].comboIndex).toBe(idx);
      expect(steps[i + 2].comboIndex).toBe(idx);
      expect(steps[i + 3].comboIndex).toBe(idx);
    }
  });

  it('marks playable combos as isStretch=false, stretch combos as isStretch=true', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    const playableSteps = steps.filter(s => !s.isStretch);
    const stretchSteps = steps.filter(s => s.isStretch);
    expect(playableSteps.length).toBe(segments.playableCount * 4);
    expect(stretchSteps.length).toBe(segments.stretch.length * 4);
  });

  it('playable steps come before stretch steps', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    if (segments.stretch.length === 0) return;
    const steps = blockPattern.generateMulti!(segments);
    const firstStretchIdx = steps.findIndex(s => s.isStretch);
    let lastPlayableIdx = -1;
    for (let j = steps.length - 1; j >= 0; j--) {
      if (!steps[j].isStretch) { lastPlayableIdx = j; break; }
    }
    expect(firstStretchIdx).toBeGreaterThan(lastPlayableIdx);
  });

  it('ON steps have non-empty pressed, OFF steps have empty pressed', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = blockPattern.generateMulti!(segments);
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].pressed.length).toBeGreaterThan(0);
      expect(steps[i + 1].pressed.length).toBe(0);
    }
  });
});

describe('stride generateMulti', () => {
  const stridePattern = VOICING_PATTERNS.find(p => p.id === 'stride')!;

  it('generates 4 steps per combo (double-tap: bass-upper-bass-upper)', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    expect(steps.length).toBe(segments.total * 4);
  });

  it('bass step has single pitch (root), upper step has remaining pitches', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].pressed.length).toBe(1);
      expect(steps[i + 1].pressed.length).toBe(2);
    }
  });

  it('sets comboIndex consistently within each double-tap group', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    for (let i = 0; i < steps.length; i += 4) {
      const idx = steps[i].comboIndex;
      expect(steps[i + 1].comboIndex).toBe(idx);
      expect(steps[i + 2].comboIndex).toBe(idx);
      expect(steps[i + 3].comboIndex).toBe(idx);
    }
  });

  it('sets comboIndex and isStretch correctly', () => {
    const segments = findAllSegments(['C', 'E', 'G'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    const playableSteps = steps.filter(s => !s.isStretch);
    expect(playableSteps.length).toBe(segments.playableCount * 4);
  });

  it('handles single-note chord (upper step has empty pressed)', () => {
    const segments = findAllSegments(['C'], GRID_KEYS);
    const steps = stridePattern.generateMulti!(segments);
    for (let i = 0; i < steps.length; i += 2) {
      expect(steps[i].pressed.length).toBe(1);
      expect(steps[i + 1].pressed.length).toBe(0);
    }
  });
});
