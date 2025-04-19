import { useInstrument } from "../../../lib/hooks/useInstrument";
import { PianoKey } from "./PianoKey";
// import { OctaveSelector } from "./OctaveSelector";
import { useState, useEffect } from "react";
import {
  generateAllNotes,
  isNoteAvailable,
  getNoteRange,
} from "../../../lib/utils/noteUtils";

export default function Piano() {
  const {
    currentInstrument,
    loadInstrument,
    instruments,
    initializeAudio,
    isAudioInitialized,
  } = useInstrument();
  const [selectedOctaves, setSelectedOctaves] = useState<number[]>([3, 4, 5]);
  const [displayNotes, setDisplayNotes] = useState<string[]>([]);
  const [currentOctaves, setCurrentOctaves] = useState<{
    [key: number]: string[] | "all";
  }>({});

  // Update octaves when instrument changes
  useEffect(() => {
    const instrument = instruments.find(
      (inst: { name: string }) => inst.name === currentInstrument
    );
    if (instrument) {
      setCurrentOctaves(instrument.octaves);
      // Keep the default range of 3-5 if it's within the instrument's range
      const { minOctave, maxOctave } = getNoteRange(instrument.octaves);
      if (minOctave <= 3 && maxOctave >= 5) {
        setSelectedOctaves([3, 4, 5]);
      } else {
        // If the default range isn't available, select all available octaves
        setSelectedOctaves([minOctave, maxOctave]);
      }
    }
  }, [currentInstrument, instruments]);

  // Update display notes when selected octaves change
  useEffect(() => {
    if (selectedOctaves.length === 0) return;

    const minOctave = Math.min(...selectedOctaves);
    const maxOctave = Math.max(...selectedOctaves);
    const allNotes = generateAllNotes(minOctave, maxOctave);
    setDisplayNotes(allNotes);
  }, [selectedOctaves]);

  const handleInteraction = async () => {
    if (!isAudioInitialized) {
      await initializeAudio();
    }
  };

  return (
    <div className="piano-container" onClick={handleInteraction}>
      <div className="instrument-selector">
        <select
          value={currentInstrument}
          onChange={(e) => loadInstrument(e.target.value)}
        >
          {instruments.map((inst: { name: string }) => (
            <option key={inst.name} value={inst.name}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>
      {/*
      <OctaveSelector
        octaves={currentOctaves}
        selectedOctaves={selectedOctaves}
        onOctaveChange={setSelectedOctaves}
      /> */}

      <div className="piano">
        {displayNotes.map((note) => (
          <PianoKey
            key={note}
            note={note}
            isBlack={note.includes("#")}
            disabled={!isNoteAvailable(note, currentOctaves)}
          />
        ))}
      </div>
    </div>
  );
}
