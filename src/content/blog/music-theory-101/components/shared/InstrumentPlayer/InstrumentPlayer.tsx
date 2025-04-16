import React, {
  useState,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import { OctaveSelector } from "../OctaveSelector";
import { SharedKeyboard } from "../SharedKeyboard/index";
import type { SharedKeyboardRef } from "../SharedKeyboard/index";
import { InstrumentSelector } from "../InstrumentSelector";
import { Button } from "@/components/Button";
import "./instrument-player.css";

// Define available octave ranges for each instrument
const INSTRUMENT_OCTAVE_RANGES = {
  // Bass instruments
  "bass-electric": [1, 4], // E1 to G4
  contrabass: [1, 3], // C1 to G3
  tuba: [1, 3], // D1 to F3

  // Woodwinds
  bassoon: [2, 5], // Bb1 to E5
  clarinet: [3, 6], // D3 to Bb6
  flute: [4, 7], // C4 to C7
  saxophone: [3, 6], // Bb3 to F6

  // Brass
  "french-horn": [2, 5], // F2 to C5
  trombone: [2, 5], // E2 to Bb5
  trumpet: [3, 6], // F#3 to D6

  // Strings
  cello: [2, 5], // C2 to A5
  violin: [3, 7], // G3 to A7
  harp: [2, 6], // C2 to G6

  // Plucked strings
  guitar: [2, 5], // E2 to E5
  "guitar-nylon": [2, 5], // E2 to E5

  // Percussion
  marimba: [2, 5], // C2 to C5
  xylophone: [3, 6], // F3 to C7
  drums: [1, 5], // Various drums across this range

  // Keyboard instruments
  harmonium: [2, 6], // C2 to C6
  organ: [1, 7], // C1 to C7
  piano: [1, 7], // A0 to C8
};

// Define types for the ref and props
export interface InstrumentPlayerRef {
  playNote: (noteId: string, time?: number | string) => void;
  playNotes: (noteIds: string[]) => void;
  stopNote: (noteId: string) => void;
  isNoteAvailable?: (note: string) => boolean;
}

interface InstrumentPlayerProps {
  instrumentType: string;
  octaveRange?: { min: number; max: number };
  onKeyClick?: (key: string) => void;
  showLabels?: boolean;
  activeKeys?: string[];
  highlightedKeys?: string[];
  onInstrumentChange?: (instrument: string) => void;
  onOctaveRangeChange?: (range: { min: number; max: number }) => void;
}

const InstrumentPlayer = forwardRef<InstrumentPlayerRef, InstrumentPlayerProps>(
  (
    {
      instrumentType,
      octaveRange: initialOctaveRange = { min: 3, max: 5 },
      onKeyClick = () => {},
      showLabels = true,
      activeKeys = [],
      highlightedKeys = [],
      onInstrumentChange,
      onOctaveRangeChange,
    },
    ref
  ) => {
    const [selectedInstrument, setSelectedInstrument] =
      useState(instrumentType);
    const [octaveRange, setOctaveRange] = useState(initialOctaveRange);
    const [showOctaves, setShowOctaves] = useState(false);

    // Create a ref for the keyboard
    const keyboardRef = useRef<SharedKeyboardRef>(null);

    // Get available octaves for the current instrument
    const getAvailableOctaves = (instrument: string) => {
      const normalizedInstrument = instrument.toLowerCase().replace(/\s+/g, "");
      const range =
        INSTRUMENT_OCTAVE_RANGES[
          normalizedInstrument as keyof typeof INSTRUMENT_OCTAVE_RANGES
        ];

      if (!range) {
        console.warn(`No octave range found for instrument: ${instrument}`);
        return [3, 5]; // Default to a safe middle range if instrument not found
      }

      const availableOctaves = [];
      for (let i = range[0]; i <= range[1]; i++) {
        availableOctaves.push(i);
      }
      return availableOctaves;
    };

    // Expose methods to parent components via ref
    useImperativeHandle(ref, () => ({
      playNote: (noteId: string, time?: number | string) => {
        if (keyboardRef.current) {
          keyboardRef.current.playNote(noteId);
        }
      },
      playNotes: (noteIds: string[]) => {
        if (keyboardRef.current) {
          noteIds.forEach((noteId) => {
            keyboardRef.current?.playNote(noteId);
          });
        }
      },
      stopNote: (noteId: string) => {
        if (keyboardRef.current) {
          keyboardRef.current.stopNote(noteId);
        }
      },
      isNoteAvailable: (note: string) => {
        if (keyboardRef.current) {
          return keyboardRef.current.isNoteAvailable(note);
        }
        return true;
      },
    }));

    return (
      <div className="instrument-player">
        <div className="controls-container">
          <InstrumentSelector
            labelPosition="left"
            selectedInstrument={selectedInstrument}
            onChange={(newInstrument) => {
              setSelectedInstrument(newInstrument);
              onInstrumentChange?.(newInstrument);
              // Update octave range when instrument changes
              const availableOctaves = getAvailableOctaves(newInstrument);
              const newRange = {
                min: availableOctaves[0],
                max: availableOctaves[availableOctaves.length - 1],
              };
              setOctaveRange(newRange);
              onOctaveRangeChange?.(newRange);
            }}
          />
          <Button
            variant="outline"
            size="small"
            onClick={() => setShowOctaves(!showOctaves)}
          >
            {showOctaves ? "Hide" : "Show"} Octaves
          </Button>
          <OctaveSelector
            octaveRange={octaveRange}
            onOctaveChange={(newOctaveRange) => {
              setOctaveRange(newOctaveRange);
              onOctaveRangeChange?.(newOctaveRange);
            }}
            availableOctaves={getAvailableOctaves(selectedInstrument)}
          />
        </div>
        <SharedKeyboard
          ref={keyboardRef}
          instrumentType={selectedInstrument}
          octaveRange={octaveRange}
          showLabels={showLabels}
          onKeyClick={onKeyClick}
          activeKeys={activeKeys}
          highlightedKeys={highlightedKeys}
          showOctaves={showOctaves}
        />
      </div>
    );
  }
);

InstrumentPlayer.displayName = "InstrumentPlayer";

export default InstrumentPlayer;
export { InstrumentPlayer };
