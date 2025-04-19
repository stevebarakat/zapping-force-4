import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Music, Play, Trash2, Eraser, Plus } from "lucide-react";

type Note = {
  id: string;
  name: string;
  position: number;
  x: number; // x position on staff
  frequency: number;
};

const STAFF_HEIGHT = 200;
const LINE_SPACING = 20;
const POSITION_OFFSET = 40; // Vertical offset for the first line
const NOTE_WIDTH = 20;

function InteractiveStaff() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedClef, setSelectedClef] = useState<"treble" | "bass">("treble");
  const [isErasing, setIsErasing] = useState(false);

  const staffRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<Tone.Synth | null>(null);

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
    };
  }, []);

  // Define note mapping based on position and clef
  function getNoteNameFromPosition(
    position: number,
    clef: "treble" | "bass"
  ): string {
    const trebleClefNotes = [
      "F5",
      "E5",
      "D5",
      "C5",
      "B4",
      "A4",
      "G4",
      "F4",
      "E4",
      "D4",
      "C4",
      "B3",
      "A3",
      "G3",
      "F3",
      "E3",
    ];

    const bassClefNotes = [
      "A3",
      "G3",
      "F3",
      "E3",
      "D3",
      "C3",
      "B2",
      "A2",
      "G2",
      "F2",
      "E2",
      "D2",
      "C2",
      "B1",
      "A1",
      "G1",
    ];

    const notesArray = clef === "treble" ? trebleClefNotes : bassClefNotes;
    const index = Math.floor((position - POSITION_OFFSET) / (LINE_SPACING / 2));

    if (index >= 0 && index < notesArray.length) {
      return notesArray[index];
    }

    // Default to middle C if out of range
    return "C4";
  }

  // Get frequency from note name
  function getFrequencyFromNoteName(noteName: string): number {
    const noteToFreq: Record<string, number> = {
      C1: 32.7,
      "C#1": 34.65,
      D1: 36.71,
      "D#1": 38.89,
      E1: 41.2,
      F1: 43.65,
      "F#1": 46.25,
      G1: 49.0,
      "G#1": 51.91,
      A1: 55.0,
      "A#1": 58.27,
      B1: 61.74,
      C2: 65.41,
      "C#2": 69.3,
      D2: 73.42,
      "D#2": 77.78,
      E2: 82.41,
      F2: 87.31,
      "F#2": 92.5,
      G2: 98.0,
      "G#2": 103.83,
      A2: 110.0,
      "A#2": 116.54,
      B2: 123.47,
      C3: 130.81,
      "C#3": 138.59,
      D3: 146.83,
      "D#3": 155.56,
      E3: 164.81,
      F3: 174.61,
      "F#3": 185.0,
      G3: 196.0,
      "G#3": 207.65,
      A3: 220.0,
      "A#3": 233.08,
      B3: 246.94,
      C4: 261.63,
      "C#4": 277.18,
      D4: 293.66,
      "D#4": 311.13,
      E4: 329.63,
      F4: 349.23,
      "F#4": 369.99,
      G4: 392.0,
      "G#4": 415.3,
      A4: 440.0,
      "A#4": 466.16,
      B4: 493.88,
      C5: 523.25,
      "C#5": 554.37,
      D5: 587.33,
      "D#5": 622.25,
      E5: 659.25,
      F5: 698.46,
      "F#5": 739.99,
      G5: 783.99,
      "G#5": 830.61,
      A5: 880.0,
      "A#5": 932.33,
      B5: 987.77,
    };

    return noteToFreq[noteName] || 440;
  }

  // Handle staff click
  function handleStaffClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!staffRef.current) return;

    // Get click coordinates relative to staff
    const rect = staffRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Quantize y position to nearest staff position (line or space)
    const position =
      Math.round((y - LINE_SPACING / 4) / (LINE_SPACING / 2)) *
        (LINE_SPACING / 2) +
      LINE_SPACING / 4;

    // If erasing mode is on, look for notes near the click and remove them
    if (isErasing) {
      const noteIndex = notes.findIndex(
        (note) =>
          Math.abs(note.x - x) < NOTE_WIDTH &&
          Math.abs(note.position - position) < LINE_SPACING
      );

      if (noteIndex !== -1) {
        setNotes(notes.filter((_, i) => i !== noteIndex));
      }
      return;
    }

    // Check if a note already exists at this position
    const existingNoteIndex = notes.findIndex(
      (note) =>
        Math.abs(note.x - x) < NOTE_WIDTH &&
        Math.abs(note.position - position) < LINE_SPACING
    );

    if (existingNoteIndex !== -1) {
      // Remove the note if it exists (toggle behavior)
      setNotes(notes.filter((_, i) => i !== existingNoteIndex));
      return;
    }

    // Get note name for this position
    const noteName = getNoteNameFromPosition(position, selectedClef);
    const frequency = getFrequencyFromNoteName(noteName);

    // Add the new note
    const newNote: Note = {
      id: `note-${Date.now()}`,
      name: noteName,
      position,
      x,
      frequency,
    };

    setNotes([...notes, newNote]);

    // Play the note
    playNote(newNote);
  }

  // Play a single note
  function playNote(note: Note) {
    if (!synthRef.current) return;

    try {
      synthRef.current.triggerAttackRelease(note.name, "8n");
    } catch (error) {
      console.error("Error playing note:", error);
    }
  }

  // Play all notes in sequence
  async function playAllNotes() {
    if (isPlaying || notes.length === 0 || !synthRef.current) return;

    setIsPlaying(true);

    try {
      // Ensure audio context is running
      await Tone.start();

      // Sort notes by x position (left to right)
      const sortedNotes = [...notes].sort((a, b) => a.x - b.x);

      // Play each note with a small delay
      for (let i = 0; i < sortedNotes.length; i++) {
        const note = sortedNotes[i];

        // Highlight the current note
        const noteElement = document.getElementById(note.id);
        if (noteElement) {
          noteElement.classList.add("playing");
        }

        // Play the note
        synthRef.current.triggerAttackRelease(note.name, "8n");

        // Wait for the note to finish
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Remove highlight
        if (noteElement) {
          noteElement.classList.remove("playing");
        }
      }
    } catch (error) {
      console.error("Error playing notes:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  // Clear all notes
  function clearNotes() {
    setNotes([]);
  }

  // Toggle erase mode
  function toggleEraseMode() {
    setIsErasing(!isErasing);
  }

  // Toggle clef
  function toggleClef() {
    setSelectedClef(selectedClef === "treble" ? "bass" : "treble");
  }

  // Render ledger lines if needed
  function renderLedgerLines(note: Note) {
    const ledgerLines = [];
    const staffTopLine = POSITION_OFFSET;
    const staffBottomLine = POSITION_OFFSET + LINE_SPACING * 4;

    // Add ledger lines above the staff
    if (note.position < staffTopLine) {
      for (
        let pos = staffTopLine - LINE_SPACING;
        pos >= note.position - LINE_SPACING / 2;
        pos -= LINE_SPACING
      ) {
        ledgerLines.push(
          <div
            key={`ledger-top-${pos}`}
            className="ledger-line"
            style={{
              top: `${pos}px`,
              left: `${note.x - NOTE_WIDTH}px`,
              width: `${NOTE_WIDTH * 2}px`,
            }}
          />
        );
      }
    }

    // Add ledger lines below the staff
    if (note.position > staffBottomLine) {
      for (
        let pos = staffBottomLine + LINE_SPACING;
        pos <= note.position + LINE_SPACING / 2;
        pos += LINE_SPACING
      ) {
        ledgerLines.push(
          <div
            key={`ledger-bottom-${pos}`}
            className="ledger-line"
            style={{
              top: `${pos}px`,
              left: `${note.x - NOTE_WIDTH}px`,
              width: `${NOTE_WIDTH * 2}px`,
            }}
          />
        );
      }
    }

    return ledgerLines;
  }

  return (
    <div className="demo-container">
      <h3 className="component-title">Interactive Staff</h3>

      <div className="controls">
        <button
          className="button"
          onClick={playAllNotes}
          disabled={isPlaying || notes.length === 0}
        >
          <Play size={16} />
          {isPlaying ? "Playing..." : "Play Notes"}
        </button>

        <button
          className={`button ${isErasing ? "active" : ""}`}
          onClick={toggleEraseMode}
        >
          <Eraser size={16} />
          {isErasing ? "Cancel Erasing" : "Erase Notes"}
        </button>

        <button className="button" onClick={clearNotes}>
          <Trash2 size={16} />
          Clear All
        </button>

        <button className="button" onClick={toggleClef}>
          <Plus size={16} />
          Switch to {selectedClef === "treble" ? "Bass" : "Treble"} Clef
        </button>
      </div>

      <div className="staff-container">
        <div
          ref={staffRef}
          className={`staff ${isErasing ? "erasing" : ""}`}
          onClick={handleStaffClick}
        >
          {/* Clef symbol */}
          <div className="clef">{selectedClef === "treble" ? "𝄞" : "𝄢"}</div>

          {/* Staff lines */}
          <div className="staff-lines">
            {[0, 1, 2, 3, 4].map((line) => (
              <div
                key={`line-${line}`}
                className="staff-line"
                style={{ top: `${POSITION_OFFSET + line * LINE_SPACING}px` }}
              />
            ))}
          </div>

          {/* Notes */}
          <div className="notes">
            {notes.map((note) => (
              <React.Fragment key={note.id}>
                {/* Render ledger lines if needed */}
                {renderLedgerLines(note)}

                {/* Note head */}
                <div
                  id={note.id}
                  className="note"
                  style={{
                    top: `${note.position - NOTE_WIDTH / 2}px`,
                    left: `${note.x - NOTE_WIDTH / 2}px`,
                  }}
                  title={note.name}
                >
                  <div className="note-stem"></div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="info-panel">
          <h4>Instructions:</h4>
          <p>
            Click anywhere on the staff to place a note. Click on an existing
            note to remove it.
          </p>
          <p>
            Use the buttons above to switch clefs, play your melody, or clear
            the staff.
          </p>

          {notes.length > 0 && (
            <div className="note-list">
              <h4>Notes (left to right):</h4>
              <div className="note-tags">
                {[...notes]
                  .sort((a, b) => a.x - b.x)
                  .map((note) => (
                    <span key={note.id} className="note-tag">
                      {note.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .button.active {
          background-color: hsl(0 80% 50%);
        }

        .staff-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .staff {
          position: relative;
          height: ${STAFF_HEIGHT}px;
          width: 100%;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 8px;
          padding: 1rem;
          cursor: crosshair;
        }

        .staff.erasing {
          cursor: not-allowed;
        }

        .clef {
          position: absolute;
          left: 20px;
          top: ${POSITION_OFFSET - 30}px;
          font-size: 6rem;
          line-height: 0;
          color: var(--text-primary);
          z-index: 2;
        }

        .staff-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background-color: var(--text-primary);
        }

        .ledger-line {
          position: absolute;
          height: 2px;
          background-color: var(--text-primary);
        }

        .note {
          position: absolute;
          width: ${NOTE_WIDTH}px;
          height: ${NOTE_WIDTH}px;
          background-color: var(--text-primary);
          border-radius: 50%;
          z-index: 3;
          transition: transform 0.1s ease;
        }

        .note.playing {
          transform: scale(1.2);
          background-color: var(--primary-blue);
        }

        .note-stem {
          position: absolute;
          top: -40px;
          right: 0;
          width: 2px;
          height: 40px;
          background-color: var(--text-primary);
        }

        .info-panel {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .info-panel h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .info-panel p {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .note-list {
          margin-top: 1rem;
        }

        .note-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .note-tag {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          background-color: var(--primary-blue);
          color: white;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        @media (min-width: 768px) {
          .staff-container {
            flex-direction: row;
          }

          .staff {
            flex: 2;
          }

          .info-panel {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default InteractiveStaff;
