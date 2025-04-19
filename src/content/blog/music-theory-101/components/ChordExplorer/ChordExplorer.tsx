import React, { useState, useEffect, useRef, type RefObject } from "react";
import * as Tone from "tone";
import { InstrumentPlayer } from "../shared/InstrumentPlayer";
import { INSTRUMENT_TYPES } from "@/consts";
import "./chord-explorer.css";
import "@/content/blog/shared/dark-mode.css";
import VisuallyHidden from "@/components/VisuallyHidden";
import { Button } from "@/components/Button";
import type { InstrumentPlayerRef } from "../IntervalExplorer/types";
import { Select } from "@/content/blog/shared/Select";

const ChordExplorer = () => {
  const [rootNote, setRootNote] = useState("C");
  const [chordType, setChordType] = useState("major");
  const [octave, setOctave] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENT_TYPES.PIANO
  );
  const [octaveRange, setOctaveRange] = useState({ min: 4, max: 5 });

  // Reference to synth
  const synthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);
  // Reference to the keyboard component
  const keyboardRef = useRef<{
    playNote: (noteId: string) => void;
    playNotes: (noteIds: string[]) => void;
    isNoteAvailable?: (note: string) => boolean;
  } | null>(null);

  // Define all notes
  const allNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  // Define chord types with their intervals and descriptions
  const chordTypes = {
    major: {
      name: "Major Triad",
      intervals: [0, 4, 7],
      symbol: "",
      description: "Bright and happy sounding. The most common chord type.",
    },
    minor: {
      name: "Minor Triad",
      intervals: [0, 3, 7],
      symbol: "m",
      description: "Sad or melancholic sounding. Common in emotional music.",
    },
    diminished: {
      name: "Diminished Triad",
      intervals: [0, 3, 6],
      symbol: "dim",
      description: "Tense and unstable sounding. Often creates dissonance.",
    },
    augmented: {
      name: "Augmented Triad",
      intervals: [0, 4, 8],
      symbol: "aug",
      description: "Unresolved, dreamy quality. Used for tension.",
    },
    sus2: {
      name: "Suspended 2nd",
      intervals: [0, 2, 7],
      symbol: "sus2",
      description: "Open, unresolved sound. Neither major nor minor.",
    },
    sus4: {
      name: "Suspended 4th",
      intervals: [0, 5, 7],
      symbol: "sus4",
      description: "Ambiguous, waiting to resolve. Common in rock.",
    },
    7: {
      name: "Dominant 7th",
      intervals: [0, 4, 7, 10],
      symbol: "7",
      description: "Bluesy, unresolved sound. Wants to resolve to the I chord.",
    },
    maj7: {
      name: "Major 7th",
      intervals: [0, 4, 7, 11],
      symbol: "maj7",
      description: "Jazzy, sophisticated sound. Common in jazz and pop.",
    },
    min7: {
      name: "Minor 7th",
      intervals: [0, 3, 7, 10],
      symbol: "m7",
      description: "Moody, jazzy sound. Common in jazz, soul, and R&B.",
    },
    dim7: {
      name: "Diminished 7th",
      intervals: [0, 3, 6, 9],
      symbol: "dim7",
      description: "Very tense, unstable sound. Used for dramatic effect.",
    },
    "7sus4": {
      name: "7sus4",
      intervals: [0, 5, 7, 10],
      symbol: "7sus4",
      description: "Jazzy, unresolved sound. Common in funk and jazz.",
    },
    6: {
      name: "Major 6th",
      intervals: [0, 4, 7, 9],
      symbol: "6",
      description: "Happy, jazzy sound. Popular in jazz standards.",
    },
    m6: {
      name: "Minor 6th",
      intervals: [0, 3, 7, 9],
      symbol: "m6",
      description: "Jazzy, slightly melancholic. Used in jazz and soul.",
    },
    add9: {
      name: "Add 9",
      intervals: [0, 4, 7, 14],
      symbol: "add9",
      description: "Bright and colorful. Adds flavor without being jazzy.",
    },
    9: {
      name: "Dominant 9th",
      intervals: [0, 4, 7, 10, 14],
      symbol: "9",
      description: "Rich, full jazz sound. More complex than dominant 7th.",
    },
  };

  // Initialize synth
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  // Get chord notes from the selected root and type
  const calculateChordNotes = () => {
    const rootIndex = allNotes.indexOf(rootNote);
    return chordTypes[chordType as keyof typeof chordTypes].intervals.map(
      (interval: number) => {
        const noteIndex = (rootIndex + interval) % 12;
        const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
        return `${allNotes[noteIndex]}${noteOctave}`;
      }
    );
  };
  // Handlers for user input
  const handleRootChange = (note: string) => {
    setRootNote(note);
  };

  const handleChordTypeChange = (type: string) => {
    setChordType(type);
  };

  const handleOctaveChange = (newOctave: number) => {
    // Keep octave within reasonable limits
    if (newOctave >= 0 && newOctave <= 8) {
      setOctave(newOctave);
    }
  };

  // Handle instrument change
  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInstrument(e.target.value);
  };

  // Handle octave range change
  const handleOctaveRangeChange = (type: string, value: string) => {
    if (type === "min") {
      // Ensure min doesn't exceed max
      const newMin = parseInt(value);
      if (newMin <= octaveRange.max) {
        setOctaveRange({ ...octaveRange, min: newMin });
      }
    } else {
      // Ensure max isn't below min
      const newMax = parseInt(value);
      if (newMax >= octaveRange.min) {
        setOctaveRange({ ...octaveRange, max: newMax });
      }
    }
  };

  // Play the chord on click
  const playChord = async () => {
    if (isPlaying) return;

    const chordNotes = calculateChordNotes();
    setIsPlaying(true);

    try {
      // Get the keyboard instance from the ref
      if (keyboardRef.current) {
        keyboardRef.current.playNotes(chordNotes);
      }

      // Reset play state after a delay
      setTimeout(() => {
        setIsPlaying(false);
      }, 1500);
    } catch (error) {
      console.error("Error playing chord:", error);
      setIsPlaying(false);
    }
  };

  // Format the chord symbol for display
  const formatChordSymbol = () => {
    return `${rootNote}${
      chordTypes[chordType as keyof typeof chordTypes].symbol
    }`;
  };

  // Convert chord types to options array
  const chordTypeOptions = Object.entries(chordTypes).map(([key, chord]) => ({
    value: key,
    label: `${chord.name} (${key === "major" ? "Major" : chord.symbol})`,
  }));

  // Convert all notes to options array
  const rootNoteOptions = allNotes.map((note) => ({
    value: note,
    label: note,
  }));

  return (
    <div className="demo-container">
      <VisuallyHidden as="h3">Chord Explorer</VisuallyHidden>
      <div className="flex between">
        <Select
          value={chordType}
          onChange={handleChordTypeChange}
          label="Chord Type"
        >
          {chordTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={rootNote} onChange={handleRootChange} label="Root Note">
          {rootNoteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {/* Play button */}
        <Button onClick={playChord} disabled={isPlaying}>
          {isPlaying ? "Playing..." : "Play Chord"}
        </Button>
      </div>

      {/* Chord Information */}
      <div className="chord-info">
        <header>
          <h4 className="chord-name flex between">
            <span>{formatChordSymbol()}</span>
            <span>{chordTypes[chordType as keyof typeof chordTypes].name}</span>
          </h4>
        </header>
        <div>
          <div className="flex-col">
            <span className="description-label">Description:</span>
            <span className="chord-description">
              {chordTypes[chordType as keyof typeof chordTypes].description}
            </span>
          </div>
          <div className="flex">
            <div className="chord-intervals">
              <div className="intervals-label">Chord Notes:</div>
              <div className="flex gap-4 start">
                {calculateChordNotes().map((note, index) => (
                  <span key={index} className="interval-item">
                    {note}
                  </span>
                ))}
              </div>
            </div>

            <div className="chord-intervals">
              <div className="intervals-label">
                Intervals <span className="small">(semitones)</span>:
              </div>
              <div className="flex gap-4 start">
                <span className="interval-item">Root</span>
                {chordTypes[chordType as keyof typeof chordTypes].intervals
                  .slice(1)
                  .map((interval: number, index: number) => (
                    <span key={index} className="interval-item">
                      {interval === 2
                        ? "+2"
                        : interval === 3
                        ? "+3"
                        : interval === 4
                        ? "+4"
                        : interval === 5
                        ? "+5"
                        : interval === 6
                        ? "+6"
                        : interval === 7
                        ? "+7"
                        : interval === 8
                        ? "+8"
                        : interval === 9
                        ? "+9"
                        : interval === 10
                        ? "+10"
                        : interval === 11
                        ? "+11"
                        : interval === 14
                        ? "+14"
                        : `+${interval}`}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <InstrumentPlayer
        ref={keyboardRef as RefObject<InstrumentPlayerRef>}
        instrumentType={selectedInstrument}
        octaveRange={octaveRange}
        highlightedKeys={calculateChordNotes()}
      />
    </div>
  );
};

export default ChordExplorer;
