import type { NoteName } from '../types';
import { getFifthsFromRoot, getTemperatureColor, getTemperatureTextColor } from '../engine/colors';

export default function Legend({ selectedKey }: { selectedKey: NoteName }) {
  const ordered = getFifthsFromRoot(selectedKey);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#131320', border: '1px solid #1E1E2E' }}
    >
      <div
        className="text-sm font-semibold tracking-widest mb-3"
        style={{ color: '#4A4A5E' }}
      >
        INTERVAL GRAVITY
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {ordered.map(note => {
          const bg = getTemperatureColor(note, selectedKey);
          return (
            <div key={note} className="flex items-center gap-1.5">
              <div
                className="rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  background: bg,
                  border: `1px solid ${bg}44`,
                }}
              />
              <span
                className="font-bold"
                style={{ fontSize: 11, color: getTemperatureTextColor(note, selectedKey) === '#2A2A2A' ? '#C0C0D0' : '#9090A8' }}
              >
                {note}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-1.5" style={{ fontSize: 10, color: '#4A4A5E' }}>
        Circle of fifths from {selectedKey} — Warm (red/orange) = harmonically close — Cool (blue/purple) = far
      </div>
    </div>
  );
}
