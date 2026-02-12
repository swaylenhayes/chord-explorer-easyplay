# Circle of Fifths Spectrum Enhancement — Mini Spec

## Summary

A visual reference panel that displays all 12 chromatic notes ordered by their circle-of-fifths distance from the currently selected key. Notes nearest to the tonic appear on the left ("near"), notes furthest away appear on the right ("far"). Scale membership is indicated by border brightness and opacity.

This panel sits below the physical grid and updates automatically when the key or mode changes.

---

## What It Shows

A horizontal row of 12 note chips, ordered by fifths distance from the selected root:

- **Position 0** (leftmost): the selected root note itself
- **Positions 1–5**: ascending fifths from the root (these plus the root form the near/scale zone)
- **Position 6**: the tritone — the pivot point between near and far
- **Positions 7–11** (rightmost): the furthest notes from the root on the circle of fifths

Each chip shows:
- The note's permanent Interval Gravity sticker color as its background
- The note letter name below the chip
- The fifths distance number below the note name

### Scale vs Non-Scale Styling

| State | Border | Opacity | Name Weight |
|-------|--------|---------|-------------|
| In scale | Bright white border (high contrast) | Full (1.0) | Bold (700) |
| Outside scale | Thin subtle gray border (just visible) | Reduced (0.4) | Normal (400) |

---

## Labels

**Above the spectrum row:**
- Left side: "← near" in a green-tinted color
- Right side: "far →" in a blue/purple-tinted color

**Below the spectrum row:**
- A legend row with two items:
  - A small chip with a bright white border + "In scale"
  - A small chip with a thin gray border at reduced opacity + "Outside scale"

---

## Behavior

- When the selected key changes, the entire spectrum reorders. The new root moves to position 0, and all other notes rearrange by their fifths distance from the new root.
- When the mode changes (major/minor), the scale membership changes — different notes get the bright border and full opacity.
- The note colors themselves never change — they are permanent Interval Gravity assignments.

---

## Data

The spectrum order is computed by walking the circle of fifths from the current root:

```typescript
const FIFTHS_ORDER = ["C","G","D","A","E","B","F#","C#","Ab","Eb","Bb","F"];

function getFifthsFromRoot(root) {
  const idx = FIFTHS_ORDER.indexOf(root);
  return [...FIFTHS_ORDER.slice(idx), ...FIFTHS_ORDER.slice(0, idx)];
}

function getFifthsDistance(root, note) {
  return getFifthsFromRoot(root).indexOf(note);
}
```

The first 6 positions (0–5) plus position 11 typically correspond to the 7 major scale notes. The remaining 5 are chromatic/outside the scale.
