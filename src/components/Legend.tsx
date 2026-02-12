import { FIFTHS_ORDER, getNoteColor, getTextColor, STICKER_NAMES } from '../engine/colors';

export default function Legend() {
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
        {FIFTHS_ORDER.map(note => (
          <div key={note} className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: 14,
                height: 14,
                background: getNoteColor(note),
                border: `1px solid ${getNoteColor(note)}44`,
              }}
            />
            <span
              className="font-bold"
              style={{ fontSize: 11, color: getTextColor(note) === '#2A2A2A' ? '#C0C0D0' : '#9090A8' }}
            >
              {note}
            </span>
            <span style={{ fontSize: 9, color: '#3E3E52' }}>
              {STICKER_NAMES[note]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1.5" style={{ fontSize: 10, color: '#4A4A5E' }}>
        Circle of fifths from C — Warm (red/orange) = harmonically close — Cool (blue/purple) = far
      </div>
    </div>
  );
}
