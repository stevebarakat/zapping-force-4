import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Music, Play, Pause } from "lucide-react";
import { Slider } from "@/components/Slider";

type RhythmPattern = {
  name: string;
  description: string;
  notes: RhythmNote[];
};

type RhythmNote = {
  value: string; // e.g., "4n", "8n", etc.
  rest?: boolean;
  dotted?: boolean;
  text?: string; // Optional text to display with the note
};

const rhythmPatterns: RhythmPattern[] = [
  {
    name: "Quarter Notes",
    description: "Basic quarter notes with even timing",
    notes: [{ value: "4n" }, { value: "4n" }, { value: "4n" }, { value: "4n" }],
  },
  {
    name: "Eighth Notes",
    description: "Eighth notes create a faster, more flowing rhythm",
    notes: [
      { value: "8n" },
      { value: "8n" },
      { value: "8n" },
      { value: "8n" },
      { value: "8n" },
      { value: "8n" },
      { value: "8n" },
      { value: "8n" },
    ],
  },
  {
    name: "Mixed Rhythm",
    description: "A mix of quarter and eighth notes",
    notes: [
      { value: "4n" },
      { value: "8n" },
      { value: "8n" },
      { value: "4n" },
      { value: "8n" },
      { value: "8n" },
    ],
  },
  {
    name: "Syncopation",
    description: "Emphasis on off-beats creates tension",
    notes: [
      { value: "8n" },
      { value: "4n" },
      { value: "8n" },
      { value: "8n" },
      { value: "4n" },
      { value: "8n" },
    ],
  },
  {
    name: "Dotted Rhythm",
    description: "Dotted notes create a swing or bounce feel",
    notes: [
      { value: "4n", dotted: true },
      { value: "8n" },
      { value: "4n", dotted: true },
      { value: "8n" },
    ],
  },
  {
    name: "With Rests",
    description: "Rests create space and anticipation",
    notes: [
      { value: "4n" },
      { value: "8n", rest: true },
      { value: "8n" },
      { value: "4n" },
      { value: "4n", rest: true },
    ],
  },
  {
    name: "16th Note Pattern",
    description: "Sixteenth notes add detail and complexity",
    notes: [
      { value: "16n" },
      { value: "16n" },
      { value: "16n" },
      { value: "16n" },
      { value: "8n" },
      { value: "8n" },
      { value: "16n" },
      { value: "16n" },
      { value: "16n" },
      { value: "16n" },
    ],
  },
  {
    name: "Triplet Feel",
    description: "Triplets divide the beat into three equal parts",
    notes: [
      { value: "8t" },
      { value: "8t" },
      { value: "8t" },
      { value: "8t" },
      { value: "8t" },
      { value: "8t" },
      { value: "4n" },
    ],
  },
];

// Mapping of Tone.js duration values to music notation symbols
const noteSymbols = {
  "1n": "𝅝", // Whole note
  "2n": "𝅗𝅥", // Half note
  "4n": "♩", // Quarter note
  "8n": "♪", // Eighth note
  "16n": "𝅘𝅥𝅯", // Sixteenth note
  "8t": "𝅘𝅥𝅯𝅘𝅥𝅯𝅘𝅥𝅯", // Eighth note triplet (using 16th triplet symbol as approximation)
};

// Mapping of Tone.js duration values to rest symbols
const restSymbols = {
  "1n": "𝄻", // Whole rest
  "2n": "𝄼", // Half rest
  "4n": "𝄽", // Quarter rest
  "8n": "𝄾", // Eighth rest
  "16n": "𝄿", // Sixteenth rest
  "8t": "𝅀", // Eighth triplet rest (approximation)
};

