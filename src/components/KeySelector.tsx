import type { NoteName, Mode } from '../types';
import { getNoteColor, getTextColor } from '../engine/colors';

const NATURAL_NOTES: NoteName[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const ACCIDENTAL_NOTES: NoteName[] = ['C#', 'Eb', 'F#', 'Ab', 'Bb'];

interface KeySelectorProps {
  selectedKey: NoteName;
  selectedMode: Mode;
  onKeyChange: (key: NoteName) => void;
  onModeChange: (mode: Mode) => void;
}

function NoteButton({ note, isActive, onClick }: { note: NoteName; isActive: boolean; onClick: (n: NoteName) => void }) {
  const bg = getNoteColor(note);
  const textColor = getTextColor(note);
  return (
    <button
      onClick={() => onClick(note)}
      className="flex-1 rounded-lg font-bold transition-all duration-150"
      style={{
        padding: '6px 0',
        fontSize: 12,
        background: bg,
        color: textColor,
        opacity: isActive ? 1 : 0.5,
        border: isActive ? '2px solid #FFF' : '2px solid transparent',
        boxShadow: isActive ? `0 0 12px ${bg}66` : 'none',
        textShadow: textColor === '#FFFFFF' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {note}
    </button>
  );
}

export default function KeySelector({
  selectedKey,
  selectedMode,
  onKeyChange,
  onModeChange,
}: KeySelectorProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#131320', border: '1px solid #1E1E2E' }}
    >
      <div className="text-sm font-semibold tracking-widest mb-3" style={{ color: '#4A4A5E' }}>
        KEY
      </div>

      {/* Mode toggle — shows "{Key} Major / {Key} Minor" */}
      <div className="flex gap-1.5 mb-3" data-nav-group>
        {(['major', 'minor'] as Mode[]).map(mode => {
          const isActive = selectedMode === mode;
          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className="flex-1 rounded-lg font-bold py-2 transition-all duration-150"
              style={{
                fontSize: 14,
                background: isActive ? '#1E1E30' : 'transparent',
                border: isActive ? '1.5px solid rgba(255,255,255,0.85)' : '1.5px solid #1A1A28',
                color: isActive ? '#E8E8F0' : '#4A4A5E',
              }}
            >
              {selectedKey} {mode === 'major' ? 'Major' : 'Minor'}
            </button>
          );
        })}
      </div>

      {/* Row 1: Natural notes (white keys) */}
      <div className="flex gap-1.5 mb-1.5" data-nav-group>
        {NATURAL_NOTES.map(note => (
          <NoteButton key={note} note={note} isActive={note === selectedKey} onClick={onKeyChange} />
        ))}
      </div>

      {/* Row 2: Accidentals (black keys) */}
      <div className="flex gap-1.5" data-nav-group>
        {ACCIDENTAL_NOTES.map(note => (
          <NoteButton key={note} note={note} isActive={note === selectedKey} onClick={onKeyChange} />
        ))}
      </div>
    </div>
  );
}
