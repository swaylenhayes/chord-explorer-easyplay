---
title: current-state
type: note
permalink: chordexplore/docs/current-state
---

# Current State

## Last Session: 2026-03-12

### What's Complete
**Phase 1** — Grid + Key + Triads (fully done)
**Phase 2** — Expanded Chords + Voicings + UI (fully done)
**Phase 3** — Progressions (fully done)
**Audio Playback** — Web Audio API synthesizer with 3 presets (done)
**Keyboard Navigation** — Arrow-key control of right-column UI (done)
**Grid Transposition** — Grid note labels shift when key changes (done)
**MIDI Input** — Physical EasyPlay1S keypresses reflected on grid (done)
**Multi-Segment Voicing Cycling** — Block + Stride patterns cycle all physical key combinations (done)
**Stride Double-Tap** — Stride pattern now double-taps each shape (bass-upper-bass-upper) like Block (done)
**Piano Keyboard View** — Standard piano keyboard with tab switcher, shared controls (done)
**Vitest** — Unit test framework with 20 engine tests (done)

### Multi-Segment Voicing Cycling
Block and Stride voicing patterns now cycle through ALL possible physical key combinations for a chord on the 25-key grid, instead of repeating a single fingering.

- **Tiered playability**: Playable combinations (within 2 adjacent row-pairs) play first, then stretch combinations
- **`findAllSegments()`**: Cartesian product of note positions, deduplicated by pitch set, classified into playable/stretch tiers, sorted by lowest pitch ascending
- **Block double-tap**: Each shape plays ON-OFF-ON-OFF (4 steps) before advancing
- **Stride double-tap**: Each shape plays bass-upper-bass-upper (4 steps) before advancing
- **Shape counter UI**: "Shape N / M" between pattern buttons and BPM slider; orange "(stretch)" badge in stretch tier; hidden for single-combo chords
- **Dual-method architecture**: Optional `generateMulti(TieredSegments)` on `VoicingPattern` alongside unchanged `generate(segment)`
- **Segment ordering invariant**: Each segment preserves `chordNotes` order — `segment[0]` is always the root
- **pitchToNote map**: Built from full `transposedGridKeys` to support chip animations across all combos
- **Design spec**: `_docs/specs/2026-03-12-multi-segment-voicing-cycling-design.md`
- **Implementation plan**: `_docs/plans/2026-03-12-multi-segment-voicing-cycling.md`

### Piano Keyboard View
Top-level tab switcher (EasyPlay | Piano) swaps between the 6-row EasyPlay grid and a standard 25-key piano keyboard (C3–C5). All controls, voicing patterns, progressions, and audio are shared.

- **Tab switcher**: Above the keyboard area in the left column
- **Piano keys**: Standard white/black layout, 15 white + 10 black keys. Animate on press/held with gentle scaleY + color shift (piano-tap/piano-quiver CSS keyframes)
- **Note chip rows**: Colored rounded squares above black keys and below white keys, matching the NoteChip style from ChordSelector. Only the chips for the active voicing step animate — others stay static at full opacity
- **Pitch-based chip animation**: Chips use pitch-indexed sets (not note names) so only the specific octave instance animates, matching the actual key presses
- **Pitch space conversion**: Grid pitches offset by `rootOffset` for piano (grid pitch 0 = root key, piano pitch 0 = C). Computed in App.tsx via `pianoPressedPitches`/`pianoHeldPitches` memos
- **MIDI**: Passes through unchanged (already absolute pitches)
- **No key dimming**: Piano keys stay at full opacity regardless of chord selection — motion on chips carries the visual feedback

### Synth Voice Presets
Three switchable synth voices in the header bar:

- **Sax** — Sawtooth/square through bandpass 1200 Hz Q2.0, delayed vibrato (5 Hz, 15¢, 0.5s onset), 4s fade
- **Pad** — Triangle waves through lowpass 800 Hz, slow 250ms attack, no vibrato, 6s fade, heavy reverb
- **Piano** — Triangle/square/sawtooth through lowpass 2400 Hz, ultra-fast 5ms attack, 0.25 sustain, 2.5s fade

Preset switching kills active voices and reconfigures the shared reverb bus live.

### Progression Playback
- **Repeats-based advancement**: Slider (1–10) controls how many voicing pattern cycles play per chord before advancing to the next chord in the progression
- **Pattern-driven**: When a voicing pattern is active, chord advancement is tied to pattern cycle completion (chords always change on pattern boundaries)
- **Fallback timer**: When no pattern is active, chords advance using BPM-based timing (`repeats × beat duration`)
- **Context alignment**: Switching to progression mode auto-snaps from invalid categories (intervals/sus-add/power → triads); extended type selector visible in both modes

