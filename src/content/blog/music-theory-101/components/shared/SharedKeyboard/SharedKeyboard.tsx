import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useInstrument } from "../../../lib/hooks/useInstrument";
import { INSTRUMENT_TYPES } from "@/consts";
import "./shared-keyboard.css";

// Define available notes for each instrument
const AVAILABLE_NOTES = {
  [INSTRUMENT_TYPES.PIANO]: null, // All notes available
  [INSTRUMENT_TYPES.SYNTH]: null, // All notes available
  [INSTRUMENT_TYPES.XYLO]: [
    // F4-B4
    "F4",
    "F#4",
    "G4",
    "G#4",
    "A4",
    "A#4",
    "B4",
    // All notes in octaves 5-7
    ...[5, 6, 7].flatMap((octave) =>
      ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
        (note) => `${note}${octave}`
      )
    ),
    // C8
    "C8",
  ],
  [INSTRUMENT_TYPES.FLUTE]: [
    // B3
    "B3",
    // All notes in octaves 4-6
    ...[4, 5, 6].flatMap((octave) =>
      ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
        (note) => `${note}${octave}`
      )
    ),
    // C#7
    "C#7",
  ],
  [INSTRUMENT_TYPES.VIOLIN]: [
    // G#3-B3
    "G#3",
    "A3",
    "A#3",
    "B3",
    // All notes in octaves 4-6
    ...[4, 5, 6].flatMap((octave) =>
      ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
        (note) => `${note}${octave}`
      )
    ),
    // C7-E7
    "C7",
    "C#7",
    "D7",
    "D#7",
    "E7",
  ],
  [INSTRUMENT_TYPES.CELLO]: [
    // All notes in octaves 2-4
    ...[2, 3, 4].flatMap((octave) =>
      ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
        (note) => `${note}${octave}`
      )
    ),
    // C5-A5
    "C5",
    "C#5",
    "D5",
    "D#5",
    "E5",
    "F5",
    "F#5",
    "G5",
    "G#5",
    "A5",
  ],
  [INSTRUMENT_TYPES.HORN]: [
    // A#1-B1
    "A#1",
    "B1",
    // All notes in octaves 2-4
    ...[2, 3, 4].flatMap((octave) =>
      ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map(
        (note) => `${note}${octave}`
      )
    ),
    // C5-F5
    "C5",
    "C#5",
    "D5",
    "D#5",
    "E5",
    "F5",
  ],
};

export type SharedKeyboardRef = {
  playNote: (note: string) => void;
  isNoteAvailable: (note: string) => boolean;
};

interface SharedKeyboardProps {
  activeKeys?: string[];
  highlightedKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyClick?: (note: string) => void;
  showLabels?: boolean;
  instrumentType?: string;
  showOctaves: boolean;
}

