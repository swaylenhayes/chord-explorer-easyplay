---
title: roadmap
type: note
permalink: chordexplore/docs/roadmap
---

# Roadmap

## Phase 1: Grid + Key + Triads — DONE
- [x] Port grid from reference.jsx
- [x] Theory engine (scales, triads, transposition)
- [x] Key selector (12 notes + Major/Minor)
- [x] Triad chord selector (7 diatonic triads)
- [x] Grid highlighting (active chord glow, others dim)
- [x] Legend bar

## Phase 2: Expanded Chords + Voicings + UI — DONE
- [x] Seventh chords
- [x] Extended chords (9, 11, 13) with essential voicings
- [x] Intervals mode (hybrid: default to key root, tap grid to change root)
- [x] Sus/Add chords (sus2, sus4, add9, add11, 6th, 6/9, 7sus4)
- [x] Power chords (5th, 5th + octave)
- [x] UI polish: NoteChip displays, Roman numeral notation, scale-aware highlighting
- [x] Degree & root indicators on grid keys
- [x] Responsive grid scaling (CSS zoom)
- [x] Voicing patterns engine (8 patterns: block, ascending, descending, pedal-tap, broken, shell, rolling, stride)
- [x] Voicing patterns UI with BPM control, play/stop
- [x] Pattern continuity across chord changes
- [x] Tap vs hold animation system (key-tap for pressed, key-quiver for held)
- [x] Circle of Fifths spectrum visualization (key-relative ordering, harmonic distance)
- [x] Interval Gravity legend (moved to left column)
- [x] Two-column layout: visual/reference (left) + interactive controls (right)
- [x] White outline system for grid-affecting controls
- [x] KeySelector redesign: merged key label with major/minor toggle
- [x] ChordSelector: equal-width category tabs, centered sub-type selectors
- [x] Section header consistency across all panels

## Phase 3: Progressions — DONE
- [x] Numeral parser (resolveNumeral) — handles diatonic, 7ths, maj7/maj9, borrowed flat, slash chords
- [x] Progression data library — 18 active (major + minor, triads/sevenths/extended)
- [x] Progression list UI (ProgressionPlayer component)
- [x] Animation loop (pattern-driven repeats slider, 1–10 cycles per chord)
- [x] Two-column chord chip display with Roman numeral labels
- [x] Voicing pattern animation integrated with progression playback (scoped to active chord)
- [x] Auto-stop progression on category change and mode toggle
- [x] Removed ChordTimeline overlay (simplified left column)
- [x] Polish pass: active chord highlight, resolved names, paused icon, speed label, dead code cleanup

### Progression filtering
Progressions are contextually filtered by mode (major/minor) + chord category (triads/sevenths/extended). Each progression has `mode` and `chordCategory` fields. The PROGRESSIONS section only appears when matching progressions exist for the current selection.

**Active (18):**
- Major triads (7): Rock/Folk, Pop/Modern Rock, Pop/EDM, 50's/Oldies, Singer Songwriter, R&B, Ballad/Folk
- Minor triads (4): Flamenco/Spanish, Standard Minor, Epic Minor, Minor/Indie/Alt
- Major sevenths (3): Jazz, Jazz/Standards, 12-Bar Blues
- Minor sevenths (1): Funk/R&B
- Major extended 9ths (1): Neo-Soul Smooth

**Deferred (3) — require borrowed chords:**
- Mixolydian Rock: I – bVII – IV
- Aeolian Cadence: bVI – bVII – I
- Cinematic Rock: I – bVI – bVII – I

## Audio Playback — DONE
- [x] Web Audio API synthesizer (saxophone tone: sawtooth/square, bandpass filter)
- [x] ADSR envelope with slow exponential fade (4s decay to near-silence)
- [x] Delayed vibrato (5 Hz LFO, 15-cent depth, 0.5s onset delay)
- [x] Feedback delay reverb (30ms pre-delay, 0.3 feedback, 3kHz LP)
- [x] Diff-based setNotes() for smooth chord transitions
- [x] Volume slider + mute toggle (AudioControls component)
- [x] Auto-play on chord selection, progression step, and voicing pattern step
- [x] Synth voice presets: Sax, Pad, Piano (preset selector in header bar)
- [x] Fix: pattern stop no longer causes sustained note hold

