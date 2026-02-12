# Degree and Root Enhancement — Mini Spec

## Summary

Add two small indicators to each key in the EasyPlay1S grid layout:

1. **Scale degree number** (1–7) in the **bottom-right corner** of every scale note
2. **Root indicator "R"** in the **bottom-left corner** when a chord is selected and the key is that chord's root

These are always-on overlays — no toggle, no mode switching. They coexist with the existing note name label.

---

## What Changes

### Scale Degree (bottom-right)

- For every note that is in the current scale, display its degree number (1 through 7) in the bottom-right corner of the key
- Non-scale notes (chromatic notes outside the key) show nothing in this position
- The degree number should be small and semi-transparent so it doesn't fight for attention

**Behavior:**
- Degree numbers are derived from the current key and mode selection
- When the key changes (e.g., C major → D major), degrees recalculate — the "1" moves to the new root note
- When dimmed (a chord is active and this note is not in the chord), hide the degree number

### Root Indicator (bottom-left)

- When a chord is selected and a key is the **root** of that chord, display "R" in the bottom-left corner
- Only one key per chord will show "R" (the first note in the chord's note array is the root)
- When no chord is selected, no "R" appears anywhere

**Behavior:**
- Only visible when a chord is active AND this note is that chord's root (index 0 in the chord's notes array)
- When dimmed, hide the "R"
- If using reverse lookup (tap-a-note-to-find-chords), show "R" on the root of each matching chord

---

## Visual Reference

```
┌──────────────┐
│              │
│      C       │  ← note name, centered
│              │
│ R          1 │  ← root (bottom-left), degree (bottom-right)
└──────────────┘
```

When no chord is selected:
```
┌──────────────┐
│              │
│      C       │
│              │
│            1 │  ← degree only, no R
└──────────────┘
```

Non-scale note (no degree, no root):
```
┌──────────────┐
│              │
│      F#      │
│              │
│              │  ← nothing
└──────────────┘
```

---

## Implementation Notes

**Computing the degree:**
```typescript
const scaleDegree = scale.indexOf(note);
// Returns 0-6 if in scale, -1 if not
// Display as scaleDegree + 1 (so 1-7)
```

**Computing the root:**
```typescript
const isChordRoot = activeChord !== null
  && chords[activeChord].notes[0] === note;
```