function RhythmNotationExplorer() {
  const [selectedPattern, setSelectedPattern] = useState<RhythmPattern>(
    rhythmPatterns[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [tempo, setTempo] = useState(100); // BPM

  const synthRef = useRef<Tone.Synth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // Initialize synth
  useEffect(function initSynth() {
    synthRef.current = new Tone.Synth({
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();

    return function cleanup() {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Update tempo
  useEffect(
    function updateTempo() {
      Tone.Transport.bpm.value = tempo;
    },
    [tempo]
  );

  // Play the rhythm pattern
  async function playRhythm() {
    if (isPlaying) {
      stopRhythm();
      return;
    }

    // Ensure audio context is running
    await Tone.start();
    setIsPlaying(true);

    // Create an array of events for the sequence
    const events = selectedPattern.notes.map((note, index) => ({
      note: "C4",
      index,
      duration: note.value,
      rest: note.rest || false,
    }));

    // Create a sequence
    sequenceRef.current = new Tone.Sequence(
      function (time, event) {
        // Update UI to show current note
        setCurrentNoteIndex(event.index);

        // Play note if it's not a rest
        if (!event.rest && synthRef.current) {
          synthRef.current.triggerAttackRelease(
            event.note,
            event.duration,
            time
          );
        }
      },
      events,
      "4n"
    ).start(0);

    // Start the transport
    Tone.Transport.start();

    // Set a timeout to stop after playing through once
    const patternDuration = Tone.Time("4n").toSeconds() * events.length;
    setTimeout(function () {
      stopRhythm();
    }, patternDuration * 1000 + 500); // Add a little buffer time
  }

  // Stop the rhythm
  function stopRhythm() {
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    setCurrentNoteIndex(null);
  }

  // Get the display symbol for a note
  function getNoteSymbol(note: RhythmNote) {
    const baseSymbol = note.rest
      ? restSymbols[note.value as keyof typeof restSymbols] || "?"
      : noteSymbols[note.value as keyof typeof noteSymbols] || "?";

    // Add a dot if the note is dotted
    return note.dotted ? `${baseSymbol}.` : baseSymbol;
  }

  // Calculate note width based on duration
  function getNoteWidth(value: string): number {
    const widthMap: Record<string, number> = {
      "1n": 100, // Whole note
      "2n": 70, // Half note
      "4n": 50, // Quarter note
      "8n": 40, // Eighth note
      "16n": 30, // Sixteenth note
      "8t": 30, // Eighth triplet
    };

    return widthMap[value] || 40;
  }

  // Get beaming information for eighth and smaller notes
  function getBeamingInfo(
    notes: RhythmNote[]
  ): { start: number; end: number }[] {
    const beams: { start: number; end: number }[] = [];
    let currentBeam: { start: number; end: number } | null = null;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const isBeamable =
        note.value !== "4n" &&
        note.value !== "2n" &&
        note.value !== "1n" &&
        !note.rest;

      if (isBeamable && currentBeam === null) {
        // Start a new beam
        currentBeam = { start: i, end: i };
      } else if (isBeamable && currentBeam !== null) {
        // Extend the current beam
        currentBeam.end = i;
      } else if (!isBeamable && currentBeam !== null) {
        // End the current beam if it has at least 2 notes
        if (currentBeam.end > currentBeam.start) {
          beams.push(currentBeam);
        }
        currentBeam = null;
      }
    }

    // Add the last beam if it exists and has at least 2 notes
    if (currentBeam !== null && currentBeam.end > currentBeam.start) {
      beams.push(currentBeam);
    }

    return beams;
  }

  return (
    <div className="demo-container">
      <h3 className="component-title">Rhythm Notation Explorer</h3>

      <div className="controls">
        <div className="pattern-selector">
          <label htmlFor="pattern-select">Pattern:</label>
          <select
            id="pattern-select"
            value={selectedPattern.name}
            onChange={(e) => {
              const selected = rhythmPatterns.find(
                (p) => p.name === e.target.value
              );
              if (selected) setSelectedPattern(selected);
            }}
            disabled={isPlaying}
            className="select"
          >
            {rhythmPatterns.map((pattern) => (
              <option key={pattern.name} value={pattern.name}>
                {pattern.name}
              </option>
            ))}
          </select>
        </div>

        <div className="tempo-control">
          <Slider
            value={tempo}
            onChange={(value) => setTempo(value)}
            min={40}
            max={208}
            step={1}
            label="Tempo"
            showValue={true}
            suffix=" BPM"
          />
        </div>

        <button
          onClick={playRhythm}
          className={`button ${isPlaying ? "playing" : ""}`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Stop" : "Play Rhythm"}
        </button>
      </div>

      <div className="pattern-description">{selectedPattern.description}</div>

      <div className="notation-display">
        <div className="staff">
          {/* Treble clef */}
          <div className="clef">𝄞</div>

          {/* Time signature */}
          <div className="time-signature">
            <div className="time-upper">4</div>
            <div className="time-lower">4</div>
          </div>

          {/* Staff lines */}
          <div className="staff-lines">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={`line-${line}`} className="staff-line" />
            ))}
          </div>

          {/* Notes */}
          <div className="notes">
            {selectedPattern.notes.map((note, index) => (
              <div
                key={index}
                className={`note ${note.rest ? "rest" : ""} ${
                  note.dotted ? "dotted" : ""
                } ${currentNoteIndex === index ? "active" : ""}`}
                style={{
                  width: `${getNoteWidth(note.value)}px`,
                }}
              >
                <div className="note-symbol">{getNoteSymbol(note)}</div>
                {note.dotted && <div className="dot"></div>}
                {note.text && <div className="note-text">{note.text}</div>}
              </div>
            ))}
          </div>

          {/* Beaming for eighth and sixteenth notes */}
          <div className="beams">
            {getBeamingInfo(selectedPattern.notes).map((beam, index) => (
              <div
                key={index}
                className="beam"
                style={{
                  left: `${120 + beam.start * 60}px`,
                  width: `${(beam.end - beam.start) * 60 + 20}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="legend">
        <h4>Understanding Rhythm Notation</h4>
        <div className="rhythm-symbols">
          <div className="symbol-item">
            <span className="symbol">{noteSymbols["1n"]}</span>
            <span className="label">Whole Note (4 beats)</span>
          </div>
          <div className="symbol-item">
            <span className="symbol">{noteSymbols["2n"]}</span>
            <span className="label">Half Note (2 beats)</span>
          </div>
          <div className="symbol-item">
            <span className="symbol">{noteSymbols["4n"]}</span>
            <span className="label">Quarter Note (1 beat)</span>
          </div>
          <div className="symbol-item">
            <span className="symbol">{noteSymbols["8n"]}</span>
            <span className="label">Eighth Note (½ beat)</span>
          </div>
          <div className="symbol-item">
            <span className="symbol">{noteSymbols["16n"]}</span>
            <span className="label">Sixteenth Note (¼ beat)</span>
          </div>
          <div className="symbol-item">
            <span className="symbol">{restSymbols["4n"]}</span>
            <span className="label">Quarter Rest (1 beat of silence)</span>
          </div>
          <div className="symbol-item">
            <span className="symbol">{noteSymbols["4n"]}.</span>
            <span className="label">Dotted Quarter (1½ beats)</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .pattern-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .select {
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--component-border);
          border-radius: 4px;
          background-color: var(--component-bg);
          color: var(--text-primary);
          cursor: pointer;
        }

        .tempo-control {
          flex: 1;
          min-width: 200px;
        }

        .button.playing {
          background-color: hsl(0 80% 50%);
        }

        .pattern-description {
          background-color: var(--primary-blue-3);
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
          font-size: 0.9rem;
        }

        .notation-display {
          width: 100%;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }

        .staff {
          position: relative;
          height: 120px;
          min-width: 500px;
          padding-top: 20px;
        }

        .clef {
          position: absolute;
          left: 10px;
          top: 0;
          font-size: 5rem;
          line-height: 0;
          color: var(--text-primary);
        }

        .time-signature {
          position: absolute;
          left: 70px;
          top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .staff-lines {
          position: relative;
          height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .staff-line {
          height: 1px;
          width: 100%;
          background-color: var(--text-primary);
        }

        .notes {
          position: absolute;
          top: 20px;
          left: 120px;
          display: flex;
          align-items: flex-end;
          height: 80px;
        }

        .note {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          transition: transform 0.1s ease;
        }

        .note.active {
          transform: scale(1.1);
        }

        .note.active .note-symbol {
          color: var(--primary-blue);
        }

        .note-symbol {
          font-size: 2rem;
          line-height: 1;
          color: var(--text-primary);
        }

        .rest .note-symbol {
          color: var(--text-secondary);
        }

        .dot {
          position: absolute;
          top: 40%;
          right: 0;
          width: 6px;
          height: 6px;
          background-color: var(--text-primary);
          border-radius: 50%;
        }

        .note-text {
          font-size: 0.8rem;
          margin-top: 0.25rem;
          color: var(--text-secondary);
        }

        .beams {
          position: absolute;
          top: 20px;
          left: 0;
          height: 80px;
          width: 100%;
          pointer-events: none;
        }

        .beam {
          position: absolute;
          top: 30px;
          height: 3px;
          background-color: var(--text-primary);
          border-radius: 1px;
        }

        .legend {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .legend h4 {
          margin-top: 0;
          margin-bottom: 0.75rem;
        }

        .rhythm-symbols {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.75rem;
        }

        .symbol-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .symbol {
          font-size: 1.5rem;
          color: var(--text-primary);
        }

        .label {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .rhythm-symbols {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default RhythmNotationExplorer;
