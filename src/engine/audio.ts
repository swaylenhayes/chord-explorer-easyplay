// ─── Audio Engine ───
// Multi-voice synthesizer using Web Audio API. Zero external dependencies.
// Supports switchable presets: sax, pad, piano.

// ─── Preset types ───
export type PresetId = 'sax' | 'pad' | 'piano';

interface OscConfig { type: OscillatorType; detune: number; gain: number }

interface SynthPreset {
  label: string;
  oscillators: OscConfig[];
  filterType: BiquadFilterType;
  filterFreq: number;
  filterQ: number;
  attack: number;
  decay: number;
  sustain: number;   // gain multiplier of peak
  release: number;
  fade: number;       // seconds to fade sustained note to near-silence
  voicePeak: number;
  vibrato: { rate: number; depth: number; delay: number; ramp: number } | null;
  reverb: { wet: number; delay: number; feedback: number; tone: number };
}

// ─── Presets ───
export const PRESETS: Record<PresetId, SynthPreset> = {
  sax: {
    label: 'Sax',
    oscillators: [
      { type: 'sawtooth', detune:  0, gain: 0.60 },
      { type: 'square',   detune:  3, gain: 0.25 },
      { type: 'sawtooth', detune: -5, gain: 0.15 },
    ],
    filterType: 'bandpass',
    filterFreq: 1200,
    filterQ: 2.0,
    attack: 0.04,
    decay: 0.2,
    sustain: 0.8,
    release: 0.6,
    fade: 4.0,
    voicePeak: 0.10,
    vibrato: { rate: 5, depth: 15, delay: 0.5, ramp: 0.4 },
    reverb: { wet: 0.25, delay: 0.03, feedback: 0.3, tone: 3000 },
  },
  pad: {
    label: 'Pad',
    oscillators: [
      { type: 'triangle',  detune:  0, gain: 0.50 },
      { type: 'sawtooth',  detune:  7, gain: 0.15 },
      { type: 'triangle',  detune: -7, gain: 0.35 },
    ],
    filterType: 'lowpass',
    filterFreq: 800,
    filterQ: 0.7,
    attack: 0.25,
    decay: 0.3,
    sustain: 0.7,
    release: 1.0,
    fade: 6.0,
    voicePeak: 0.12,
    vibrato: null,
    reverb: { wet: 0.35, delay: 0.04, feedback: 0.35, tone: 2500 },
  },
  piano: {
    label: 'Piano',
    oscillators: [
      { type: 'triangle',  detune:  0, gain: 0.55 },
      { type: 'square',    detune:  0, gain: 0.10 },
      { type: 'sawtooth',  detune:  1, gain: 0.35 },
    ],
    filterType: 'lowpass',
    filterFreq: 2400,
    filterQ: 0.5,
    attack: 0.005,
    decay: 0.4,
    sustain: 0.25,
    release: 0.3,
    fade: 2.5,
    voicePeak: 0.14,
    vibrato: null,
    reverb: { wet: 0.20, delay: 0.02, feedback: 0.2, tone: 4000 },
  },
};

export const PRESET_IDS: PresetId[] = ['sax', 'pad', 'piano'];

