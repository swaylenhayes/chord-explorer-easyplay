import { VOICING_PATTERNS } from '../engine/voicings';

interface VoicingPatternsProps {
  activePattern: string | null;
  onPatternToggle: (patternId: string) => void;
  isPlaying: boolean;
  patternBPM: number;
  onBPMChange: (bpm: number) => void;
}

export default function VoicingPatterns({
  activePattern,
  onPatternToggle,
  isPlaying,
  patternBPM,
  onBPMChange,
}: VoicingPatternsProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: '#131320', border: '1px solid #1E1E2E' }}
    >
      <div className="text-sm font-semibold tracking-widest mb-3" style={{ color: '#4A4A5E' }}>
        VOICING PATTERNS
      </div>

      {/* Pattern buttons */}
      <div className="flex gap-1.5 flex-wrap" data-nav-group>
        {VOICING_PATTERNS.map(p => {
          const isActive = activePattern === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onPatternToggle(p.id)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={{
                background: isActive ? '#1E1E35' : '#0F0F18',
                border: isActive && isPlaying
                  ? '1.5px solid rgba(255,255,255,0.85)'
                  : isActive
                    ? '1px solid #3A3A55'
                    : '1px solid #1A1A28',
                color: isActive ? '#FFF' : '#6A6A7E',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {p.name}
              {isActive && (
                <span className="ml-1.5" style={{ color: isPlaying ? '#5AE85A' : '#6A6A7E', fontSize: 10 }}>
                  {isPlaying ? '\u25B6' : '\u25A0'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* BPM slider — visible when a pattern is selected */}
      {activePattern && (
        <div className="mt-3 pt-2" style={{ borderTop: '1px solid #1A1A28' }}>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium" style={{ color: '#6A6A7E', minWidth: 28 }}>
              BPM
            </span>
            <input
              type="range"
              min={40}
              max={240}
              value={patternBPM}
              onChange={e => onBPMChange(Number(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3A3A55 ${((patternBPM - 40) / 200) * 100}%, #1A1A28 ${((patternBPM - 40) / 200) * 100}%)`,
                accentColor: '#5A5A75',
              }}
            />
            <span
              className="text-xs font-mono font-bold"
              style={{ color: '#E8E8F0', minWidth: 32, textAlign: 'right' }}
            >
              {patternBPM}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
