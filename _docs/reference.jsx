import { useState } from "react";

// ─── Music Theory Data ───
const NOTES_DIATONIC_C = ["C","D","E","F","G","A","B"];

const DIATONIC_CHORDS = [
  { deg: 0, notes: ["C","E","G"],   num: "I",    name: "C",   quality: "major" },
  { deg: 1, notes: ["D","F","A"],   num: "ii",   name: "Dm",  quality: "minor" },
  { deg: 2, notes: ["E","G","B"],   num: "iii",  name: "Em",  quality: "minor" },
  { deg: 3, notes: ["F","A","C"],   num: "IV",   name: "F",   quality: "major" },
  { deg: 4, notes: ["G","B","D"],   num: "V",    name: "G",   quality: "major" },
  { deg: 5, notes: ["A","C","E"],   num: "vi",   name: "Am",  quality: "minor" },
  { deg: 6, notes: ["B","D","F"],   num: "vii°", name: "Bdim",quality: "dim"   },
];

const SEVENTH_CHORDS = [
  { notes: ["C","E","G","B"],   num: "Imaj7",  name: "Cmaj7" },
  { notes: ["D","F","A","C"],   num: "ii7",    name: "Dm7" },
  { notes: ["E","G","B","D"],   num: "iii7",   name: "Em7" },
  { notes: ["F","A","C","E"],   num: "IVmaj7", name: "Fmaj7" },
  { notes: ["G","B","D","F"],   num: "V7",     name: "G7" },
  { notes: ["A","C","E","G"],   num: "vi7",    name: "Am7" },
  { notes: ["B","D","F","A"],   num: "viiø7",  name: "Bø7" },
];

// Grid layout is defined by BLACK_ROW_1/3/5 and WHITE_ROW_2/4/6 above

// ─── COLOR SYSTEM DEFINITIONS ───

const CHORD_COLORS = {
  "I": "#E74C3C", "ii": "#E67E22", "iii": "#D4AC0D",
  "IV": "#27AE60", "V": "#3498DB", "vi": "#8E44AD", "vii°": "#95A5A6",
};

const ROOT_COLORS = {
  "C": "#E74C3C", "D": "#E67E22", "E": "#D4AC0D", "F": "#27AE60",
  "G": "#3498DB", "A": "#8E44AD", "B": "#E91E63",
};

const INTERVAL_COLORS = {
  "root": "#1A1A2E", "3rd": "#C0392B", "5th": "#2980B9",
};

const NOTE_FUNC_COLORS = {
  "C": { note: "#E74C3C", func: "#27AE60" },
  "D": { note: "#E67E22", func: "#F39C12" },
  "E": { note: "#F1C40F", func: "#27AE60" },
  "F": { note: "#2ECC71", func: "#F39C12" },
  "G": { note: "#3498DB", func: "#E74C3C" },
  "A": { note: "#9B59B6", func: "#27AE60" },
  "B": { note: "#E91E63", func: "#E74C3C" },
};

// System 1: Interval Gravity
// System 1: Interval Gravity — mapped to actual sticker dot colors
// Circle of fifths from C → rainbow arc: red → orange → yellow → green → teal → blue → navy → purple
const GRAVITY_COLORS = {
  "C":  "#CC1F16",  // Thunderbird (deep red) — 0 fifths
  "G":  "#E86902",  // Clementine (orange) — 1 fifth
  "D":  "#E99630",  // Fire Bush (golden-orange) — 2 fifths
  "A":  "#F2C73D",  // Saffron (yellow-gold) — 3 fifths
  "E":  "#FFEA01",  // Turbo (bright yellow) — 4 fifths
  "B":  "#94BD3B",  // Sushi (chartreuse) — 5 fifths
  "F#": "#50B000",  // Limeade (green) — 6 fifths (tritone)
  "C#": "#01ACAB",  // Persian Green (teal) — 7 fifths
  "Ab": "#2D76BA",  // Mariner (blue) — 8 fifths
  "Eb": "#1D3DA2",  // Persian Blue (navy) — 9 fifths
  "Bb": "#0407AF",  // Dark Blue (deep blue-violet) — 10 fifths
  "F":  "#6C2EAF",  // Purple Heart (rich purple) — 11 fifths
};
const GRAVITY_STICKER_NAMES = {
  "C": "Thunderbird", "G": "Clementine", "D": "Fire Bush", "A": "Saffron",
  "E": "Turbo", "B": "Sushi", "F#": "Limeade", "C#": "Persian Green",
  "Ab": "Mariner", "Eb": "Persian Blue", "Bb": "Dark Blue", "F": "Purple Heart",
};

