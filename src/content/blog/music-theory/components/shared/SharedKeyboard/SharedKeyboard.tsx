import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import "./shared-keyboard.css";
import { useInstrument } from "../../../lib/hooks/useInstrument";

export type SharedKeyboardRef = {
  playNote: (note: string) => void;
  stopNote: (note: string) => void;
  isNoteAvailable: (note: string) => boolean;
};

interface SharedKeyboardProps {
  activeKeys?: string[];
  highlightedKeys?: string[];
  octaveRange?: { min: number; max: number };
  onKeyClick?: (note: string) => void;
  showLabels?: boolean;
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
      stopNote: contextStopNote,
      initializeAudio,
      isAudioInitialized,
      isSamplerReady,
    } = useInstrument();

    const [hoveredBlackKey, setHoveredBlackKey] = useState<string | null>(null);

    // Initialize audio when component mounts
    useEffect(() => {
      if (!isAudioInitialized) {
        initializeAudio();
      }
    }, [isAudioInitialized, initializeAudio]);

    // Load piano when component mounts
    useEffect(() => {
      if (currentInstrument !== "piano") {
        loadInstrument("piano");
      }
    }, [currentInstrument, loadInstrument]);

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

    // Stop a note
    const stopNote = (note: string) => {
      if (isAudioInitialized && isSamplerReady) {
        try {
          contextStopNote(note);
        } catch (e) {
          console.error("Error stopping note:", e);
        }
      }
    };

    // Check if a note is available (always true for piano)
    const isNoteAvailable = (note: string) => true;

    // Handle key click
    const handleKeyClick = (note: string) => {
      if (isSamplerReady && !isLoading) {
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
          const isDisabled = isLoading || !isSamplerReady;

          return (
            <div
              key={`white-${key.note}-${index}`}
              className={`white-key ${isActive ? "active" : ""} ${
                isHighlighted ? "highlighted" : ""
              } ${isDisabled ? "disabled" : ""}`}
              onPointerDown={() => handleKeyClick(key.note)}
              onPointerUp={() => stopNote(key.note)}
              onPointerLeave={() => stopNote(key.note)}
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
          const isHovered = hoveredBlackKey === key.note;
          const isDisabled = isLoading || !isSamplerReady;

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
              } ${isDisabled ? "disabled" : ""} ${isHovered ? "hovered" : ""}`}
              style={{ left: `${position}%`, width: `${whiteKeyWidth * 0.7}%` }}
              onPointerDown={() => handleKeyClick(key.note)}
              onPointerUp={() => stopNote(key.note)}
              onPointerLeave={() => {
                stopNote(key.note);
                setHoveredBlackKey(null);
              }}
              onPointerEnter={() => setHoveredBlackKey(key.note)}
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
      stopNote,
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
