import React, { useState } from "react";
import { InstrumentPlayer } from "../shared/InstrumentPlayer";
import { INSTRUMENT_TYPES } from "@/consts";
import VisuallyHidden from "@/components/VisuallyHidden";
import "@/content/blog/shared/dark-mode.css";
import { Select } from "@/content/blog/shared/Select";

const NotePlayer = () => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENT_TYPES.PIANO
  );
  const [octaveRange, setOctaveRange] = useState({ min: 3, max: 5 });

  // Convert instrument types to options array
  const instrumentOptions = Object.entries(INSTRUMENT_TYPES).map(
    ([key, value]) => ({
      value: value,
      label: key.charAt(0) + key.slice(1).toLowerCase(),
    })
  );

  // Handle note click
  const handleKeyClick = (note: string) => {
    setActiveKey(note);
    setTimeout(() => setActiveKey(null), 300);
  };

  return (
    <div>
      <div className="demo-container">
        <VisuallyHidden as="h3">Note Player</VisuallyHidden>
        <InstrumentPlayer
          instrumentType={selectedInstrument}
          octaveRange={octaveRange}
          onKeyClick={handleKeyClick}
          showLabels={true}
          activeKeys={activeKey ? [activeKey] : []}
        />
      </div>
    </div>
  );
};

export default NotePlayer;