// System 3: Binary
const getBinaryColor = (note) => {
  const stable = ["C","E","G","F","A"];
  const active = ["D","B"];
  if (stable.includes(note)) return { bg: "#E8C84A", text: "#3A2F0B" };
  if (active.includes(note)) return { bg: "#4A90C4", text: "#FFF" };
  return { bg: "#3D3D4A", text: "#777" };
};

// System 4: Root proximity
const getRootMapping = (note) => {
  for (const chord of DIATONIC_CHORDS) {
    if (chord.notes[0] === note) return { root: chord.notes[0], interval: "root" };
  }
  for (const chord of DIATONIC_CHORDS) {
    if (chord.notes[2] === note) return { root: chord.notes[0], interval: "5th" };
  }
  for (const chord of DIATONIC_CHORDS) {
    if (chord.notes[1] === note) return { root: chord.notes[0], interval: "3rd" };
  }
  return { root: "C", interval: "root" };
};

// ─── System metadata ───
const SYSTEMS = [
  {
    id: "gravity",
    name: "Interval Gravity",
    colors: "1 color/key",
    desc: "Color by distance from C on the circle of fifths. Harmonically close notes share warm hues; distant chromatic notes are cool. The diatonic scale naturally 'glows' and outsiders are visually cold — no stripes needed.",
    pros: [
      "Diatonic scale clusters into warm tones naturally",
      "Chromatic notes are visually distinct without markers",
      "Only 1 color per key — lowest cognitive load",
      "Circle-of-fifths relationships become visible",
      "Adapts to other keys by shifting the warm center",
    ],
    cons: [
      "Doesn't directly encode chord membership",
      "Need to learn warm = diatonic, cool = chromatic",
      "Two notes at similar fifths-distance look similar",
    ],
  },
  {
    id: "triad",
    name: "Triad Membership",
    colors: "3 stripes/key",
    desc: "Every diatonic note is in exactly 3 triads. Each key shows all 3 as color stripes. When you select a chord, the matching stripe appears across all member keys — literally see which notes share chord membership.",
    pros: [
      "Directly shows chord membership — the core use case",
      "Finding a chord = finding shared color stripes",
      "Chord overlap is explicit (shared stripes = shared notes)",
      "Substitute chords discoverable visually",
      "No abstract function mapping — it's literal",
    ],
    cons: [
      "3 colors per key is visually dense",
      "7 chord colors to memorize",
      "Black keys need separate treatment",
    ],
  },
  {
    id: "binary",
    name: "Stable / Active",
    colors: "1 color/key",
    desc: "The simplest system possible. Notes are either STABLE (gold — sound resolved, chord tones of I & IV) or ACTIVE (blue — create tension, want to resolve). Chromatic = dark. Any cluster of golds sounds good together.",
    pros: [
      "Absolute minimum cognitive load — 2 states",
      "Play 'all the golds' and it sounds good",
      "Great for beginners and free improvisation",
      "Could layer on top of any other system",
      "No theory knowledge required to use",
    ],
    cons: [
      "Very low information — can't distinguish chords",
      "Oversimplifies the active notes",
      "Not useful once you outgrow basic playing",
    ],
  },
  {
    id: "proximity",
    name: "Chord-Root Anchor",
    colors: "2 halves/key",
    desc: "Top half = which chord root 'owns' this note. Bottom half = what interval role it plays (root, 3rd, or 5th). Finding a chord = finding 3 keys with matching tops whose bottoms show root + 3rd + 5th.",
    pros: [
      "Finding chords = matching top colors",
      "Bottom shows chord 'shape' (root/3rd/5th)",
      "Voice leading visible as root-color changes",
      "Each note has a clear 'home chord' identity",
      "Moderate cognitive load — 2 layers",
    ],
    cons: [
      "Notes belong to multiple chords but show only one",
      "Same forced-assignment problem as Note+Function",
      "7 root colors still required",
    ],
  },
  {
    id: "notefunction",
    name: "Note + Function (Original)",
    colors: "2 halves/key",
    desc: "The system from the earlier document. Top = note identity (7 rainbow colors). Bottom = harmonic function: green for tonic (I, vi), amber for subdominant (IV, ii), red for dominant (V, vii°). Black keys get gray.",
    pros: [
      "Always know both note name and function",
      "Function families immediately visible",
      "Progressions trace color arcs (green→amber→red→green)",
      "Well-formalized with clear rules",
    ],
    cons: [
      "10 distinct hues total to learn",
      "Forces notes into single function despite ambiguity",
      "Rainbow note mapping is arbitrary — must memorize",
      "Function red overlaps with note C red",
    ],
  },
];

