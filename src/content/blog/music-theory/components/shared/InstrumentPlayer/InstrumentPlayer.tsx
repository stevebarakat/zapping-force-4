import React, {
  useState,
  useImperativeHandle,
  useRef,
  forwardRef,
} from "react";
import { OctaveSelector } from "../OctaveSelector";
import { SharedKeyboard } from "../SharedKeyboard/index";
import type { SharedKeyboardRef } from "../SharedKeyboard/index";
import * as Switch from "@radix-ui/react-switch";
import "./instrument-player.css";

// Define types for the ref and props
export interface InstrumentPlayerRef {
  playNote: (noteId: string, time?: number | string) => void;
  playNotes: (noteIds: string[]) => void;
  stopNote: (noteId: string) => void;
  isNoteAvailable?: (note: string) => boolean;
}

interface InstrumentPlayerProps {
  instrumentType?: string;
  octaveRange?: { min: number; max: number };
  onKeyClick?: (key: string) => void;
  showLabels?: boolean;
  activeKeys?: string[];
  highlightedKeys?: string[];
  onOctaveRangeChange?: (range: { min: number; max: number }) => void;
  onInstrumentChange?: (instrument: string) => void;
}

const InstrumentPlayer = forwardRef<InstrumentPlayerRef, InstrumentPlayerProps>(
  (
    {
      instrumentType = "piano",
      octaveRange: initialOctaveRange = { min: 3, max: 5 },
      onKeyClick = () => {},
      showLabels = true,
      activeKeys = [],
      highlightedKeys = [],
      onOctaveRangeChange,
      onInstrumentChange,
    },
    ref
  ) => {
    const [octaveRange, setOctaveRange] = useState(initialOctaveRange);
    const [showOctaves, setShowOctaves] = useState(false);

    // Create a ref for the keyboard
    const keyboardRef = useRef<SharedKeyboardRef>(null);

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
        <div className="controls">
          <OctaveSelector
            octaveRange={octaveRange}
            onOctaveChange={(range) => {
              setOctaveRange(range);
              onOctaveRangeChange?.(range);
            }}
            availableOctaves={[1, 2, 3, 4, 5, 6, 7]}
          />
          <div className="switch-container">
            <label className="switch-label" htmlFor="show-octaves">
              Show Octaves
            </label>
            <Switch.Root
              className="switch-root"
              id="show-octaves"
              checked={showOctaves}
              onCheckedChange={setShowOctaves}
              aria-label={showOctaves ? "Hide octaves" : "Show octaves"}
            >
              <Switch.Thumb className="switch-thumb" />
            </Switch.Root>
          </div>
        </div>
        <SharedKeyboard
          ref={keyboardRef}
          activeKeys={activeKeys}
          highlightedKeys={highlightedKeys}
          octaveRange={octaveRange}
          onKeyClick={onKeyClick}
          showLabels={showLabels}
          showOctaves={showOctaves}
        />
      </div>
    );
  }
);

InstrumentPlayer.displayName = "InstrumentPlayer";

export default InstrumentPlayer;
