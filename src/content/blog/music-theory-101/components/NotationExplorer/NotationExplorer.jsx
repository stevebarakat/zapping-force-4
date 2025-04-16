import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/Button";
import "./key-signature.css";
import "@/content/blog/shared/dark-mode.css";
import { Select } from "@/content/blog/shared/Select";
import VisuallyHidden from "@/components/VisuallyHidden";
const KeySignatureExplorer = () => {
  const [selectedKey, setSelectedKey] = useState("C");
  const [keyType, setKeyType] = useState("major");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);

  // Reference to synth
  const synthRef = useRef(null);
  const sequenceRef = useRef(null);

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

  // Define key signature information
  const keySignatures = {
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
  const sharpOrder = ["F", "C", "G", "D", "A", "E", "B"];
  const flatOrder = ["B", "E", "A", "D", "G", "C", "F"];

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
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      Tone.Transport.cancel();
      Tone.Transport.stop();
    };
  }, []);

  // Get the number of sharps/flats for the current key
  const getKeySignatureCount = () => {
    // Handle enharmonic keys that aren't in our keySignatures object
    const normalizedKey = normalizeKeyName(selectedKey);
    return keySignatures[keyType][normalizedKey] || 0;
  };

  // Normalize key names (e.g., Db to C#, etc.) for our keySignatures object
  const normalizeKeyName = (key) => {
    // Map enharmonic equivalents
    const enharmonicMap = {
      Db: "C#",
      "D#": "Eb",
      Gb: "F#",
      "G#": "Ab",
      "A#": "Bb",
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
  const getAccidentalPosition = (note) => {
    const notePositions = {
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
  const generateScaleNotes = () => {
    // Define scale patterns (intervals from root)
    const scalePatterns = {
      major: [0, 2, 4, 5, 7, 9, 11, 12],
      minor: [0, 2, 3, 5, 7, 8, 10, 12], // Natural minor
    };

    const pattern = scalePatterns[keyType];
    const rootIndex = allNotes.indexOf(selectedKey);

    return pattern.map((interval) => {
      const noteIndex = (rootIndex + interval) % 12;
      return {
        note: `${allNotes[noteIndex]}4`,
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

    // Create a sequence to play each note
    sequenceRef.current = new Tone.Sequence(
      (time, index) => {
        // Update current note for visualization
        setCurrentNote(index);

        // Play the note
        synthRef.current.triggerAttackRelease(
          scaleNotes[index].note,
          "8n",
          time
        );
      },
      [...Array(scaleNotes.length).keys()],
      "8n"
    );

    // Start the sequence
    Tone.Transport.start();
    sequenceRef.current.start(0);

    // Stop after playing through once
    Tone.Transport.schedule(() => {
      stopScale();
    }, `+${scaleNotes.length * 0.5}s`);
  };

  // Stop playing the scale
  const stopScale = () => {
    if (!isPlaying) return;

    Tone.Transport.stop();
    if (sequenceRef.current) {
      sequenceRef.current.stop();
    }
    setIsPlaying(false);
    setCurrentNote(null);
  };

  // Get the relative key (major to minor or minor to major)
  const getRelativeKey = () => {
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
  const getParallelKey = () => {
    return `${selectedKey} ${keyType === "major" ? "minor" : "major"}`;
  };

  // Find keys with the same key signature (enharmonic equivalents)
  const getEnharmonicKey = () => {
    const count = getKeySignatureCount();

    // Special cases for enharmonic equivalents
    const enharmonicMap = {
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
  const getNotesWithEnharmonicSpelling = () => {
    // We need to handle enharmonic spelling based on the key
    // For example, in C# major, we spell notes as C#, D#, E#, F#, G#, A#, B#
    // But in Db major, we spell notes as Db, Eb, F, Gb, Ab, Bb, C

    // For simplicity, we'll just use the pattern-based notes from generateScaleNotes
    return generateScaleNotes().map((note) => note.note.slice(0, -1)); // Remove octave
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

  return (
    <div className="demo-container">
      <VisuallyHidden>Key Signature Explorer</VisuallyHidden>

      <div className="controls">
        <Select
          value={selectedKey}
          onChange={setSelectedKey}
          label="Key:"
          className="small"
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
          onChange={setKeyType}
          label="Type:"
          className="small"
          disabled={isPlaying}
        >
          <option value="major">Major</option>
          <option value="minor">Minor</option>
        </Select>
      </div>

      {/* Key signature visualization */}
      <div className="music-theory-component">
        <h4 className="key-title">
          {selectedKey} {keyType}: {Math.abs(getKeySignatureCount())}{" "}
          {getKeySignatureCount() > 0
            ? "sharp"
            : getKeySignatureCount() < 0
            ? "flat"
            : ""}
          {Math.abs(getKeySignatureCount()) !== 1 ? "s" : ""}
        </h4>

        {/* Staff representation */}
        <div className="staff-container">
          {/* Staff lines with labels */}
          {getStaffLines().map((line, index) => (
            <React.Fragment key={index}>
              <div
                className="staff-line"
                style={{ top: `${40 + index * 15}px` }}
              />
              <div
                className="staff-line-label"
                style={{ top: `${40 + index * 15}px` }}
              >
                {line.label}
              </div>
            </React.Fragment>
          ))}

          {/* Clef */}
          <div className="clef">𝄞</div>

          {/* Key signature */}
          <div className="key-signature">
            {getAlteredNotes().map((note, index) => (
              <div
                key={index}
                className={`accidental ${note.position}`}
                style={{ left: `${index * 1.25}rem` }}
              >
                {note.accidental === "#" ? "♯" : "♭"}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scale visualization */}
      <div className="scale-notes">
        {scaleNotes.map((note, index) => (
          <div
            key={index}
            className={`scale-note ${currentNote === index ? "selected" : ""}`}
          >
            {note.note.slice(0, -1)}
          </div>
        ))}
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

      {/* Play button */}
      <Button onClick={isPlaying ? stopScale : playScale}>
        {isPlaying ? "Stop" : "Play Scale"}
      </Button>

      <div className="info-box">
        Key signatures indicate which notes should be played as sharps or flats
        throughout a piece, establishing the tonal center and scale being used.
      </div>
    </div>
  );
};

export default KeySignatureExplorer;