// ─── Pitch conversion ───
// Grid pitch indices: 0–24 represent the 25 physical keys.
// When root = C, MIDI = 48 + pitch. When root = D, MIDI = 50 + pitch, etc.
function pitchToFrequency(pitch: number, rootOffset: number): number {
  const midi = 48 + rootOffset + pitch;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ─── Voice (one per active note) ───
interface Voice {
  oscillators: OscillatorNode[];
  filter: BiquadFilterNode;
  envelope: GainNode;
  output: GainNode;
  lfo: OscillatorNode | null;
  lfoDepth: GainNode | null;
  releaseTimer: ReturnType<typeof setTimeout> | null;
}

export class AudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private muteGate: GainNode;
  private reverbInput: GainNode;
  private reverbDelay: DelayNode;
  private reverbFeedback: GainNode;
  private reverbFilter: BiquadFilterNode;
  private voices = new Map<number, Voice>();
  private _volume = 0.6;
  private _muted = false;
  private _rootOffset = 0;  // semitone offset from C for grid transposition
  private preset: SynthPreset = PRESETS.sax;

  constructor() {
    this.ctx = new AudioContext();

    // Master chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;
    this.muteGate = this.ctx.createGain();
    this.muteGate.gain.value = 1;
    this.masterGain.connect(this.muteGate);
    this.muteGate.connect(this.ctx.destination);

    // Shared feedback reverb
    this.reverbInput = this.ctx.createGain();
    this.reverbInput.gain.value = this.preset.reverb.wet;

    this.reverbDelay = this.ctx.createDelay(0.1);
    this.reverbDelay.delayTime.value = this.preset.reverb.delay;

    this.reverbFeedback = this.ctx.createGain();
    this.reverbFeedback.gain.value = this.preset.reverb.feedback;

    this.reverbFilter = this.ctx.createBiquadFilter();
    this.reverbFilter.type = 'lowpass';
    this.reverbFilter.frequency.value = this.preset.reverb.tone;

    // Reverb loop: input → delay → feedback → filter → delay (loop)
    this.reverbInput.connect(this.reverbDelay);
    this.reverbDelay.connect(this.reverbFeedback);
    this.reverbFeedback.connect(this.reverbFilter);
    this.reverbFilter.connect(this.reverbDelay);

    // Reverb output taps from the delay into the master
    this.reverbDelay.connect(this.masterGain);
  }

  // ─── iOS / Safari requires user gesture to start audio ───
  private ensureResumed(): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ─── Create a single synth voice for a pitch ───
  private createVoice(pitch: number): Voice {
    const p = this.preset;
    const freq = pitchToFrequency(pitch, this._rootOffset);
    const now = this.ctx.currentTime;

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = p.filterType;
    filter.frequency.value = p.filterFreq;
    filter.Q.value = p.filterQ;

    // Envelope gain (ADSR + fade)
    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(p.voicePeak, now + p.attack);
    envelope.gain.linearRampToValueAtTime(p.voicePeak * p.sustain, now + p.attack + p.decay);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + p.attack + p.decay + p.fade);

    // Per-voice output gain
    const output = this.ctx.createGain();
    output.gain.value = 1;

    // Vibrato LFO (optional per preset)
    let lfo: OscillatorNode | null = null;
    let lfoDepth: GainNode | null = null;

    if (p.vibrato) {
      lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = p.vibrato.rate;

      lfoDepth = this.ctx.createGain();
      lfoDepth.gain.setValueAtTime(0, now);
      lfoDepth.gain.setValueAtTime(0, now + p.vibrato.delay);
      lfoDepth.gain.linearRampToValueAtTime(
        p.vibrato.depth,
        now + p.vibrato.delay + p.vibrato.ramp,
      );

      lfo.connect(lfoDepth);
      lfo.start(now);
    }

    // Oscillators
    const oscillators = p.oscillators.map(cfg => {
      const osc = this.ctx.createOscillator();
      osc.type = cfg.type;
      osc.frequency.value = freq;
      osc.detune.value = cfg.detune;

      if (lfoDepth) lfoDepth.connect(osc.detune);

      const mix = this.ctx.createGain();
      mix.gain.value = cfg.gain;

      osc.connect(mix);
      mix.connect(filter);
      osc.start(now);
      return osc;
    });

    filter.connect(envelope);
    envelope.connect(output);

    // Dry path (direct) + wet path (reverb send)
    output.connect(this.masterGain);
    output.connect(this.reverbInput);

    return { oscillators, filter, envelope, output, lfo, lfoDepth, releaseTimer: null };
  }

  // ─── Tear down a voice (stop oscillators, disconnect) ───
  private destroyVoice(voice: Voice): void {
    if (voice.releaseTimer !== null) clearTimeout(voice.releaseTimer);
    voice.oscillators.forEach(osc => {
      try { osc.stop(); } catch { /* already stopped */ }
      osc.disconnect();
    });
    if (voice.lfo) {
      try { voice.lfo.stop(); } catch { /* already stopped */ }
      voice.lfo.disconnect();
    }
    voice.lfoDepth?.disconnect();
    voice.filter.disconnect();
    voice.envelope.disconnect();
    voice.output.disconnect();
  }

  // ─── Public: trigger a note ───
  noteOn(pitch: number): void {
    this.ensureResumed();
    const existing = this.voices.get(pitch);

    if (existing) {
      // If the voice is releasing, destroy it and create a fresh one.
      // Trying to resurrect a releasing voice is unreliable because
      // cancelScheduledValues + .value can return stale gain values.
      if (existing.releaseTimer !== null) {
        clearTimeout(existing.releaseTimer);
        this.destroyVoice(existing);
        this.voices.delete(pitch);
      } else {
        // Voice is still sustaining — just bump the envelope
        const now = this.ctx.currentTime;
        existing.envelope.gain.cancelScheduledValues(now);
        existing.envelope.gain.setValueAtTime(existing.envelope.gain.value, now);
        existing.envelope.gain.linearRampToValueAtTime(
          this.preset.voicePeak * this.preset.sustain,
          now + 0.05,
        );
        return;
      }
    }

    const voice = this.createVoice(pitch);
    this.voices.set(pitch, voice);
  }

  // ─── Public: release a note ───
  noteOff(pitch: number): void {
    const voice = this.voices.get(pitch);
    if (!voice) return;

    const p = this.preset;
    const now = this.ctx.currentTime;
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setValueAtTime(voice.envelope.gain.value, now);
    voice.envelope.gain.linearRampToValueAtTime(0, now + p.release);

    // Fade out vibrato during release
    if (voice.lfoDepth) {
      voice.lfoDepth.gain.cancelScheduledValues(now);
      voice.lfoDepth.gain.setValueAtTime(voice.lfoDepth.gain.value, now);
      voice.lfoDepth.gain.linearRampToValueAtTime(0, now + p.release * 0.5);
    }

    // Schedule cleanup after release completes
    voice.releaseTimer = setTimeout(() => {
      this.destroyVoice(voice);
      this.voices.delete(pitch);
    }, (p.release + 0.1) * 1000);
  }

  // ─── Public: set the active note set (diff-based) ───
  setNotes(pitches: number[]): void {
    const target = new Set(pitches);
    const current = new Set(this.voices.keys());

    for (const p of current) {
      if (!target.has(p)) this.noteOff(p);
    }
    for (const p of target) {
      if (!current.has(p) || this.voices.get(p)?.releaseTimer !== null) {
        this.noteOn(p);
      }
    }
  }

  // ─── Public: silence everything ───
  allNotesOff(): void {
    for (const pitch of this.voices.keys()) {
      this.noteOff(pitch);
    }
  }

  // ─── Preset switching ───
  setPreset(id: PresetId): void {
    this.preset = PRESETS[id];

    // Update reverb parameters to match new preset
    const now = this.ctx.currentTime;
    this.reverbInput.gain.linearRampToValueAtTime(this.preset.reverb.wet, now + 0.05);
    this.reverbDelay.delayTime.linearRampToValueAtTime(this.preset.reverb.delay, now + 0.05);
    this.reverbFeedback.gain.linearRampToValueAtTime(this.preset.reverb.feedback, now + 0.05);
    this.reverbFilter.frequency.linearRampToValueAtTime(this.preset.reverb.tone, now + 0.05);

    // Kill active voices — they'll be recreated with the new sound
    for (const voice of this.voices.values()) {
      this.destroyVoice(voice);
    }
    this.voices.clear();
  }

  // ─── Root offset (grid transposition) ───
  setRootOffset(offset: number): void {
    if (offset === this._rootOffset) return;
    this._rootOffset = offset;
    // Kill active voices — they'll be recreated at the new pitch
    for (const voice of this.voices.values()) {
      this.destroyVoice(voice);
    }
    this.voices.clear();
  }

  // ─── Volume and mute ───
  setVolume(v: number): void {
    this._volume = Math.max(0, Math.min(1, v));
    this.masterGain.gain.linearRampToValueAtTime(this._volume, this.ctx.currentTime + 0.05);
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.muteGate.gain.linearRampToValueAtTime(muted ? 0 : 1, this.ctx.currentTime + 0.05);
  }

  getVolume(): number { return this._volume; }
  getMuted(): boolean { return this._muted; }

  // ─── Cleanup ───
  dispose(): void {
    for (const voice of this.voices.values()) {
      this.destroyVoice(voice);
    }
    this.voices.clear();
    this.ctx.close();
  }
}
