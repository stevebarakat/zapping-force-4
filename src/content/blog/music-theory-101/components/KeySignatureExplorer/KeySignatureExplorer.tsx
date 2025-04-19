import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/Button";
import "./key-signature.css";
import "@/styles/shared/dark-mode.css";
import { Select } from "@/content/blog/shared/Select";
import VisuallyHidden from "@/components/VisuallyHidden";
import { Callout } from "@/components/Callout";
import { InstrumentPlayer } from "../shared/InstrumentPlayer";
import { INSTRUMENT_TYPES } from "@/consts";
import { InstrumentProvider } from "../../lib/contexts/InstrumentContext";

type KeyType = "major" | "minor";
type Note = string;
type KeySignatureCount = number;

interface KeySignatures {
  major: Record<string, KeySignatureCount>;
  minor: Record<string, KeySignatureCount>;
}

interface ScaleNote {
  note: string;
  position: number;
}

const KeySignatureExplorerContent = () => {
  const [selectedKey, setSelectedKey] = useState<string>("C");
  const [keyType, setKeyType] = useState<KeyType>("major");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENT_TYPES.PIANO
  );
  const [octaveRange, setOctaveRange] = useState({ min: 3, max: 5 });

  // Reference to synth
  const synthRef = useRef<Tone.Synth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

  // Define all notes
  const allNotes: Note[] = [
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

  // Define key signature information
  const keySignatures: KeySignatures = {
    major: {
      // Number of sharps or flats for each major key
      // Positive is sharps, negative is flats
      C: 0,
      G: 1,
      D: 2,
      A: 3,
      E: 4,
      B: 5,
      "F#": 6,
      "C#": 7,
      F: -1,
      Bb: -2,
      Eb: -3,
      Ab: -4,
      Db: -5,
      Gb: -6,
      Cb: -7,
    },
    minor: {
      // Number of sharps or flats for each minor key
      A: 0,
      E: 1,
      B: 2,
      "F#": 3,
      "C#": 4,
      "G#": 5,
      "D#": 6,
      "A#": 7,
      D: -1,
      G: -2,
      C: -3,
      F: -4,
      Bb: -5,
      Eb: -6,
      Ab: -7,
    },
  };

  // Order of sharps and flats
  const sharpOrder: Note[] = ["F", "C", "G", "D", "A", "E", "B"];
  const flatOrder: Note[] = ["B", "E", "A", "D", "G", "C", "F"];

  // Initialize audio
  useEffect(() => {
    synthRef.current = new Tone.Synth({
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
      if (loopRef.current) {
        loopRef.current.dispose();
      }
      Tone.Transport.cancel();
      Tone.Transport.stop();
    };
  }, []);

  // Get the number of sharps/flats for the current key
  const getKeySignatureCount = (): KeySignatureCount => {
    // Handle enharmonic keys that aren't in our keySignatures object
    const normalizedKey = normalizeKeyName(selectedKey);
    return keySignatures[keyType][normalizedKey] || 0;
  };

  // Normalize key names (e.g., Db to C#, etc.) for our keySignatures object
  const normalizeKeyName = (key: string): string => {
    // Map enharmonic equivalents
    const enharmonicMap: Record<string, string> = {
      Db: "C#",
      "D#": "Eb",
      Gb: "F#",
      "G#": "Ab",
      "A#": "Bb",
      Bb: "A#",
      Eb: "D#",
      Ab: "G#",
      Cb: "B",
      Fb: "E",
    };

    // Return the normalized key name if it exists, otherwise return the original
    return enharmonicMap[key] || key;
  };

  // Get staff lines with labels
  const getStaffLines = () => {
    return [
      { note: "F5", label: "F" },
      { note: "D5", label: "D" },
      { note: "B4", label: "B" },
      { note: "G4", label: "G" },
      { note: "E4", label: "E" },
    ];
  };

  // Get position class for each accidental based on note
  const getAccidentalPosition = (note: string): string => {
    const notePositions: Record<string, string> = {
      F: "note-position-F5",
      C: "note-position-C5",
      G: "note-position-G4",
      D: "note-position-D5",
      A: "note-position-A4",
      E: "note-position-E5",
      B: "note-position-B4",
    };
    return notePositions[note] || "";
  };

  // Get altered notes with their positions
  const getAlteredNotes = () => {
    const count = getKeySignatureCount();
    const altered = [];
    const order = count > 0 ? sharpOrder : flatOrder;
    const accidental = count > 0 ? "#" : "b";
    const absCount = Math.abs(count);

    for (let i = 0; i < absCount; i++) {
      altered.push({
        note: order[i],
        accidental,
        position: getAccidentalPosition(order[i]),
      });
    }

    return altered;
  };

  // Generate scale notes for the current key
  const generateScaleNotes = (): ScaleNote[] => {
    // Define scale patterns (intervals from root)
    const scalePatterns: Record<KeyType, number[]> = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12], // Natural minor
    };

    const pattern = scalePatterns[keyType];
    const normalizedKey = normalizeKeyName(selectedKey);
    const rootIndex = allNotes.indexOf(normalizedKey);

    return pattern.map((interval: number, index: number) => {
      // Calculate the absolute note index, handling octave transitions
      const noteIndex = (rootIndex + interval) % 12;
      // Determine if we need to increment the octave based on the interval
      const octaveIncrement = Math.floor((rootIndex + interval) / 12);
      const octave = 4 + octaveIncrement;

      return {
        note: `${allNotes[noteIndex]}${octave}`,
        position: interval,
      };
    });
  };

  // Play the scale
  const playScale = async () => {
    if (isPlaying) return;

    // Make sure Tone.js is ready
    await Tone.start();
    setIsPlaying(true);

    const scaleNotes = generateScaleNotes();
    let currentIndex = 0;
    let isGoingUp = true;

    // Create a loop to play the scale
    loopRef.current = new Tone.Loop((time) => {
      // Play the current note
      if (synthRef.current) {
        synthRef.current.triggerAttackRelease(
          scaleNotes[currentIndex].note,
          "8n",
          time
        );
      }

      // Update current note for visualization
      setCurrentNote(currentIndex);

      // Move to next note
      if (isGoingUp) {
        currentIndex++;
        // If we've reached the top, start going down
        if (currentIndex >= scaleNotes.length) {
          isGoingUp = false;
          currentIndex = scaleNotes.length - 1;
        }
      } else {
        currentIndex--;
        // If we've reached the bottom, stop the loop
        if (currentIndex < 0) {
          // Update visualization one last time before stopping
          setCurrentNote(0);
          if (loopRef.current) {
            loopRef.current.stop();
          }
          setIsPlaying(false);
        }
      }
    }, "4n");

    // Start the loop
    Tone.Transport.start();
    if (loopRef.current) {
      loopRef.current.start(0);
    }
  };

  // Stop playing the scale
  const stopScale = () => {
    if (!isPlaying) return;

    // Clear any scheduled events
    Tone.Transport.cancel();

    Tone.Transport.stop();
    if (loopRef.current) {
      loopRef.current.stop();
    }
    setIsPlaying(false);
    setCurrentNote(null);
  };

  // Get the relative key (major to minor or minor to major)
  const getRelativeKey = (): string => {
    // Find the index of the current key
    const currentKeyIndex = allNotes.indexOf(selectedKey);

    if (keyType === "major") {
      // Relative minor is 3 semitones below major
      const relativeMinorIndex = (currentKeyIndex + 9) % 12;
      return `${allNotes[relativeMinorIndex]} minor`;
    } else {
      // Relative major is 3 semitones above minor
      const relativeMajorIndex = (currentKeyIndex + 3) % 12;
      return `${allNotes[relativeMajorIndex]} major`;
    }
  };

  // Get parallel key (same tonic, but major <-> minor)
  const getParallelKey = (): string => {
    return `${selectedKey} ${keyType === "major" ? "minor" : "major"}`;
  };

  // Find keys with the same key signature (enharmonic equivalents)
  const getEnharmonicKey = (): string | null => {
    const count = getKeySignatureCount();

    // Special cases for enharmonic equivalents
    const enharmonicMap: Record<string, string> = {
      "C#": "Db",
      Db: "C#",
      "F#": "Gb",
      Gb: "F#",
      B: "Cb",
      Cb: "B",
      E: "Fb",
      Fb: "E",
    };

    return enharmonicMap[selectedKey]
      ? `${enharmonicMap[selectedKey]} ${keyType}`
      : null;
  };

  // Get scale notes with proper enharmonic spelling
  const getNotesWithEnharmonicSpelling = (): string[] => {
    // We need to handle enharmonic spelling based on the key
    // For example, in C# major, we spell notes as C#, D#, E#, F#, G#, A#, B#
    // But in Db major, we spell notes as Db, Eb, F, Gb, Ab, Bb, C

    // For simplicity, we'll just use the pattern-based notes from generateScaleNotes
    return generateScaleNotes().map((note: ScaleNote) =>
      note.note.slice(0, -1)
    ); // Remove octave
  };

  // Current scale notes
  const scaleNotes = generateScaleNotes();

  // Convert keys to options array
  const keyOptions = [
    "C",
    "G",
    "D",
    "A",
    "E",
    "B",
    "F#",
    "C#",
    "F",
    "Bb",
    "Eb",
    "Ab",
    "Db",
    "Gb",
    "Cb",
  ].map((key) => ({
    value: key,
    label: key,
  }));

  // Get active keys for visualization
  const getActiveKeys = () => {
    if (currentNote === null) return [];
    const scaleNotes = generateScaleNotes();
    return [scaleNotes[currentNote].note];
  };

  return (
    <>
      <div className="demo-container">
        <VisuallyHidden>Key Signature Explorer</VisuallyHidden>

        <div className="controls">
          <Select
            value={selectedKey}
            onChange={(value: string) => setSelectedKey(value)}
            label="Key"
            disabled={isPlaying}
          >
            {keyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={keyType}
            onChange={(value: string) => setKeyType(value as KeyType)}
            label="Type"
            disabled={isPlaying}
          >
            <option value="major">Major</option>
            <option value="minor">Minor</option>
          </Select>
        </div>

        {/* Progression pattern and description */}
        <div className="info-box">
          <div className="progression-description">
            {selectedKey} {keyType}: {Math.abs(getKeySignatureCount())}{" "}
            {getKeySignatureCount() > -1
              ? "sharp"
              : getKeySignatureCount() < 0
              ? "flat"
              : ""}
            {Math.abs(getKeySignatureCount()) !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Related keys */}
        <div className="related-keys">
          <div className="related-key">
            <div className="related-key-title">Relative Key:</div>
            <div className="related-key-value">{getRelativeKey()}</div>
          </div>

          <div className="related-key">
            <div className="related-key-title">Parallel Key:</div>
            <div className="related-key-value">{getParallelKey()}</div>
          </div>

          {getEnharmonicKey() && (
            <div className="related-key">
              <div className="related-key-title">Enharmonic Equivalent:</div>
              <div className="related-key-value">{getEnharmonicKey()}</div>
            </div>
          )}
        </div>

        {/* Instrument Player */}
        <InstrumentPlayer
          instrumentType={selectedInstrument}
          octaveRange={octaveRange}
          showLabels={true}
          activeKeys={getActiveKeys()}
          onInstrumentChange={(instrument) => {
            setSelectedInstrument(instrument);
          }}
          onOctaveRangeChange={(newRange) => setOctaveRange(newRange)}
        />

        {/* Play button */}
        <Button onClick={isPlaying ? stopScale : playScale}>
          {isPlaying ? "Stop" : "Play Scale"}
        </Button>
      </div>
      <Callout type="instructions" title="Explore key signatures">
        Select a key to see its signature and hear the corresponding scale.
      </Callout>
    </>
  );
};

const KeySignatureExplorer = () => {
  return (
    <InstrumentProvider>
      <KeySignatureExplorerContent />
    </InstrumentProvider>
  );
};

export default KeySignatureExplorer;
