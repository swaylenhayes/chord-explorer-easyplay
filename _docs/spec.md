# Chord Explore  - Project Spec

## Overview

A single-page React web app that visualizes chord shapes, harmonic functions, and chord progressions on the EasyPlay1S 25-key MIDI controller grid. The app uses the "Interval Gravity" color system — each of the 12 chromatic notes has a permanent color based on its distance from C on the circle of fifths, creating a warm-to-cool rainbow spectrum.

The user selects a **key**, a **chord type**, and optionally a **chord progression**. The app highlights the corresponding keys on a visual replica of the physical EasyPlay1S grid layout.

---

## Design Principles

- **Physical accuracy**: The grid must match the real EasyPlay1S layout exactly (see Grid Layout section)
- **Interval Gravity colors are permanent**: Note colors never change regardless of key. C is always Thunderbird red, G is always Clementine orange, etc.
- **Key changes transpose the theory, not the colors**: When the user switches from C major to D major, the chord formulas transpose to new notes, which already have their own fixed colors
- **Minimal UI, maximum information**: The grid is the hero. Controls are compact. Legend is ambient/reference
- **Mobile-friendly**: Should work on iPad (primary use case alongside the physical device)

---

## Grid Layout (CRITICAL — must be exact)

The EasyPlay1S has 25 keys arranged in a 6-row grid: 3 pairs of rows, each pair being a black-key row above a white-key row, 5 keys across. Black keys are positioned centered in the gap between the white keys they sit above.

```
Row 1 (black):  C#    Eb    ___   F#    ___      ← above Row 2
Row 2 (white):  C     D     E     F     G        ← octave 1

Row 3 (black):  Ab    Bb    ___   C#    Eb       ← above Row 4
Row 4 (white):  A     B     C     D     E        ← octave 1→2

Row 5 (black):  F#    ___   Ab    Bb    ___      ← above Row 6
Row 6 (white):  F     G     A     B     C        ← octave 2
```

### Black key positioning rules

Black keys are horizontally centered on the **gap** between the two white keys they sit between:
- C# centers between C and D
- Eb centers between D and E
- F# centers between F and G
- Ab centers between G and A (or hangs left of A when A is the leftmost white key — Row 3)
- Bb centers between A and B

**Row 3 special case**: Ab hangs partially off the left edge (its center aligns with the left edge of the A key below it, so roughly half the key extends left of the grid).

### Key dimensions (reference)

- White keys: ~64×64px at default scale
- Black keys: ~52×48px, slightly smaller
- Gap between white keys: ~5px
- Black keys use absolute positioning relative to the white key row below them

### Implementation reference

The existing `color_systems_grid.jsx` file has working grid positioning code using `gapCenter()` and `leftHang` helper functions. Reuse this math directly.

---

## Color System: Interval Gravity

Each of the 12 chromatic notes has a **permanent** color. Colors are assigned by distance from C on the circle of fifths, creating a rainbow spectrum from warm (red) to cool (purple).

```
Note  Fifths  Sticker Name     Hex
────  ──────  ──────────────   ───────
C     0       Thunderbird      #CC1F16
G     1       Clementine       #E86902
D     2       Fire Bush        #E99630
A     3       Saffron          #F2C73D
E     4       Turbo            #FFEA01
B     5       Sushi            #94BD3B
F#    6       Limeade          #50B000
C#    7       Persian Green    #01ACAB
Ab    8       Mariner          #2D76BA
Eb    9       Persian Blue     #1D3DA2
Bb    10      Dark Blue        #0407AF
F     11      Purple Heart     #6C2EAF
```

### Text contrast rules