## Keyboard Navigation — DONE
- [x] useArrowNav hook (DOM-based, data-nav-group traversal)
- [x] Arrow keys navigate all right-column button groups
- [x] Enter activates focused button
- [x] Focus-visible ring (#5A8AFF outline)
- [x] Native slider behavior preserved

## Grid Transposition — DONE
- [x] Grid note labels transpose when key changes (matches physical EasyPlay1S pitch wheel)
- [x] Voicing segment finder uses transposed grid keys
- [x] Audio engine adjusts pitch-to-frequency by root offset

## Progression Context Alignment — DONE
- [x] Auto-snap category when entering progression mode from invalid categories (intervals/sus-add/power → triads)
- [x] Extended type filter uses actual selection instead of hardcoded 9ths
- [x] Extended sub-type selector (9/11/13) visible in progression mode

## MIDI Input — DONE
- [x] `useMIDI` hook: Web MIDI API access, input port listeners, hot-plug/unplug
- [x] MIDI note 48-72 → pitch index 0-24 conversion
- [x] Cyan glow visual for MIDI-pressed keys (distinct from chord highlight)
- [x] Visual-only mode (no app audio from MIDI — physical device provides its own sound)
- [x] Header status indicator (green dot + device name when connected)
- [x] App audio plays uninterrupted during MIDI input

## Multi-Segment Voicing Cycling — DONE
- [x] `findAllSegments()` engine function (Cartesian product, dedup, tiered playability classification)
- [x] Block pattern: cycle all combos with double-tap (ON-OFF-ON-OFF per shape)
- [x] Stride pattern: cycle all combos with double-tap (bass-upper-bass-upper per shape)
- [x] Shape counter UI ("Shape N / M" + stretch badge)
- [x] Dual-method architecture (`generateMulti?` on VoicingPattern)
- [x] Vitest framework + 20 unit tests (findAllSegments, block/stride generateMulti)

## Piano Keyboard View — DONE
- [x] Top-level tab switcher (EasyPlay | Piano) above keyboard area
- [x] Standard 25-key piano component (C3–C5, 15 white + 10 black keys)
- [x] Colored note chip rows above black keys and below white keys (NoteChip style)
- [x] Pitch-based chip animation (only specific octave instance animates, not all instances of a note)
- [x] Piano key press/held animation (piano-tap/piano-quiver CSS keyframes, gentler than EasyPlay)
- [x] No key dimming — full opacity always, motion carries feedback
- [x] Pitch space conversion: grid pitches mapped 1:1 to piano positions (rootOffset removed)
- [x] Shared controls: all chords, voicing patterns, progressions, audio work on both views

## Key-Relative Temperature Coloring — TOP PRIORITY

The fundamental color system shift: colors represent **circle-of-fifths distance from the current key root**, not fixed note names. The warm→cool rainbow spectrum stays fixed; notes rotate through it based on selected key.

### Concept
The 12 hex color values (Thunderbird red → Purple Heart purple) form a fixed temperature gradient. A note's color = its position on the circle of fifths relative to the root:
- **Position 0 (root)**: Red (warmest)
- **Position 1–5**: Orange → Yellow → Green (near/warm)
- **Position 6–10**: Teal → Blue → Dark Blue (far/cool)
- **Position 11 (farthest)**: Purple (coolest)

In C major, results are identical to today. In G major, G becomes red (root) and C becomes purple (farthest in-scale note). The color palette itself never changes — only which notes map to which positions.

### In-scale vs out-of-scale
Handled by a **separate visual channel** (opacity/fading), not by color temperature. Every note always has a temperature color; in-scale notes are full opacity, out-of-scale notes are faded.

### Minor key behavior
In major keys, 6 in-scale notes are consecutive on the warm side + 1 far note on the cool side. Minor keys split differently (warm/cool distribution TBD — needs investigation during spec phase).

### Surfaces affected
- EasyPlay grid key colors
- Piano keyboard chip colors (and future key color overlays)
- Circle of Fifths spectrum bar
- Legend / Interval Gravity bar
- NoteChips in chord selector
- Text color (dark/white) follows temperature position, not note name

### Key selector de-coloring
Remove note colors from key selector buttons. They should be neutral (dark theme, same style as major/minor toggle) since they represent a choice, not a temperature result.

### What stays the same
- The 12 hex color values themselves
- Grid layout, theory engine, chord logic
- `getFifthsFromRoot()` already does the rotation needed
- In C major, everything looks exactly as it does today

### Connection to future work
This system is the foundation for piano key color overlays and the 37-key keyboard — those features become more meaningful once colors reflect key-relative temperature.

### Voicing patterns: hide until chord selected
Voicing patterns panel should not appear until both a chord category AND a Roman numeral are selected. Patterns depend on having an active chord — showing them before selection is misleading.

## Piano Keyboard Fixes & Enhancements

### 1. Piano transposition — DONE
Piano transposes note labels and chip colors based on selected key (matching EasyPlay grid behavior). Raw grid pitches passed 1:1 to piano positions — no rootOffset clipping. MIDI pitches converted to transposed space with range filtering. 9 unit tests added. Spec: `_docs/specs/2026-03-12-piano-transposition-fix-design.md`.

### 2. Piano chip colors update with key change — DONE (included in fix above)

### 3. Piano key color overlay (new feature)
Add subtle color shading over the piano keys that matches their temperature color (key-relative, not fixed). Depends on Key-Relative Temperature Coloring being implemented first.
- **White keys**: Light semi-transparent color wash over the key face (still clearly recognizable as white keys)
- **Black keys**: Subtle colored outline or gentle overlay that preserves the black key appearance
- Color only appears for highlighted/active notes, or always visible as a learning aid (TBD)
- Helps connect the colored chips to the physical keys they represent

### 4. 37-key piano option (new feature — lowest priority)
Toggle between 25-key (C3–C5) and 37-key piano display. The wider range covers more voicing shapes without clipping. Exact range TBD (may start from root key minus a few semitones for bass context). Consider whether this interacts with transposition or is independent.

## Responsive Layouts
- [ ] **iPhone (landscape)** — Single-column horizontal layout optimized for iPhone in landscape orientation; grid scales to fit screen width, controls collapse below or into a slide-up sheet; touch-friendly tap targets (44pt minimum); tested on iPhone 13+ screen sizes
- [ ] **iPad** — Current two-column layout refined for iPad landscape; touch/swipe navigation for panel switching; larger tap targets; consider Split View / Slide Over compatibility

## Deferred
- **P2: Revisit color palette contrast in yellow/green zone** — the two greens (Sushi #94BD3B / Limeade #50B000) and two yellows (Saffron #F2C73D / Turbo #FFEA01) are too close together, need better perceptual separation
- Multi-segment cycling for remaining patterns (ascending, descending, pedal-tap, broken, shell, rolling) — requires gestalt animation design for directional patterns
- Custom progression builder
- Additional scale modes (Dorian, Mixolydian, etc.)
- Modal/borrowed chord category (enables deferred progressions)
- User-configurable playability threshold / hand-size preference
- Printable sticker template