// ─── KEY SIZE ───
const KEY_W = 64;
const KEY_H = 64;
const BLACK_W = 52;
const BLACK_H = 48;
const GAP = 5;
const COL_PITCH = KEY_W + GAP; // center-to-center distance between white keys

// Black key offset helpers
// gapCenter(i) = left-edge px so black key centers on the gap between white col i and col i+1
const gapCenter = (i) => i * COL_PITCH + KEY_W + (GAP - BLACK_W) / 2;
// leftHang = black key hanging half off the left edge (for Ab above row 4)
const leftHang = -BLACK_W / 2 + 4;

// Row 1 blacks above Row 2 (C D E F G):
//   C# between C-D, Eb between D-E, F# between F-G
const BLACK_ROW_1 = [
  { note: "C#", left: gapCenter(0) },
  { note: "Eb", left: gapCenter(1) },
  { note: "F#", left: gapCenter(3) },
];

// Row 3 blacks above Row 4 (A B C D E):
//   Ab hangs left of A, Bb between A-B, C# between C-D, Eb between D-E
const BLACK_ROW_3 = [
  { note: "Ab", left: leftHang },
  { note: "Bb", left: gapCenter(0) },
  { note: "C#", left: gapCenter(2) },
  { note: "Eb", left: gapCenter(3) },
];

// Row 5 blacks above Row 6 (F G A B C):
//   F# between F-G, Ab between G-A, Bb between A-B
const BLACK_ROW_5 = [
  { note: "F#", left: gapCenter(0) },
  { note: "Ab", left: gapCenter(1) },
  { note: "Bb", left: gapCenter(2) },
];

// White key rows
const WHITE_ROW_2 = ["C", "D", "E", "F", "G"];
const WHITE_ROW_4 = ["A", "B", "C", "D", "E"];
const WHITE_ROW_6 = ["F", "G", "A", "B", "C"];

