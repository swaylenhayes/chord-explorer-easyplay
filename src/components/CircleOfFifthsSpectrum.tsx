import type { NoteName } from '../types';
import { getTemperatureColor, getFifthsFromRoot } from '../engine/colors';

interface CircleOfFifthsSpectrumProps {
  selectedKey: NoteName;
  scaleNotes: NoteName[];
}

export default function CircleOfFifthsSpectrum({ selectedKey, scaleNotes }: CircleOfFifthsSpectrumProps) {
  const ordered = getFifthsFromRoot(selectedKey);

  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: '#131320', border: '1px solid #1E1E2E' }}
    >
      {/* Section header — matches KEY, CHORDS, VOICING PATTERNS */}
      <div className="text-sm font-semibold tracking-widest mb-3" style={{ color: '#4A4A5E' }}>
        CIRCLE OF FIFTHS
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        {/* Near / Far labels */}
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: '#E8E8F0' }}>
            &larr; harmonically close
          </span>
          <span className="text-xs font-medium" style={{ color: '#E8E8F0' }}>
            harmonically far &rarr;
          </span>
        </div>

        {/* Spectrum row */}
        <div className="flex gap-0.5">
          {ordered.map((note, i) => {
            const bg = getTemperatureColor(note, selectedKey);
            const inScale = scaleNotes.includes(note);

            return (
              <div
                key={note}
                className="flex-1 flex flex-col items-center"
                style={{ gap: 1 }}
              >
                <div
                  className="rounded w-full"
                  style={{
                    aspectRatio: '1',
                    background: bg,
                    opacity: inScale ? 1 : 0.35,
                    border: inScale
                      ? '1.5px solid rgba(255,255,255,0.85)'
                      : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: inScale ? `0 0 6px oklch(from ${bg} l c h / 0.27)` : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: inScale ? 600 : 400,
                    color: inScale ? '#E8E8F0' : '#4A4A5E',
                    lineHeight: 1,
                  }}
                >
                  {note}
                </span>
                <span style={{ fontSize: 7, color: '#3E3E52', lineHeight: 1 }}>
                  {i}
                </span>
              </div>
            );
          })}
        </div>

        {/* Scale legend */}
        <div className="flex justify-center gap-4 mt-2.5">
          <div className="flex items-center gap-1.5">
            <div
              className="rounded"
              style={{
                width: 10,
                height: 10,
                background: '#555',
                border: '1.5px solid rgba(255,255,255,0.85)',
              }}
            />
            <span className="text-xs" style={{ color: '#7A7A8E' }}>In scale</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="rounded"
              style={{
                width: 10,
                height: 10,
                background: '#555',
                opacity: 0.35,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <span className="text-xs" style={{ color: '#7A7A8E' }}>Outside scale</span>
          </div>
        </div>
      </div>
    </div>
  );
}
