import React, { useRef, useState } from "react";
import SharedKeyboard from "../shared/SharedKeyboard/SharedKeyboard";
import type { SharedKeyboardRef } from "../shared/SharedKeyboard/SharedKeyboard";
import { INSTRUMENT_TYPES } from "@/consts";
import "./note-input.css";

interface NoteInputProps {
  onNoteInput: (note: string) => void;
  instrumentType?: string;
  showLabels?: boolean;
  showOctaves?: boolean;
  octaveRange?: { min: number; max: number };
}

const NoteInput: React.FC<NoteInputProps> = ({
  onNoteInput,
  instrumentType = INSTRUMENT_TYPES.PIANO,
  showLabels = true,
  showOctaves = false,
  octaveRange = { min: 4, max: 5 },
}) => {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const keyboardRef = useRef<SharedKeyboardRef>(null);

  const handleKeyClick = (note: string) => {
    setActiveKeys([note]);
    onNoteInput(note);
    // Reset active keys after a short delay
    setTimeout(() => {
      setActiveKeys([]);
    }, 200);
  };

  return (
    <div className="note-input">
      <SharedKeyboard
        ref={keyboardRef}
        activeKeys={activeKeys}
        onKeyClick={handleKeyClick}
        instrumentType={instrumentType}
        showLabels={showLabels}
        showOctaves={showOctaves}
        octaveRange={octaveRange}
      />
    </div>
  );
};

export default NoteInput;