const SharedKeyboard = forwardRef<SharedKeyboardRef, SharedKeyboardProps>(
  (
    {
      activeKeys = [],
      highlightedKeys = [],
      octaveRange = { min: 4, max: 5 },
      onKeyClick = () => {},
      showLabels = true,
      instrumentType = INSTRUMENT_TYPES.PIANO,
      showOctaves = false,
    },
    ref
  ) => {
    const {
      currentInstrument,
      isLoading,
      error: instrumentError,
      loadInstrument,
      playNote: contextPlayNote,
      initializeAudio,
      isAudioInitialized,
      isSamplerReady,
    } = useInstrument();

    const [hoveredBlackKey, setHoveredBlackKey] = useState<string | null>(null);
    const [availableNotes, setAvailableNotes] = useState<string[] | null>(null);

    // Update available notes when instrument type changes
    useEffect(() => {
      setAvailableNotes(
        AVAILABLE_NOTES[instrumentType as keyof typeof AVAILABLE_NOTES]
      );
    }, [instrumentType]);

    // Initialize audio when component mounts
    useEffect(() => {
      if (!isAudioInitialized) {
        initializeAudio();
      }
    }, [isAudioInitialized, initializeAudio]);

    // Load instrument when instrument type changes
    useEffect(() => {
      if (instrumentType !== currentInstrument) {
        loadInstrument(instrumentType);
      }
    }, [instrumentType, currentInstrument, loadInstrument]);

    // Play a note
    const playNote = async (note: string) => {
      if (isAudioInitialized && isSamplerReady) {
        try {
          contextPlayNote(note);
        } catch (e) {
          console.error("Error playing note:", e);
        }
      } else {
        console.warn("Cannot play note: audio not ready");
      }
    };

    // Check if a note is available for the current instrument
    const isNoteAvailable = (note: string) => {
      // If availableNotes is null, all notes are available
      if (!availableNotes) return true;
      // Otherwise, check if the note is in the availableNotes array
      return availableNotes.includes(note);
    };

    // Handle key click
    const handleKeyClick = (note: string) => {
      // Only play and trigger callback if the note is available and audio is ready
      if (isNoteAvailable(note) && isSamplerReady) {
        playNote(note);
        onKeyClick(note);
      }
    };

    // Define notes for one octave - using sharp notation
    const octave = [
      { note: "C", isSharp: false, label: "C" },
      { note: "C#", isSharp: true, label: "C♯", flatLabel: "D♭" },
      { note: "D", isSharp: false, label: "D" },
      { note: "D#", isSharp: true, label: "D♯", flatLabel: "E♭" },
      { note: "E", isSharp: false, label: "E" },
      { note: "F", isSharp: false, label: "F" },
      { note: "F#", isSharp: true, label: "F♯", flatLabel: "G♭" },
      { note: "G", isSharp: false, label: "G" },
      { note: "G#", isSharp: true, label: "G♯", flatLabel: "A♭" },
      { note: "A", isSharp: false, label: "A" },
      { note: "A#", isSharp: true, label: "A♯", flatLabel: "B♭" },
      { note: "B", isSharp: false, label: "B" },
    ];

    // Create a keyboard with the specified octave range
    const keys: { note: string; isSharp: boolean; label: string }[] = [];
    for (let o = octaveRange.min; o <= octaveRange.max; o++) {
      octave.forEach((key) => {
        keys.push({ ...key, note: `${key.note}${o}` });
      });
    }

    // Render white keys
    const renderWhiteKeys = () => {
      return keys
        .filter((key) => !key.isSharp)
        .map((key, index) => {
          const isActive = activeKeys.includes(key.note);
          const isHighlighted = highlightedKeys.includes(key.note);
          const isAvailable = isNoteAvailable(key.note);

          return (
            <div
              key={`white-${key.note}-${index}`}
              className={`white-key ${isActive ? "active" : ""} ${
                isHighlighted ? "highlighted" : ""
              } ${!isAvailable ? "disabled" : ""}`}
              onPointerDown={() => handleKeyClick(key.note)}
            >
              {showLabels && (
                <span className="white-key-label">{key.label}</span>
              )}
            </div>
          );
        });
    };

    // Render black keys
    const renderBlackKeys = () => {
      // Calculate positions for black keys
      const whiteKeyWidth = 100 / keys.filter((key) => !key.isSharp).length; // percentage width
      const totalOctaves = octaveRange.max - octaveRange.min + 1;
      const shouldShowLabels = showLabels && totalOctaves <= 6;
      const shouldFlexLabels = showLabels && totalOctaves >= 4;

      return keys
        .filter((key) => key.isSharp)
        .map((key, index) => {
          const isActive = activeKeys.includes(key.note);
          const isHighlighted = highlightedKeys.includes(key.note);
          const isAvailable = isNoteAvailable(key.note);
          const isHovered = hoveredBlackKey === key.note;

          // Find the index of this black key in the full keys array
          const keyIndex = keys.findIndex((k) => k.note === key.note);
          // Calculate how many white keys came before this black key
          const whiteKeysBefore = keys
            .slice(0, keyIndex)
            .filter((k) => !k.isSharp).length;
          // Position is based on white keys
          const position = (whiteKeysBefore - 0.3) * whiteKeyWidth;

          // Find the corresponding octave note to get the flat label
          const octaveNote = octave.find(
            (n) => n.note === key.note.slice(0, -1)
          );
          const flatLabel = octaveNote?.flatLabel;

          return (
            <div
              key={`black-${key.note}-${index}`}
              className={`black-key ${isActive ? "active" : ""} ${
                isHighlighted ? "highlighted" : ""
              } ${!isAvailable ? "disabled" : ""} ${
                isHovered ? "hovered" : ""
              }`}
              style={{ left: `${position}%`, width: `${whiteKeyWidth * 0.7}%` }}
              onPointerDown={() => handleKeyClick(key.note)}
              onPointerEnter={() => setHoveredBlackKey(key.note)}
              onPointerLeave={() => setHoveredBlackKey(null)}
            >
              {shouldShowLabels && (
                <span
                  className="black-key-label"
                  style={
                    shouldFlexLabels
                      ? { paddingBottom: "0" }
                      : { width: "20px" }
                  }
                >
                  {isHovered ? flatLabel : key.label}
                </span>
              )}
            </div>
          );
        });
    };

    // Expose the playNote method to parent components via ref
    useImperativeHandle(ref, () => ({
      playNote,
      isNoteAvailable,
    }));

    return (
      <div className="shared-keyboard">
        {instrumentError && (
          <div className="loading-error">{instrumentError.message}</div>
        )}
        {isLoading && (
          <div className="loading-state">Loading instrument...</div>
        )}
        {!isSamplerReady && !isLoading && !instrumentError && (
          <div className="loading-state">Audio not ready</div>
        )}
        <div className={`octave-labels ${showOctaves ? "visible" : "hidden"}`}>
          {Array.from(
            { length: octaveRange.max - octaveRange.min + 1 },
            (_, i) => (
              <div
                key={`octave-${octaveRange.min + i}`}
                className="octave-label"
                style={{
                  width: `${100 / (octaveRange.max - octaveRange.min + 1)}%`,
                }}
              >
                {octaveRange.min + i}
              </div>
            )
          )}
        </div>
        <div className="piano-keys">
          {renderWhiteKeys()}
          {renderBlackKeys()}
        </div>
      </div>
    );
  }
);

SharedKeyboard.displayName = "SharedKeyboard";

export default SharedKeyboard;
