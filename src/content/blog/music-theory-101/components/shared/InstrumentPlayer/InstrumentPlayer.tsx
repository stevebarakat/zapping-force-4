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
  "bass-electric": [1, 4],
  bassoon: [2, 5], // Matches available samples: A2-G2, A3-C3-G3, A4-C4-E4-G4, C5
  cello: [2, 5],
  clarinet: [3, 6],
  contrabass: [1, 3],
  flute: [4, 7],
  "french-horn": [2, 5],
  guitar: [2, 5],
  marimba: [2, 5],
  organ: [1, 7],
  piano: [1, 7],
  saxophone: [3, 6],
  trombone: [2, 5],
  trumpet: [3, 6],
  tuba: [1, 3],
  violin: [3, 7],
  xylophone: [3, 6],
  drums: [1, 5],
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