export default function ColorSystemExplorer() {
  const [activeSystem, setActiveSystem] = useState("gravity");
  const [activeChord, setActiveChord] = useState(null);
  const [showSeventh, setShowSeventh] = useState(false);

  const system = SYSTEMS.find(s => s.id === activeSystem);
  const chordSet = showSeventh ? SEVENTH_CHORDS : DIATONIC_CHORDS;

  const isInChord = (note) => {
    if (!activeChord) return false;
    const chord = chordSet.find(c => c.num === activeChord);
    return chord?.notes.includes(note);
  };

  const isDiatonic = (note) => NOTES_DIATONIC_C.includes(note);

  // ─── Render a single key ───
  const renderKey = (cell, rowIdx, colIdx) => {
    if (!cell) {
      return (
        <div
          key={`${rowIdx}-${colIdx}`}
          style={{ width: cell?.type === "black" ? BLACK_W : KEY_W, height: cell?.type === "black" ? BLACK_H : KEY_H }}
        />
      );
    }

    const { note, type } = cell;
    const isBlack = type === "black";
    const w = isBlack ? BLACK_W : KEY_W;
    const h = isBlack ? BLACK_H : KEY_H;
    const inChord = isInChord(note);
    const dimmed = activeChord && !inChord;
    const diatonic = isDiatonic(note);
    const uid = `${rowIdx}-${colIdx}`;

    // ─── System-specific rendering ───
    if (activeSystem === "gravity") {
      const bg = GRAVITY_COLORS[note] || "#333";
      return (
        <div
          key={uid}
          className="flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer select-none"
          style={{
            width: w, height: h,
            background: bg,
            opacity: dimmed ? 0.2 : 1,
            transform: inChord ? "scale(1.12)" : "scale(1)",
            boxShadow: inChord ? `0 0 24px ${bg}99, 0 4px 16px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.2)",
            border: inChord ? "2.5px solid #FFF" : isBlack ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.12)",
            zIndex: inChord ? 10 : 1,
            position: "relative",
          }}
        >
          <span className="font-bold" style={{
            fontSize: isBlack ? 11 : 13,
            color: ["E","A","B","D"].includes(note) ? "#2A2A2A" : "#FFF",
            textShadow: ["E","A","B","D"].includes(note) ? "none" : "0 1px 2px rgba(0,0,0,0.3)",
          }}>{note}</span>
        </div>
      );
    }

    if (activeSystem === "binary") {
      const color = getBinaryColor(note);
      return (
        <div
          key={uid}
          className="flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer select-none"
          style={{
            width: w, height: h,
            background: color.bg,
            color: color.text,
            opacity: dimmed ? 0.2 : 1,
            transform: inChord ? "scale(1.12)" : "scale(1)",
            boxShadow: inChord ? "0 0 24px rgba(232,200,74,0.5), 0 4px 16px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
            border: inChord ? "2.5px solid #FFF" : "1px solid rgba(255,255,255,0.1)",
            zIndex: inChord ? 10 : 1,
            position: "relative",
          }}
        >
          <span className="font-bold" style={{ fontSize: isBlack ? 11 : 13 }}>{note}</span>
        </div>
      );
    }

    if (activeSystem === "triad") {
      if (!diatonic) {
        return (
          <div
            key={uid}
            className="flex items-center justify-center rounded-lg cursor-pointer select-none"
            style={{
              width: w, height: h,
              background: "#222230",
              opacity: dimmed ? 0.12 : 0.45,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span className="font-bold" style={{ fontSize: 10, color: "#555" }}>{note}</span>
          </div>
        );
      }
      const memberships = DIATONIC_CHORDS.filter(c => c.notes.includes(note)).map(c => c.num);
      const stripeH = Math.floor(h / 3);
      return (
        <div
          key={uid}
          className="flex flex-col rounded-lg overflow-hidden cursor-pointer select-none transition-all duration-200"
          style={{
            width: w, height: h,
            opacity: dimmed ? 0.2 : 1,
            transform: inChord ? "scale(1.12)" : "scale(1)",
            boxShadow: inChord ? "0 0 20px rgba(255,255,255,0.25), 0 4px 14px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
            border: inChord ? "2.5px solid #FFF" : "1px solid rgba(255,255,255,0.1)",
            zIndex: inChord ? 10 : 1,
            position: "relative",
          }}
        >
          {memberships.map((m, i) => {
            const isMatch = m === activeChord;
            return (
              <div
                key={i}
                className="flex items-center justify-center"
                style={{
                  background: CHORD_COLORS[m],
                  height: i === 2 ? h - stripeH * 2 : stripeH,
                  opacity: isMatch ? 1 : (activeChord ? 0.25 : 0.85),
                  transition: "opacity 0.2s",
                }}
              >
                <span className="text-white font-bold" style={{ fontSize: 9, letterSpacing: 0.5 }}>
                  {i === 1 ? note : m}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeSystem === "proximity") {
      if (!diatonic) {
        return (
          <div
            key={uid}
            className="flex items-center justify-center rounded-lg cursor-pointer select-none"
            style={{
              width: w, height: h,
              background: "#222230",
              opacity: dimmed ? 0.12 : 0.45,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span className="font-bold" style={{ fontSize: 10, color: "#555" }}>{note}</span>
          </div>
        );
      }
      const mapping = getRootMapping(note);
      const topBg = ROOT_COLORS[mapping.root];
      const botBg = INTERVAL_COLORS[mapping.interval];
      const halfH = Math.floor(h / 2);
      return (
        <div
          key={uid}
          className="flex flex-col rounded-lg overflow-hidden cursor-pointer select-none transition-all duration-200"
          style={{
            width: w, height: h,
            opacity: dimmed ? 0.2 : 1,
            transform: inChord ? "scale(1.12)" : "scale(1)",
            boxShadow: inChord ? "0 0 20px rgba(255,255,255,0.25), 0 4px 14px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
            border: inChord ? "2.5px solid #FFF" : "1px solid rgba(255,255,255,0.1)",
            zIndex: inChord ? 10 : 1,
            position: "relative",
          }}
        >
          <div className="flex items-center justify-center" style={{ background: topBg, height: halfH }}>
            <span className="text-white font-bold" style={{ fontSize: 12 }}>{mapping.root}</span>
          </div>
          <div className="flex items-center justify-center" style={{ background: botBg, height: h - halfH }}>
            <span className="text-white font-bold" style={{ fontSize: 10 }}>{mapping.interval}</span>
          </div>
        </div>
      );
    }

    if (activeSystem === "notefunction") {
      if (!diatonic) {
        const baseNote = note.replace("#","").replace("b","");
        const noteColor = NOTE_FUNC_COLORS[baseNote]?.note || "#444";
        const halfH = Math.floor(h / 2);
        return (
          <div
            key={uid}
            className="flex flex-col rounded-lg overflow-hidden cursor-pointer select-none"
            style={{
              width: w, height: h,
              opacity: dimmed ? 0.12 : 0.45,
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex items-center justify-center" style={{ background: noteColor, height: halfH, opacity: 0.55 }}>
              <span className="text-white font-bold" style={{ fontSize: 10 }}>{note}</span>
            </div>
            <div className="flex items-center justify-center" style={{ background: "#666", height: h - halfH }}>
              <span className="text-white" style={{ fontSize: 9 }}>N</span>
            </div>
          </div>
        );
      }
      const colors = NOTE_FUNC_COLORS[note];
      const halfH = Math.floor(h / 2);
      const funcLabel = colors.func === "#27AE60" ? "T" : colors.func === "#F39C12" ? "S" : "D";
      return (
        <div
          key={uid}
          className="flex flex-col rounded-lg overflow-hidden cursor-pointer select-none transition-all duration-200"
          style={{
            width: w, height: h,
            opacity: dimmed ? 0.2 : 1,
            transform: inChord ? "scale(1.12)" : "scale(1)",
            boxShadow: inChord ? "0 0 20px rgba(255,255,255,0.25), 0 4px 14px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
            border: inChord ? "2.5px solid #FFF" : "1px solid rgba(255,255,255,0.1)",
            zIndex: inChord ? 10 : 1,
            position: "relative",
          }}
        >
          <div className="flex items-center justify-center" style={{ background: colors.note, height: halfH }}>
            <span className="font-bold" style={{ fontSize: 13, color: note === "E" ? "#2C2C2C" : "#FFF" }}>{note}</span>
          </div>
          <div className="flex items-center justify-center" style={{ background: colors.func, height: h - halfH }}>
            <span className="text-white font-bold" style={{ fontSize: 11 }}>{funcLabel}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // ─── Render a black key row (absolute positioned) ───
  const renderBlackRow = (blackKeys, rowLabel) => {
    const totalW = 5 * KEY_W + 4 * GAP;
    return (
      <div className="relative" style={{ height: BLACK_H, width: totalW }}>
        {blackKeys.map((bk, i) => (
          <div key={`${rowLabel}-${i}`} className="absolute" style={{ left: bk.left, top: 0 }}>
            {renderKey({ note: bk.note, type: "black" }, rowLabel, i)}
          </div>
        ))}
      </div>
    );
  };

  // ─── Render a white key row ───
  const renderWhiteRow = (notes, rowLabel) => {
    return (
      <div className="flex" style={{ gap: GAP }}>
        {notes.map((note, i) => (
          <div key={`${rowLabel}-${i}`}>
            {renderKey({ note, type: "white" }, rowLabel, i)}
          </div>
        ))}
      </div>
    );
  };

  // ─── Render the full 6-row grid ───
  const renderGrid = () => {
    const totalW = 5 * KEY_W + 4 * GAP;
    return (
      <div className="flex flex-col items-start" style={{ gap: 2, paddingLeft: BLACK_W / 2 }}>
        <div style={{ width: totalW, position: "relative" }}>
          {renderBlackRow(BLACK_ROW_1, "br1")}
        </div>
        {renderWhiteRow(WHITE_ROW_2, "wr2")}
        <div style={{ width: totalW, position: "relative", marginTop: 4 }}>
          {renderBlackRow(BLACK_ROW_3, "br3")}
        </div>
        {renderWhiteRow(WHITE_ROW_4, "wr4")}
        <div style={{ width: totalW, position: "relative", marginTop: 4 }}>
          {renderBlackRow(BLACK_ROW_5, "br5")}
        </div>
        {renderWhiteRow(WHITE_ROW_6, "wr6")}
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-100" style={{ background: "#0C0C14", fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#E8E8F0" }}>
          EasyPlay1S Color Systems
        </h1>
        <p className="text-xs mt-1" style={{ color: "#6A6A7E" }}>
          5 systems compared on the actual grid layout · Click chords to highlight · Key of C major
        </p>
      </div>

      {/* System Tabs */}
      <div className="px-6 pb-3">
        <div className="flex gap-1.5 flex-wrap">
          {SYSTEMS.map(sys => (
            <button
              key={sys.id}
              onClick={() => { setActiveSystem(sys.id); setActiveChord(null); }}
              className="px-3 py-2 rounded-lg transition-all duration-150"
              style={{
                background: activeSystem === sys.id ? "#1E1E30" : "transparent",
                border: activeSystem === sys.id ? "1px solid #2E2E45" : "1px solid transparent",
              }}
            >
              <div className="font-bold text-xs" style={{ color: activeSystem === sys.id ? "#E8E8F0" : "#5A5A6E" }}>
                {sys.name}
              </div>
              <div style={{ fontSize: 10, color: activeSystem === sys.id ? "#7A7A9E" : "#3E3E52", marginTop: 1 }}>
                {sys.colors}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="px-6 pb-3">
        <div className="rounded-xl px-4 py-3" style={{ background: "#111119", border: "1px solid #1E1E2E" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#9090A8" }}>{system.desc}</p>
        </div>
      </div>

      {/* Main Content: Grid + Chords side by side */}
      <div className="px-6 pb-3 flex gap-4 flex-wrap">
        {/* Grid */}
        <div className="rounded-xl p-5" style={{ background: "#131320", border: "1px solid #1E1E2E", minWidth: 360 }}>
          <div className="text-xs font-medium mb-3" style={{ color: "#4A4A5E", letterSpacing: 1 }}>
            PHYSICAL GRID
          </div>
          {renderGrid()}
          <div className="mt-3 flex gap-4">
            <span style={{ fontSize: 10, color: "#3E3E52" }}>Rows 1–2: C3–G3</span>
            <span style={{ fontSize: 10, color: "#3E3E52" }}>Rows 3–4: A3–E4</span>
            <span style={{ fontSize: 10, color: "#3E3E52" }}>Rows 5–6: F4–C5</span>
          </div>
        </div>

        {/* Chord selector + legend */}
        <div className="flex-1" style={{ minWidth: 260 }}>
          {/* Chord toggles */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#131320", border: "1px solid #1E1E2E" }}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-medium" style={{ color: "#4A4A5E", letterSpacing: 1 }}>CHORDS</span>
              <button
                onClick={() => { setShowSeventh(false); setActiveChord(null); }}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: !showSeventh ? "#1E1E30" : "transparent", color: !showSeventh ? "#CCC" : "#4A4A5E" }}
              >
                Triads
              </button>
              <button
                onClick={() => { setShowSeventh(true); setActiveChord(null); }}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: showSeventh ? "#1E1E30" : "transparent", color: showSeventh ? "#CCC" : "#4A4A5E" }}
              >
                7ths
              </button>
              {activeChord && (
                <button onClick={() => setActiveChord(null)} className="text-xs ml-auto" style={{ color: "#E74C3C" }}>
                  Clear ×
                </button>
              )}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {chordSet.map(chord => {
                const isActive = activeChord === chord.num;
                return (
                  <button
                    key={chord.num}
                    onClick={() => setActiveChord(isActive ? null : chord.num)}
                    className="px-2.5 py-1.5 rounded-lg font-mono transition-all duration-150"
                    style={{
                      background: isActive ? "#1E1E35" : "#0F0F18",
                      border: isActive ? "1px solid #3A3A55" : "1px solid #1A1A28",
                      color: isActive ? "#FFF" : "#6A6A7E",
                      fontSize: 12,
                      transform: isActive ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <span className="font-bold">{chord.num}</span>
                    <span className="ml-1 opacity-50" style={{ fontSize: 10 }}>{chord.name}</span>
                  </button>
                );
              })}
            </div>
            {activeChord && (
              <div className="mt-3 pt-2" style={{ borderTop: "1px solid #1A1A28" }}>
                <span className="text-xs" style={{ color: "#6A6A7E" }}>
                  Notes: {chordSet.find(c => c.num === activeChord)?.notes.join(" · ")}
                </span>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="rounded-xl p-4 mb-3" style={{ background: "#131320", border: "1px solid #1E1E2E" }}>
            <div className="text-xs font-medium mb-2" style={{ color: "#4A4A5E", letterSpacing: 1 }}>LEGEND</div>

            {activeSystem === "gravity" && (
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {["C","G","D","A","E","B","F#","C#","Ab","Eb","Bb","F"].map((n, i) => (
                  <div key={n} className="flex items-center gap-1">
                    <div className="rounded" style={{ width: 12, height: 12, background: GRAVITY_COLORS[n] }} />
                    <span style={{ fontSize: 10, color: "#7A7A8E" }}>{n}</span>
                    <span style={{ fontSize: 9, color: "#3E3E52" }}>({GRAVITY_STICKER_NAMES[n]})</span>
                  </div>
                ))}
                <div className="w-full mt-1" style={{ fontSize: 10, color: "#4A4A5E" }}>
                  Circle of fifths from C · Warm (red/orange) = close · Cool (blue/purple) = far · Sticker dot colors
                </div>
              </div>
            )}

            {activeSystem === "triad" && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(CHORD_COLORS).map(([num, col]) => (
                  <div key={num} className="flex items-center gap-1">
                    <div className="rounded" style={{ width: 12, height: 12, background: col }} />
                    <span className="font-mono" style={{ fontSize: 10, color: "#8A8A9E" }}>{num}</span>
                  </div>
                ))}
                <div className="w-full mt-1" style={{ fontSize: 10, color: "#4A4A5E" }}>
                  Each diatonic key shows 3 stripes = the 3 triads it belongs to
                </div>
              </div>
            )}

            {activeSystem === "binary" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="rounded" style={{ width: 14, height: 14, background: "#E8C84A" }} />
                  <span style={{ fontSize: 11, color: "#9090A8" }}>Stable — chord tones of I & IV (C E F G A)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded" style={{ width: 14, height: 14, background: "#4A90C4" }} />
                  <span style={{ fontSize: 11, color: "#9090A8" }}>Active — leading tone & supertonic (B D)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded" style={{ width: 14, height: 14, background: "#3D3D4A" }} />
                  <span style={{ fontSize: 11, color: "#9090A8" }}>Chromatic — outside the key</span>
                </div>
              </div>
            )}

            {activeSystem === "proximity" && (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(ROOT_COLORS).map(([n, col]) => (
                    <div key={n} className="flex items-center gap-1">
                      <div className="rounded" style={{ width: 10, height: 10, background: col }} />
                      <span style={{ fontSize: 10, color: "#8A8A9E" }}>{n}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mb-1">
                  {Object.entries(INTERVAL_COLORS).map(([role, col]) => (
                    <div key={role} className="flex items-center gap-1">
                      <div className="rounded" style={{ width: 10, height: 10, background: col }} />
                      <span style={{ fontSize: 10, color: "#8A8A9E" }}>{role}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#4A4A5E" }}>Top = root color · Bottom = interval role</div>
              </div>
            )}

            {activeSystem === "notefunction" && (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(NOTE_FUNC_COLORS).map(([n, cols]) => (
                    <div key={n} className="flex items-center gap-1">
                      <div className="rounded overflow-hidden flex" style={{ width: 12, height: 12 }}>
                        <div style={{ width: 6, background: cols.note, height: 12 }} />
                        <div style={{ width: 6, background: cols.func, height: 12 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#8A8A9E" }}>{n}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <div className="rounded" style={{ width: 10, height: 10, background: "#27AE60" }} />
                    <span style={{ fontSize: 10, color: "#7A7A8E" }}>T = Tonic</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="rounded" style={{ width: 10, height: 10, background: "#F39C12" }} />
                    <span style={{ fontSize: 10, color: "#7A7A8E" }}>S = Subdominant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="rounded" style={{ width: 10, height: 10, background: "#E74C3C" }} />
                    <span style={{ fontSize: 10, color: "#7A7A8E" }}>D = Dominant</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pros & Cons */}
      <div className="px-6 pb-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: "#111119", border: "1px solid #1E1E2E" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "#4ADE80", letterSpacing: 0.5 }}>STRENGTHS</div>
            {system.pros.map((p, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <span style={{ color: "#4ADE80", fontSize: 11 }}>+</span>
                <span className="text-xs" style={{ color: "#9090A8" }}>{p}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl p-4" style={{ background: "#111119", border: "1px solid #1E1E2E" }}>
            <div className="text-xs font-bold mb-2" style={{ color: "#F87171", letterSpacing: 0.5 }}>TRADEOFFS</div>
            {system.cons.map((c, i) => (
              <div key={i} className="flex gap-2 mb-1.5">
                <span style={{ color: "#F87171", fontSize: 11 }}>−</span>
                <span className="text-xs" style={{ color: "#9090A8" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
