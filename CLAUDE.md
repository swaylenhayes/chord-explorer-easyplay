---
title: CLAUDE
type: note
permalink: chordexplore/claude
---

# CLAUDE.md — Chord Explore

> Project-specific context for the Chord Explore web app.
> Complements the global `~/.claude/CLAUDE.md` — don't repeat what's there.

---

## Project Summary

A single-page React/TypeScript web app that visualizes chord shapes, harmonic functions, and chord progressions on the EasyPlay1S 25-key MIDI controller grid. Uses the "Interval Gravity" color system — each chromatic note has a permanent color based on circle-of-fifths distance from C.

**Primary use case**: Learning tool for Shane and family (including kids) to discover chords and progressions on the physical EasyPlay1S device.

**Target devices**: iPad (primary, used alongside the physical controller), desktop browser (secondary).

---

## Key Documents

| File | Purpose |
|------|---------|
| `_docs/spec.md` | Full product spec — features, layout, theory engine, progression library |
| `_docs/reference.jsx` | Working grid + color system code to port from (NOT a runtime dependency) |
| `_docs/current-state.md` | Session notes, what's done, what's next |
| `_docs/roadmap.md` | Phase priorities and deferred features |

**Start here**: Read `_docs/spec.md` before any implementation work. It contains the grid layout math, color constants, chord data, and phased build plan.

---

## Architecture Decisions

### Stack
- **React + TypeScript** — functional components, hooks
- **Tailwind CSS** — utility-first, dark theme
- **No backend** — all logic client-side, deployable as static site
- **No external music theory libraries** — custom theory engine (the mapping is specific to this device and color system)

### Module Structure
```
src/
├── App.tsx                    # Main layout, top-level state
├── components/
│   ├── EasyPlayGrid.tsx       # The 6-row physical grid (hero component)
│   ├── KeySelector.tsx        # Key + mode picker (C-B, Major/Minor)
│   ├── ChordSelector.tsx      # Chord category tabs + chord buttons
│   ├── ProgressionPlayer.tsx  # Progression list + animation loop
│   ├── ChordTimeline.tsx      # Current chord indicator during progression playback
│   └── Legend.tsx             # Bottom color reference bar
├── engine/
│   ├── theory.ts              # Scales, chords, transposition, numeral parsing
│   ├── colors.ts              # Interval Gravity color map (permanent, never changes)
│   ├── progressions.ts        # 20 progression definitions
│   └── grid.ts                # Grid layout constants, positioning math
└── types.ts                   # Shared interfaces
```

### Critical Invariants

1. **Colors are permanent.** The `NOTE_COLORS` map in `colors.ts` never changes based on key, mode, or chord selection. C is always `#CC1F16`, G is always `#E86902`, etc. Key changes transpose the theory, not the colors.

2. **Grid layout is physically accurate.** The 6-row grid must match the real EasyPlay1S exactly. Black keys center on gaps between white keys. Row 3's Ab hangs off the left edge. See `_docs/spec.md` → "Grid Layout" for exact positioning math.

3. **The theory engine is the source of truth.** All chord note resolution flows through `theory.ts`. Components never hardcode note sets — they call `resolveNumeral()` or `getDiatonicChords()` with the current key/mode.

---

## Agent Delegation

### Use these agents:

| Agent | When to use |
|-------|-------------|
| `ux-web-designer` | Layout decisions, responsive behavior, component specifications, information architecture. Use when designing new UI panels, deciding how chord selectors should be organized, or reviewing the overall page structure. |
| `web-frontend-developer` | Implementation of components, touch interactions, animations, accessibility, performance. Use when building the grid, chord highlighting transitions, progression animation loop, or mobile responsiveness. |

### Don't use these agents:
- `apple-ux-designer` — This is a web app, not native iOS
- `swift-platform-architect` — No Swift in this project
- `ml-audio-inference-specialist` — No audio/ML processing

### Consider creating:
- **`music-theory-engine`** agent — If the theory engine (`theory.ts`) grows complex enough to warrant a specialist. Hold off until Phase 2 (extended chords, borrowed chords, secondary dominants). If numeral parsing and chord voicing logic requires 3+ debugging cycles, propose this agent.

---

## Color System Reference

These are the physical sticker dot colors mapped to the circle of fifths. This table is the single source of truth — if it conflicts with anything else, this wins.

```
Note  Fifths  Sticker         Hex        Text Color
────  ──────  ──────────────  ─────────  ──────────
C     0       Thunderbird     #CC1F16    white
G     1       Clementine      #E86902    white
D     2       Fire Bush       #E99630    dark
A     3       Saffron         #F2C73D    dark
E     4       Turbo           #FFEA01    dark
B     5       Sushi           #94BD3B    dark
F#    6       Limeade         #50B000    white
C#    7       Persian Green   #01ACAB    white
Ab    8       Mariner         #2D76BA    white
Eb    9       Persian Blue    #1D3DA2    white
Bb    10      Dark Blue       #0407AF    white
F     11      Purple Heart    #6C2EAF    white
```

---

## Implementation Phases

### Phase 1: Grid + Key + Triads (start here)
1. Port grid component from `_docs/reference.jsx`
2. Build theory engine: `getScale()`, `getDiatonicChords()`, `transposeNote()`
3. Key selector (12 notes + Major/Minor toggle)
4. Triad chord selector (7 diatonic triads)
5. Grid highlighting (active chord keys glow, others dim)
6. Legend bar

### Phase 2: Expanded Chords
7. Seventh chords
8. Extended chords (9, 11, 13) with essential voicings
9. Intervals mode (hybrid: default to key root, tap grid to change root)
10. Sus/Add chords
11. Power chords

### Phase 3: Progressions
12. Progression data library (20 progressions)
13. Progression list UI
14. Animation loop (cycle through chords with configurable tempo)
15. Chord timeline indicator
16. Numeral parser for borrowed chords, secondary dominants, slash chords

**Do not skip ahead.** Each phase should be complete and working before starting the next.

---

## UI Theme

Dark theme throughout. Reference values:

```
Background:     #0C0C14
Panel bg:       #131320
Panel border:   1px solid #1E1E2E
Text primary:   #E8E8F0
Text secondary: #7A7A8E
Text muted:     #4A4A5E
Active state:   brighter bg (#1E1E30), border (#2E2E45)
```

---

## Testing Approach

- **Theory engine**: Unit test `theory.ts` functions — scale generation, chord building, transposition, numeral resolution. These are pure functions, easy to test, and the most critical code.
- **Grid rendering**: Visual verification — does it match the physical device?
- **Chord highlighting**: Spot-check known chords (C major = C E G, etc.)
- **Progression animation**: Manual testing — does the loop cycle correctly?

---

## Gotchas & Known Issues

- **Enharmonic spelling**: The chromatic scale uses sharps for some notes and flats for others (`C# D Eb E F F# G Ab A Bb B`). The theory engine must handle both spellings when transposing. A chord in Gb major will need `Gb` even though the color map uses `F#`. Normalize to the color map keys for display.
- **Row 3 Ab overhang**: The Ab key in Row 3 extends left of the grid boundary. Use `overflow: visible` on the grid container or add left padding to accommodate it.
- **Extended chord voicings**: On 25 keys, full 13th chords (7 notes) may not all fit in playable range. The UI must show which notes are dropped and why.
- **Progression numeral parsing**: Progressions include borrowed chords (`♭VII`), secondary dominants (`V/vi`), and slash chords (`V/vii`). The numeral parser needs to handle all of these — don't punt on it, it's core to Phase 3.