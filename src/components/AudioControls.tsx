import { PRESETS, PRESET_IDS } from '../engine/audio';
import type { PresetId } from '../engine/audio';

interface AudioControlsProps {
  volume: number;
  isMuted: boolean;
  preset: PresetId;
  onVolumeChange: (v: number) => void;
  onMuteToggle: () => void;
  onPresetChange: (id: PresetId) => void;
}

export default function AudioControls({
  volume,
  isMuted,
  preset,
  onVolumeChange,
  onMuteToggle,
  onPresetChange,
}: AudioControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Preset selector */}
      <div className="flex gap-1" data-nav-group>
        {PRESET_IDS.map(id => {
          const isActive = preset === id;
          return (
            <button
              key={id}
              onClick={() => onPresetChange(id)}
              className="px-2 py-0.5 rounded text-xs font-medium transition-all duration-150"
              style={{
                background: isActive ? '#1E1E30' : 'transparent',
                border: isActive ? '1px solid #3A3A55' : '1px solid #1A1A28',
                color: isActive ? '#E8E8F0' : '#4A4A5E',
              }}
            >
              {PRESETS[id].label}
            </button>
          );
        })}
      </div>

      {/* Mute toggle */}
      <button
        onClick={onMuteToggle}
        className="flex items-center justify-center rounded-md transition-all duration-150"
        style={{
          width: 28,
          height: 28,
          background: isMuted ? '#1A1A28' : '#1E1E30',
          border: isMuted ? '1px solid #2A2A3A' : '1px solid #3A3A55',
          color: isMuted ? '#4A4A5E' : '#E8E8F0',
          fontSize: 14,
        }}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '\u{1F507}' : '\u{1F50A}'}
      </button>

      {/* Volume slider */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(volume * 100)}
        onChange={e => onVolumeChange(Number(e.target.value) / 100)}
        className="h-1 rounded-full appearance-none cursor-pointer"
        style={{
          width: 80,
          background: `linear-gradient(to right, #3A3A55 ${volume * 100}%, #1A1A28 ${volume * 100}%)`,
          accentColor: '#5A5A75',
          opacity: isMuted ? 0.35 : 1,
        }}
      />
      <span
        className="text-xs font-mono"
        style={{ color: isMuted ? '#4A4A5E' : '#6A6A7E', minWidth: 28 }}
      >
        {Math.round(volume * 100)}
      </span>
    </div>
  );
}
