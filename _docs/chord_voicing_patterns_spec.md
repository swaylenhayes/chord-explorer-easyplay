# Chord Voicing Patterns Enhancement — Spec

## Summary

Add animated voicing patterns that show how to physically play a chord on the EasyPlay1S grid. Eight patterns demonstrate different fingering approaches — from simple block chords to stride patterns. A segment finder algorithm determines which physical keys to animate based on the chord's notes and the grid layout.

This enhancement works with any chord type: triads, sevenths, extended chords (9ths, 11ths, 13ths), intervals, sus/add chords, and power chords. The patterns and segment finder are chord-size agnostic — they operate on an ordered array of note names and adapt their behavior to however many notes the chord contains.

---

## Voicing Patterns

Each pattern defines a sequence of **steps**. Each step has two properties:

- **pressed**: keys being tapped this step (animate a press-down visual)
- **held**: keys sustained from a previous step (stay pressed, no new animation)

All chord member keys remain highlighted throughout the animation. The press-down visual is a slight shrink (like a physical key being pushed) with an inset shadow, followed by a spring-back when released. Held keys stay in their pressed state without re-animating.

### 1. Block

All chord notes press and release together.

| Step | Pressed | Held |
|------|---------|------|
| 1 | All notes | — |
| 2 | — (release) | — |

Loops from step 1.

### 2. Ascending

Notes tap one at a time from lowest pitch to highest.

For a chord with N notes, produces N steps. Each step presses one note alone.

Example (4-note seventh chord C E G B):

| Step | Pressed | Held |
|------|---------|------|
| 1 | C | — |
| 2 | E | — |
| 3 | G | — |
| 4 | B | — |

Loops from step 1. Uses **forward** segment finding.

### 3. Descending

Notes tap one at a time from highest pitch to lowest.

Same as ascending but reversed. Uses **backward** segment finding to avoid page-breaking.

Example (C E G B):

| Step | Pressed | Held |
|------|---------|------|
| 1 | B | — |
| 2 | G | — |
| 3 | E | — |
| 4 | C | — |

### 4. Pedal Tap

Root presses first and stays held. Remaining notes tap one at a time over the sustained root.

| Step | Pressed | Held |
|------|---------|------|
| 1 (intro) | Root | — |
| 2 | 2nd note | Root |
| 3 | 3rd note | Root |
| ... | Nth note | Root |

After the intro, loops from step 2 onward (root never releases). The `loopFrom` property controls this — set to 1 so the intro only plays once per activation.

For a two-note chord (interval or power chord), this becomes root held + single upper note tapping, which still works but is visually simple.

### 5. Broken Chord

The classic Alberti bass bounce. For chords with 3+ notes, plays: 1st, 2nd, last, 2nd (bouncing off the middle).

| Step | Pressed | Held |
|------|---------|------|
| 1 | 1st note | — |
| 2 | 2nd note | — |
| 3 | Last note | — |
| 4 | 2nd note | — |

For chords with only 2 notes, alternates between them. For chords with 4+ notes, the pattern still uses the 1st, 2nd, and last notes — the middle voices are skipped in this pattern, which is standard Alberti behavior.

### 6. Shell Voicing

Root presses alone, then pairs with each other chord tone in sequence. A release step between cycles makes the root visibly lift and re-press.

For a triad (3 notes):

| Step | Pressed | Held |
|------|---------|------|
| 1 (intro) | Root | — |
| 2 | 2nd note | Root |
| 3 | 3rd note | Root |
| 4 | — (release) | — |

For a seventh chord (4 notes):

| Step | Pressed | Held |
|------|---------|------|
| 1 (intro) | Root | — |
| 2 | 3rd | Root |
| 3 | 5th | Root |
| 4 | 7th | Root |
| 5 | — (release) | — |

Loops from step 1 (full sequence replays, root lifts between cycles). This distinguishes it from pedal tap, where the root never lifts.

### 7. Rolling

Notes accumulate and hold, like a guitar strum. Each step presses one new note while all previously pressed notes stay held. Ends with all notes ringing, then releases.

For a chord with N notes:

| Step | Pressed | Held |
|------|---------|------|
| 1 | 1st note | — |
| 2 | 2nd note | 1st |
| 3 | 3rd note | 1st, 2nd |
| ... | Nth note | all previous |
| N+1 | — | all notes (sustain) |
| N+2 | — (release) | — |

### 8. Stride

Root alone, then all remaining notes together. A two-beat bass-chord alternation.

| Step | Pressed | Held |
|------|---------|------|
| 1 | Root | — |
| 2 | All non-root notes | — |

For a seventh chord: step 1 = root alone, step 2 = 3rd + 5th + 7th together. For extended chords with many notes, step 2 presses all upper voices simultaneously.