### MIDI Input (Visual Only)
- **Web MIDI API**: `useMIDI` hook manages MIDI access, input port listeners, and hot-plug detection
- **Pitch mapping**: MIDI notes 48-72 → pitch indices 0-24, notes outside range ignored
- **Visual feedback**: MIDI-pressed keys show cyan (#00E5FF) border glow, distinct from chord highlighting
- **Visual-only mode**: MIDI keys display on grid but do not trigger app audio (physical device provides its own sound)
- **Coexistence**: Chord highlighting and MIDI presses display simultaneously; app audio plays uninterrupted
- **Header indicator**: Green dot when connected (with device name), gray when disconnected

### Grid Transposition
- **Physical device match**: Changing the key selector transposes all 25 grid keys, matching the real EasyPlay1S pitch wheel behavior
- **Note-name remapping**: Physical key positions (pitch indices 0-24) stay fixed; only note labels and colors shift
- **Three systems updated**: Grid display, voicing segment finder, and audio engine all respect the root offset
- **Audio pitch correction**: `pitchToFrequency` adjusts MIDI base note by root offset (e.g., D = +2 semitones)

### Audio Engine
- **Preset-driven architecture**: `SynthPreset` interface defines oscillators, filter, ADSR, vibrato, reverb per preset
- **ADSR envelope** with exponential fade to near-silence
- **Feedback delay reverb** with live parameter updates on preset switch
- **Diff-based `setNotes()`** for smooth chord transitions
- **Controls:** Preset selector + volume slider + mute toggle in header bar

### Keyboard Navigation
- **useArrowNav hook** (`src/hooks/useArrowNav.ts`) — DOM-based, queries `[data-nav-group]` elements
- **Left/Right** moves within a button row, **Up/Down** jumps between groups
- **Enter** activates the focused button
- **Focus ring:** 2px solid `#5A8AFF` outline via `button:focus-visible`
- Sliders preserve native arrow-key behavior

### Architecture
- **Vite + React 19 + TypeScript + Tailwind CSS v4**
- **Engine layer** (`src/engine/`) — pure functions for theory, colors, grid math, voicings, progressions, audio
- **Component layer** (`src/components/`) — presentational components with props
- **Hooks** (`src/hooks/`) — useArrowNav for keyboard navigation
- **App.tsx** — top-level state management with ref-based timer for pattern-driven progression advancement

### Files
```
src/
├── App.tsx                        # Main layout, state, animation timer, pattern + progression + audio logic
├── types.ts                       # Shared TypeScript interfaces
├── engine/
│   ├── audio.ts                   # Web Audio API synthesizer (3 presets, vibrato, reverb)
│   ├── colors.ts                  # Interval Gravity color map + text contrast + getFifthsFromRoot
│   ├── grid.ts                    # Physical grid layout constants + transposition helpers
│   ├── progressions.ts            # 18 active + 3 deferred progression definitions
│   ├── theory.ts                  # Scale/chord computation — all 6 categories + numeral parser
│   ├── voicings.ts                # 8 voicing patterns + segment finder + findAllSegments
│   └── voicings.test.ts           # 20 unit tests (findAllSegments, block/stride generateMulti)
├── hooks/
│   ├── useArrowNav.ts             # Arrow-key navigation hook (DOM-based group traversal)
│   └── useMIDI.ts                # Web MIDI input hook (note events, hot-plug)
├── components/
│   ├── AudioControls.tsx          # Preset selector + volume slider + mute toggle
│   ├── EasyPlayGrid.tsx           # 6-row grid with zoom, degree/root indicators, tap/hold animations
│   ├── KeySelector.tsx            # Key picker + major/minor toggle (merged label)
│   ├── ChordSelector.tsx          # 6-category tabs, chord buttons, progression display + repeats slider
│   ├── VoicingPatterns.tsx        # Pattern buttons, BPM slider, shape counter
│   ├── CircleOfFifthsSpectrum.tsx # Fifths-ordered color spectrum with harmonic distance
│   ├── PianoKeyboard.tsx          # Standard 25-key piano with chip rows + pitch-based animation
│   └── Legend.tsx                 # Interval Gravity color reference
```

### Verified
- TypeScript type-checks clean
- Production build succeeds (`npm run build`)
- Vitest: 20 engine tests pass (`npm test`)
- Grid transposition: key change shifts all note labels and colors
- MIDI input: visual-only mode (no app audio from MIDI keys, device provides its own sound)

### Repository
- **GitHub**: `swaylenhayes/chord-explorer-easyplay` (public)
- **Fresh repo** created 2026-02-12 with single initial commit (clean history)
- Local directory remains `/Users/swaylen/dev/chord-explore`

### What's Next
- **Piano keyboard visual polish** — User has two items to add to roadmap for next session
- **Multi-segment for remaining patterns** — Ascending, descending, pedal-tap, broken, shell, rolling (requires gestalt animation design)
- **iPhone layout** — Landscape-oriented responsive layout for iPhone 13+ (see roadmap)
- **iPad layout** — Refine current two-column layout with touch navigation for iPad
- See `_docs/roadmap.md` for full deferred features list