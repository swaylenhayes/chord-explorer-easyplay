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
