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

## Deferred
- Custom progression builder
- Additional scale modes (Dorian, Mixolydian, etc.)
- Modal/borrowed chord category (enables deferred progressions)
- Printable sticker template
- Touch/swipe navigation for iPad
