import { describe, it, expect } from 'vitest';
import { CHROMATIC } from '../engine/theory';
import type { NoteName } from '../types';

/** Pure function — mirrors the logic that PianoKeyboard will use internally */
function buildPianoKeys(rootKey: NoteName) {
  const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);
  const rootOffset = CHROMATIC.indexOf(rootKey);
  return Array.from({ length: 25 }, (_, pitch) => ({
    pitch,
    note: CHROMATIC[(pitch + rootOffset) % 12] as NoteName,
    isBlack: BLACK_SEMITONES.has(pitch % 12),
  }));
}

describe('Piano key transposition', () => {
  it('C major: pitch 0 = C, pitch 7 = G', () => {
    const keys = buildPianoKeys('C');
    expect(keys[0].note).toBe('C');
    expect(keys[7].note).toBe('G');
    expect(keys[12].note).toBe('C');
    expect(keys[24].note).toBe('C');
  });

  it('F major: pitch 0 = F, pitch 7 = C', () => {
    const keys = buildPianoKeys('F');
    expect(keys[0].note).toBe('F');
    expect(keys[2].note).toBe('G');
    expect(keys[5].note).toBe('Bb');
    expect(keys[7].note).toBe('C');
  });

  it('B major: pitch 0 = B, pitch 1 = C', () => {
    const keys = buildPianoKeys('B');
    expect(keys[0].note).toBe('B');
    expect(keys[1].note).toBe('C');
  });

  it('isBlack stays position-based regardless of root key', () => {
    const cKeys = buildPianoKeys('C');
    const fKeys = buildPianoKeys('F');
    for (let i = 0; i < 25; i++) {
      expect(fKeys[i].isBlack).toBe(cKeys[i].isBlack);
    }
  });

  it('all 25 keys always generated', () => {
    for (const root of CHROMATIC) {
      const keys = buildPianoKeys(root as NoteName);
      expect(keys).toHaveLength(25);
      expect(keys[0].pitch).toBe(0);
      expect(keys[24].pitch).toBe(24);
    }
  });
});

describe('Piano MIDI pitch conversion', () => {
  function convertMidiToPiano(midiPitches: Set<number>, rootKey: NoteName): Set<number> {
    const offset = CHROMATIC.indexOf(rootKey);
    return new Set(
      [...midiPitches].map(p => p - offset).filter(p => p >= 0 && p <= 24)
    );
  }

  it('C major: MIDI pitches pass through unchanged', () => {
    const midi = new Set([0, 7, 12]);
    const result = convertMidiToPiano(midi, 'C');
    expect(result).toEqual(new Set([0, 7, 12]));
  });

  it('F major: MIDI pitch 5 maps to piano position 0', () => {
    const midi = new Set([5, 10, 14]);
    const result = convertMidiToPiano(midi, 'F');
    expect(result).toEqual(new Set([0, 5, 9]));
  });

  it('F major: MIDI pitches 0-4 are below visible range and filtered out', () => {
    const midi = new Set([0, 1, 2, 3, 4]);
    const result = convertMidiToPiano(midi, 'F');
    expect(result.size).toBe(0);
  });

  it('B major: MIDI pitch 24 maps to piano position 13', () => {
    const midi = new Set([11, 24]);
    const result = convertMidiToPiano(midi, 'B');
    expect(result).toEqual(new Set([0, 13]));
  });
});