Notes with light backgrounds (E/Turbo, A/Saffron, B/Sushi, D/Fire Bush) should use dark text (#2A2A2A). All others use white text with a subtle text shadow.

### Key states

1. **Default**: Full color, normal size
2. **Highlighted (in active chord)**: Scale up ~10%, white border, glow shadow matching the key color
3. **Dimmed (chord active but this key not in it)**: Opacity ~0.2
4. **No chord active**: All keys at full color, normal size

---

## App Layout

```
┌─────────────────────────────────────────────────┐
│  Chord Explore              [title] │
├────────────────────────┬────────────────────────┤
│                        │  ┌──────────────────┐  │
│                        │  │ KEY SELECTOR     │  │
│   PHYSICAL GRID        │  │ C C# D Eb E F    │  │
│   (6-row layout)       │  │ F# G Ab A Bb B   │  │
│                        │  │ [Major] [Minor]   │  │
│                        │  └──────────────────┘  │
│                        │  ┌──────────────────┐  │
│                        │  │ CHORD SELECTOR   │  │
│                        │  │ [Triads] [7ths]  │  │
│                        │  │ [Extended] ...    │  │
│                        │  │                  │  │
│                        │  │ I  ii  iii  IV   │  │
│                        │  │ V  vi  vii°      │  │
│                        │  └──────────────────┘  │
│                        │  ┌──────────────────┐  │
│                        │  │ PROGRESSIONS     │  │
│                        │  │ Rock Classic      │  │
│                        │  │ Pop Anthem        │  │
│                        │  │ Jazz ii-V-I       │  │
│                        │  │ ...               │  │
│                        │  └──────────────────┘  │
├─────────────────────────────────────────────────┤
│  LEGEND: color swatches + note names (horizontal)│
└─────────────────────────────────────────────────┘
```

- **Left column**: The grid visualization (hero element, largest visual)
- **Right column**: Stacked control panels (Key → Chords → Progressions)
- **Bottom bar**: Legend spanning full width
- **Mobile/tablet**: Right column stacks below the grid

---

## Feature 1: Key Selector

### Behavior

- 12 buttons for root note (C, C#, D, Eb, E, F, F#, G, Ab, A, Bb, B)
- Toggle between Major and Minor (Natural Minor / Aeolian)
- Default: C Major
- Changing the key recalculates all chord note assignments throughout the app
- The grid colors DO NOT change — only which notes get highlighted when chords are selected

### Music theory engine

For any key + scale, compute:
- The 7 scale degrees
- The diatonic triads (I through vii° for major; i through VII for minor)
- The diatonic seventh chords
- Extended chord voicings (see Chord Categories)

**Major scale intervals (semitones from root):** 0, 2, 4, 5, 7, 9, 11

**Natural minor scale intervals:** 0, 2, 3, 5, 7, 8, 10

**Chord quality by scale degree (Major key):**
| Degree | Triad | 7th |
|--------|-------|-----|
| I | Major | maj7 |
| ii | Minor | min7 |
| iii | Minor | min7 |
| IV | Major | maj7 |
| V | Major | dom7 |
| vi | Minor | min7 |
| vii° | Diminished | min7♭5 (half-dim) |

**Chord quality by scale degree (Natural Minor):**
| Degree | Triad | 7th |
|--------|-------|-----|
| i | Minor | min7 |
| ii° | Diminished | min7♭5 |
| III | Major | maj7 |
| iv | Minor | min7 |
| v | Minor | min7 |
| VI | Major | maj7 |
| VII | Major | dom7 |

---

## Feature 2: Chord Selector

### Chord categories (tabs or segmented control)

Select **6 chord categories** drawn from Logic Pro's Chord Trigger hierarchy, covering the most useful range without overwhelming:

#### 1. Triads
The 7 diatonic triads for the current key. Each button shows the Roman numeral AND the chord name (e.g., "I · C" or "ii · Dm").

Chord types available:
- Major (1, 3, 5)
- Minor (1, ♭3, 5)
- Diminished (1, ♭3, ♭5)
- Augmented (1, 3, #5)
- Sus2 (1, 2, 5)
- Sus4 (1, 4, 5)

Default view: Show the 7 diatonic triads as buttons. Optionally allow switching any triad to aug/sus2/sus4 variants.

#### 2. Seventh Chords
The 7 diatonic seventh chords for the current key.

Chord types:
- Major 7th (1, 3, 5, 7)
- Minor 7th (1, ♭3, 5, ♭7)
- Dominant 7th (1, 3, 5, ♭7)
- Half-diminished / min7♭5 (1, ♭3, ♭5, ♭7)
- Fully diminished 7th (1, ♭3, ♭5, ♭♭7)
- Minor-major 7th (1, ♭3, 5, 7)
- Augmented major 7th (1, 3, #5, 7)

#### 3. Extended Chords
9ths, 11ths, 13ths built on each scale degree:

- 9th chords: add 9 (2nd up an octave) to 7th chord
- 11th chords: add 9 + 11 (4th up an octave)
- 13th chords: add 9 + 11 + 13 (6th up an octave)
- Common variants: maj9, min9, dom9, maj11, min11, maj13, min13

Note: On the 2-octave / 25-key grid, extended chords may require essential voicings that drop the 5th and sometimes the root. **The UI must indicate when notes are dropped** — e.g., show the full chord spelling with dropped notes in parentheses or struck through: "Cmaj13: C E (G) B D (F) A" where parenthesized notes are omitted from the grid highlight. A small label like "voiced for 25 keys — 5th omitted" should appear when a voicing is simplified.

#### 4. Intervals
Two-note combinations for ear training and melody building.

Available intervals:
- Minor 2nd (1 semitone)
- Major 2nd (2 semitones)
- Minor 3rd (3 semitones)
- Major 3rd (4 semitones)
- Perfect 4th (5 semitones)
- Tritone (6 semitones)
- Perfect 5th (7 semitones)
- Minor 6th (8 semitones)
- Major 6th (9 semitones)
- Minor 7th (10 semitones)
- Major 7th (11 semitones)
- Octave (12 semitones)

**Interaction model (hybrid approach):**
- When the user enters Intervals mode, the **current key root is pre-selected** as the starting note. So if you're in D major, D is already the active root. Tapping "Perfect 5th" immediately highlights D + A.
- To explore from a different starting note, the user can **tap any key on the grid** to move the root. Tapping the E key, then "Minor 3rd" highlights E + G.
- The currently selected root note should have a visible indicator (e.g., a ring or pulsing border) so the user always knows which note is the anchor.
- This gives single-tap simplicity for the common case (intervals from the key center) while allowing freeform exploration from any note.

#### 5. Sus & Add Chords
Common embellishment chords:

- Sus2 (1, 2, 5)
- Sus4 (1, 4, 5)
- Add9 (1, 3, 5, 9)
- Add11 (1, 3, 5, 11)
- 6th (1, 3, 5, 6)
- 6/9 (1, 3, 5, 6, 9)
- 7sus4 (1, 4, 5, ♭7)

#### 6. Power & Slash Chords
Simplified voicings:

- Power chord / 5th (1, 5)
- Power + octave (1, 5, 8)
- Common slash chords (e.g., C/E = C chord with E in bass)

### Behavior

- Clicking a chord button highlights the corresponding notes on the grid
- Clicking again (or clicking a different chord) deselects
- When a chord is active, non-chord-tone keys dim to ~20% opacity
- The chord name, notes, and intervals should display somewhere near the grid or in the chord panel
- Chord buttons show: Roman numeral + chord name (e.g., "V7 · G7")

---

## Feature 3: Chord Progressions

### Progression library (20 progressions)

```
#   Name                  Numerals                    Genre
──  ────────────────────  ────────────────────────    ──────────────────
1   Rock Classic          I – IV – V – I              Rock / Folk
2   Pop Anthem            I – V – vi – IV             Pop / Modern Rock
3   Axis Progression      vi – IV – I – V             Pop / EDM
4   50s Doo-Wop           I – vi – IV – V             50s Rock / Oldies
5   Sensitive Female      I – IV – vi – V             Singer-Songwriter
6   12-Bar Blues          I7 – IV7 – V7               Blues / Early Rock
7   Jazz ii-V-I           ii7 – V7 – Imaj7            Jazz
8   Jazz Turnaround       Imaj7 – vi7 – ii7 – V7      Jazz / Standards
9   Andalusian Cadence    i – VII – VI – V            Flamenco / Spanish
10  Standard Minor        i – iv – V                  Minor Ballad
11  Epic Minor            i – VI – VII                Cinematic
12  Minor Melancholy      i – v – VI – VII            Indie / Alternative
13  Mixolydian Rock       I – ♭VII – IV               Classic Rock
14  Dorian Funk           i – IV                      Funk / R&B
15  Phrygian Metal        i – ♭II – i                 Metal / Flamenco
16  Aeolian Cadence       ♭VI – ♭VII – I              Cinematic / Games
17  Cinematic Rock        I – ♭VI – ♭VII – I          Modern Cinematic
18  Royal (R&B)           IV – V – iii – vi           R&B / J-Pop
19  Neo-Soul Smooth       Imaj9 – IVmaj9              Neo-Soul / Chill-hop
20  Descending Ballad     I – V/vii – vi              Ballad / Folk
```

### Behavior

- Progression list is scrollable, each item shows name + numerals + genre tag
- **Clicking a progression starts an animation loop**:
  1. Highlight the notes of chord 1 on the grid (all other keys dim)
  2. Hold for a consistent duration (e.g., 1.5 seconds — user-configurable via a tempo/speed control)
  3. Transition to chord 2 (brief fade/crossfade, ~200ms)
  4. Continue through all chords in the progression
  5. Loop back to chord 1 and repeat
- **Clicking the same progression again stops the animation** and returns grid to default (all keys full color)
- While a progression is playing, show a visual indicator:
  - The current chord numeral + name displayed prominently near the grid
  - The progression "timeline" shows which chord is active (e.g., a row of chord labels with the active one highlighted)
- **Tempo control**: A slider or +/- buttons to adjust the hold duration per chord (range: 0.5s to 4s, default 1.5s)

### Progression theory engine

Each progression is stored as an array of Roman numeral strings. The engine must:

1. Parse the numeral (e.g., "ii7", "♭VII", "V/vii", "Imaj9")
2. Resolve it in the current key to specific notes
3. Handle:
   - Diatonic chords (I, ii, iii, IV, V, vi, vii°)
   - Seventh chords (add 7th based on chord quality)
   - Extended chords (9, 11, 13 — use essential voicings)
   - Borrowed chords (♭VII, ♭VI, ♭III — from parallel minor)
   - Secondary dominants (V/vi, V/ii, etc.)
   - Slash chords (V/vii = V chord with 7th scale degree in bass)
   - Modal interchange (♭II from Phrygian, IV in minor context as major = Dorian)

---

## Music Theory Engine (Core Module)

This is the transposition and chord-building engine that powers everything. It should be a separate module (`theory.js` or `theory.ts`).

### Core data

```javascript
const CHROMATIC = ["C","C#","D","Eb","E","F","F#","G","Ab","A","Bb","B"];

// Interval Gravity colors — NEVER change
const NOTE_COLORS = {
  "C":  "#CC1F16",  // Thunderbird
  "G":  "#E86902",  // Clementine
  "D":  "#E99630",  // Fire Bush
  "A":  "#F2C73D",  // Saffron
  "E":  "#FFEA01",  // Turbo
  "B":  "#94BD3B",  // Sushi
  "F#": "#50B000",  // Limeade
  "C#": "#01ACAB",  // Persian Green
  "Ab": "#2D76BA",  // Mariner
  "Eb": "#1D3DA2",  // Persian Blue
  "Bb": "#0407AF",  // Dark Blue
  "F":  "#6C2EAF",  // Purple Heart
};

const STICKER_NAMES = {
  "C": "Thunderbird", "G": "Clementine", "D": "Fire Bush", "A": "Saffron",
  "E": "Turbo", "B": "Sushi", "F#": "Limeade", "C#": "Persian Green",
  "Ab": "Mariner", "Eb": "Persian Blue", "Bb": "Dark Blue", "F": "Purple Heart",
};
```

### Key functions needed

```
getScale(root, mode) → string[]
  // Returns 7 note names for the scale
  // e.g., getScale("D", "major") → ["D","E","F#","G","A","B","C#"]

getDiatonicChords(root, mode, chordType) → Chord[]
  // Returns 7 chords, each with: { degree, numeral, name, quality, notes }
  // chordType: "triad" | "seventh" | "ninth" | "eleventh" | "thirteenth"

buildChord(root, quality, extensions?) → string[]
  // Builds a chord from a root note and quality
  // e.g., buildChord("G", "dom7") → ["G","B","D","F"]

resolveNumeral(numeral, key, mode) → { name, notes, quality }
  // Parses a Roman numeral string and returns concrete notes
  // Handles: "ii7", "♭VII", "V/vi", "Imaj9", "♭II", etc.

transposeNote(note, semitones) → string
  // Transpose a note by N semitones
  // e.g., transposeNote("C", 7) → "G"

getNoteColor(note) → string
  // Returns the hex color for any note (from NOTE_COLORS)

getTextColor(note) → string
  // Returns "#2A2A2A" for light notes (E, A, B, D), "#FFF" for others
```

---

## Grid Component (Reusable)

### From existing code

The grid positioning math from `color_systems_grid.jsx` should be extracted into a reusable `<EasyPlayGrid>` component.

### Props

```typescript
interface EasyPlayGridProps {
  highlightedNotes: string[];    // Notes to highlight (e.g., ["C","E","G"])
  activeChordName?: string;      // Display name (e.g., "C major")
  onKeyClick?: (note: string) => void;  // Optional: click a key to set root
}
```

### Grid data (from existing code)

```javascript
const KEY_W = 64, KEY_H = 64, BLACK_W = 52, BLACK_H = 48, GAP = 5;
const COL_PITCH = KEY_W + GAP;
const gapCenter = (i) => i * COL_PITCH + KEY_W + (GAP - BLACK_W) / 2;
const leftHang = -BLACK_W / 2 + 4;

const BLACK_ROW_1 = [
  { note: "C#", left: gapCenter(0) },
  { note: "Eb", left: gapCenter(1) },
  { note: "F#", left: gapCenter(3) },
];
const BLACK_ROW_3 = [
  { note: "Ab", left: leftHang },
  { note: "Bb", left: gapCenter(0) },
  { note: "C#", left: gapCenter(2) },
  { note: "Eb", left: gapCenter(3) },
];
const BLACK_ROW_5 = [
  { note: "F#", left: gapCenter(0) },
  { note: "Ab", left: gapCenter(1) },
  { note: "Bb", left: gapCenter(2) },
];
const WHITE_ROW_2 = ["C","D","E","F","G"];
const WHITE_ROW_4 = ["A","B","C","D","E"];
const WHITE_ROW_6 = ["F","G","A","B","C"];
```

---

## Progression Animator

### State machine

```
IDLE → (user clicks progression) → PLAYING → (user clicks again) → IDLE
```

### Playing state

```javascript
{
  progression: Progression,        // The selected progression object
  currentChordIndex: number,       // Which chord in the sequence (0-based)
  tempoMs: number,                 // Duration per chord in ms (default 1500)
  isPlaying: boolean,
}
```

### Animation loop

```
useEffect(() => {
  if (!isPlaying) return;
  const timer = setInterval(() => {
    setCurrentChordIndex(i => (i + 1) % progression.chords.length);
  }, tempoMs);
  return () => clearInterval(timer);
}, [isPlaying, tempoMs, progression]);
```

### Transition

When `currentChordIndex` changes, the grid smoothly transitions:
- Outgoing chord keys: fade opacity from 1 → 0.2 (200ms ease-out)
- Incoming chord keys: fade opacity from 0.2 → 1 + scale up (200ms ease-in)
- CSS transitions handle this naturally if `highlightedNotes` updates and keys have `transition: all 0.2s ease`

---

## Tech Stack

- **React** (single-page app, functional components + hooks)
- **TypeScript** (recommended for the theory engine — lots of string manipulation where types help)
- **Tailwind CSS** for styling
- **No backend** — all logic is client-side
- **Deployable as static site** (Vercel, Netlify, or just open index.html)

### File structure

```
src/
├── App.tsx                    # Main layout, state management
├── components/
│   ├── EasyPlayGrid.tsx       # The 6-row grid visualization
│   ├── KeySelector.tsx        # Key + mode picker
│   ├── ChordSelector.tsx      # Chord category tabs + chord buttons
│   ├── ProgressionPlayer.tsx  # Progression list + animation controls
│   ├── Legend.tsx              # Bottom color reference bar
│   └── ChordTimeline.tsx      # Visual indicator of current chord in progression
├── engine/
│   ├── theory.ts              # Music theory engine (scales, chords, transposition)
│   ├── colors.ts              # Note color mappings (Interval Gravity)
│   ├── progressions.ts        # Progression library data
│   └── grid.ts                # Grid layout constants and positioning math
└── types.ts                   # Shared TypeScript interfaces
```

---

## Existing Code to Reuse

From `color_systems_grid.jsx` (the current artifact), directly port:

1. **Grid positioning**: `gapCenter()`, `leftHang`, `BLACK_ROW_*`, `WHITE_ROW_*` constants
2. **Color constants**: `GRAVITY_COLORS` and `GRAVITY_STICKER_NAMES` objects
3. **Key rendering logic**: The `renderKey()` function's Interval Gravity branch (the `activeSystem === "gravity"` block), including highlight/dim states, glow effects, and text contrast
4. **Chord data**: `DIATONIC_CHORDS` and `SEVENTH_CHORDS` as starting templates (but make them dynamic based on key selection)

**Strip out**: All other color systems (triad membership, binary, proximity, note+function), the system selector tabs, and multi-system comparison UI. The new app is Interval Gravity only.

---

## UI/UX Details

### Dark theme

- Background: #0C0C14
- Panel backgrounds: #131320
- Panel borders: 1px solid #1E1E2E
- Text primary: #E8E8F0
- Text secondary: #7A7A8E
- Text muted: #4A4A5E

### Key selector appearance

- 12 note buttons in a row (or 2 rows of 6)
- Each button shows the note name AND is tinted with its Interval Gravity color
- Active key has a highlight ring / selected state
- Mode toggle: two buttons, "Major" and "Minor"
- Current key displayed prominently: e.g., "D Major" in large text

### Chord selector appearance

- Tab bar: Triads | 7ths | Extended | Intervals | Sus/Add | Power
- Below tabs: 7 chord buttons (for diatonic) or variable count (for intervals)
- Each button: Roman numeral + chord name, e.g., "ii · Dm"
- Active chord: highlighted border, slightly larger
- Below buttons: show the notes of the selected chord as colored dots

### Progression player appearance

- Scrollable list of 20 progressions
- Each row: name, numeral sequence, genre tag (small, muted)
- Active progression: highlighted background, play/pause icon
- Tempo slider: appears when a progression is active
- Chord timeline: horizontal row of chord labels above or below the grid, with the current chord highlighted and a subtle "playhead" indicator

### Legend appearance

- Horizontal strip at the bottom
- 12 colored circles with note names beneath
- Small text showing sticker name
- Subtle, doesn't compete with the grid

---

## Future Enhancements (Out of Scope for MVP)

- Audio playback (play the actual chord sounds via Web Audio API or Tone.js)
- Custom progression builder (drag-and-drop chord sequence)
- Multiple scale modes beyond major/minor (Dorian, Mixolydian, Lydian, etc.)
- MIDI input (connect the real EasyPlay1S and show what's being played)
- Printable sticker template generator
- Multi-key voicings from Logic Pro's keyboard voicing library (jazz ballad, blues, pop, etc.)
- Save/load user presets

---

## Implementation Priority

### Phase 1: Grid + Key + Triads
1. Port the grid component from existing code
2. Build the theory engine (scales, triads, transposition)
3. Key selector (12 notes + Major/Minor)
4. Triad chord selector (7 diatonic triads, highlight on grid)
5. Legend bar

### Phase 2: Expanded Chords
6. Seventh chords
7. Extended chords (9, 11, 13)
8. Intervals
9. Sus/Add chords
10. Power chords

### Phase 3: Progressions
11. Progression data library
12. Progression list UI
13. Animation loop + chord timeline
14. Tempo control
15. Numeral parser for borrowed chords, secondary dominants, slash chords

---

## Quick Start for Claude Code

To begin implementation, run:

```bash
npx create-react-app chord-explore --template typescript
cd chord-explore
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Then start with Phase 1: copy the grid constants and color mappings from the existing JSX, build the theory engine, and wire up the key selector + triad highlighting.