---

## Segment Finder

The segment finder determines which physical keys on the grid to use for a given chord. It maps abstract note names (e.g., "C", "E", "G") to specific key positions on the grid.

### Core Concept

The grid contains multiple instances of most notes across its rows. The segment finder picks **one set of keys** (one segment) that can be played without "page-breaking" — without the animation wrapping from the bottom of the grid back to the top, or vice versa.

### Algorithm

**Input:** An ordered array of note names (root first) and a direction ("forward" or "backward").

**Forward mode** (used by most patterns):

1. Find every instance of the **root note** on the grid, sorted by pitch (top to bottom)
2. For each root candidate, attempt to find the nearest instance of each remaining chord tone **at or above the root's pitch** (forward/downward on the grid)
3. The first root where all chord tones are found without wrapping = the chosen segment
4. Root stays at index 0 in the returned segment; remaining notes are sorted by pitch

**Backward mode** (used by descending):

1. Find every instance of the **last chord tone** on the grid, sorted by pitch (bottom to top)
2. For each candidate, attempt to find every other chord tone **at or below its pitch** (backward/upward on the grid)
3. The first candidate where all tones are found = the chosen segment
4. Root stays at index 0; remaining notes sorted by pitch

**Fallback:** If neither mode finds a clean segment, pick the first root instance and find the nearest instance of each chord tone regardless of direction.

### Output

An array containing 0 or 1 segments. Each segment is an ordered array of key objects, where each key object contains at minimum:

- `id` — unique identifier for the physical key position on the grid
- `note` — the note name (e.g., "C", "Ab")
- `pitch` — a numeric value for sorting by register

The segment always has the root at index 0, with remaining notes sorted by ascending pitch.

### Chord Size Considerations

The segment finder works identically regardless of chord size. A two-note interval, a three-note triad, a four-note seventh, or a five-note extended voicing all follow the same algorithm. The only difference is the number of chord tones to locate on the grid.

For extended chords that have been reduced for the 25-key constraint (e.g., a 13th chord with the 5th and 11th omitted), the segment finder only sees the notes that are actually being played — it operates on the final voicing, not the theoretical chord.

---

## Animation Engine

### State

- `activePattern` — which pattern is selected (null when none)
- `patternStep` — current step index (integer)
- `patternBPM` — tempo in beats per minute (default 100, range 40–240)
- `isPatternPlaying` — whether animation is running

Derived:
- `patternSpeed` — milliseconds per step, computed as `60000 / patternBPM`
- `patternSteps` — the array of steps generated by the active pattern
- `currentStep` — the step object at the current index

### Loop Behavior

An interval timer advances `patternStep` at the rate defined by `patternSpeed`. When the step reaches the end of the steps array, it loops back to the index defined by the pattern's `loopFrom` property:

- `loopFrom: 0` (default) — replays the full sequence including any intro
- `loopFrom: 1` — skips the intro step on repeat (used by pedal tap)

### Pattern Selection

Each pattern button is a toggle. Tapping a pattern starts its animation; tapping it again stops it. Tapping a different pattern while one is running switches to the new pattern and resets the step counter. No separate stop button.

### Integration with Chord Selection

- Voicing patterns panel is only visible when a chord is active
- Changing the selected chord stops any running animation and resets the pattern
- Changing the key or mode stops any running animation
- Reverse chord lookup (tap-a-note) also stops any running animation

---

## Visual Behavior on the Grid

During animation, the grid keys behave as follows:

| Key State | Appearance |
|-----------|------------|
| Chord member, not pressed or held | Full opacity, highlight border, normal size |
| Chord member, pressed this step | Full opacity, bright border, slightly smaller (press-down), inset shadow |
| Chord member, held from previous step | Full opacity, bright border, slightly smaller (stays pressed), subtle inset shadow |
| Non-chord note | Dimmed (low opacity), no border highlight |
| Non-scale note | Dimmed further, minimal border |

The press-down animation should use a fast transition (around 150ms with an ease-out curve) so the press feels snappy and the spring-back is visible.

---

## Step Indicator

Below the pattern buttons, a row of step badges shows the full sequence. Each badge contains colored note swatches for the notes involved in that step:

- **Pressed notes** show their note letter at full opacity
- **Held notes** show a dot (•) at reduced opacity
- The current step badge is highlighted and slightly scaled up
- Empty steps (release beats) show as an empty badge

---

## BPM Control

A slider below the step indicator controls tempo:

- Range: 40 BPM to 240 BPM
- Default: 100 BPM
- Label displays the current BPM value
- Conversion: `ms per step = 60000 / BPM`

The slider adjusts in real time — changing BPM while an animation is running immediately affects the tempo.
