import { describe, it, expect } from 'vitest';
import {
  getTemperaturePosition,
  getTemperatureColor,
  getTemperatureTextColor,
  NOTE_COLORS,
  FIFTHS_ORDER,
} from './colors';

describe('getTemperaturePosition', () => {
  it('returns 0 for C in C (root)', () => {
    expect(getTemperaturePosition('C', 'C')).toBe(0);
  });

  it('returns 11 for F in C (farthest)', () => {
    expect(getTemperaturePosition('F', 'C')).toBe(11);
  });

  it('returns 11 for C in G (farthest from G)', () => {
    expect(getTemperaturePosition('C', 'G')).toBe(11);
  });

  it('returns 0 for G in G (root)', () => {
    expect(getTemperaturePosition('G', 'G')).toBe(0);
  });

  it('normalises Gb to F# (enharmonic)', () => {
    expect(getTemperaturePosition('Gb', 'C')).toBe(getTemperaturePosition('F#', 'C'));
  });

  it('normalises Db to C# (enharmonic)', () => {
    expect(getTemperaturePosition('Db', 'C')).toBe(getTemperaturePosition('C#', 'C'));
  });

  it('normalises G# to Ab (enharmonic)', () => {
    expect(getTemperaturePosition('G#', 'C')).toBe(getTemperaturePosition('Ab', 'C'));
  });
});

describe('getTemperatureColor', () => {
  it('returns #CC1F16 (red) for root C in C', () => {
    expect(getTemperatureColor('C', 'C')).toBe('#CC1F16');
  });

  it('returns #6C2EAF (purple) for C in G (farthest from G)', () => {
    expect(getTemperatureColor('C', 'G')).toBe('#6C2EAF');
  });

  it('returns #CC1F16 (red) for G in G (root)', () => {
    expect(getTemperatureColor('G', 'G')).toBe('#CC1F16');
  });

  it('C-major identity: every note matches NOTE_COLORS exactly', () => {
    for (const note of FIFTHS_ORDER) {
      expect(getTemperatureColor(note, 'C')).toBe(NOTE_COLORS[note]);
    }
  });
});

describe('getTemperatureTextColor', () => {
  it('returns dark (#2A2A2A) for position 2 — D in C', () => {
    expect(getTemperatureTextColor('D', 'C')).toBe('#2A2A2A');
  });

  it('returns dark (#2A2A2A) for position 3 — A in C', () => {
    expect(getTemperatureTextColor('A', 'C')).toBe('#2A2A2A');
  });

  it('returns dark (#2A2A2A) for position 4 — E in C', () => {
    expect(getTemperatureTextColor('E', 'C')).toBe('#2A2A2A');
  });

  it('returns dark (#2A2A2A) for position 5 — B in C', () => {
    expect(getTemperatureTextColor('B', 'C')).toBe('#2A2A2A');
  });

  it('returns white (#FFFFFF) for position 0 — C in C', () => {
    expect(getTemperatureTextColor('C', 'C')).toBe('#FFFFFF');
  });

  it('returns white (#FFFFFF) for position 11 — F in C', () => {
    expect(getTemperatureTextColor('F', 'C')).toBe('#FFFFFF');
  });

  it('returns white (#FFFFFF) for position 6 — F# in C', () => {
    expect(getTemperatureTextColor('F#', 'C')).toBe('#FFFFFF');
  });
});
