import { getNoteRange } from "../lib/utils/noteUtils";
import React from "react";

type OctaveSelectorProps = {
  octaves: { [key: number]: string[] | "all" };
  selectedOctaves: number[];
  onOctaveChange: (octaves: number[]) => void;
};

export function OctaveSelector({
  octaves,
  selectedOctaves,
  onOctaveChange,
}: OctaveSelectorProps) {
  const { minOctave, maxOctave } = getNoteRange(octaves);
  const [startOctave, setStartOctave] = React.useState(
    Math.min(...selectedOctaves)
  );
  const [endOctave, setEndOctave] = React.useState(
    Math.max(...selectedOctaves)
  );

  const handleStartOctaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setStartOctave(minOctave);
      return;
    }

    const newStart = parseInt(value);
    if (isNaN(newStart)) return;

    if (newStart <= endOctave && newStart >= minOctave) {
      setStartOctave(newStart);
      const newOctaves = Array.from(
        { length: endOctave - newStart + 1 },
        (_, i) => newStart + i
      );
      onOctaveChange(newOctaves);
    }
  };

  const handleEndOctaveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setEndOctave(maxOctave);
      return;
    }

    const newEnd = parseInt(value);
    if (isNaN(newEnd)) return;

    if (newEnd >= startOctave && newEnd <= maxOctave) {
      setEndOctave(newEnd);
      const newOctaves = Array.from(
        { length: newEnd - startOctave + 1 },
        (_, i) => startOctave + i
      );
      onOctaveChange(newOctaves);
    }
  };

  return (
    <div className="octave-selector">
      <h3>Select Octave Range</h3>
      <div className="octave-inputs">
        <div className="input-group">
          <label htmlFor="start-octave">Start Octave:</label>
          <input
            id="start-octave"
            type="number"
            min={minOctave}
            max={maxOctave}
            value={startOctave}
            onChange={handleStartOctaveChange}
            onBlur={(e) => {
              if (e.target.value === "") {
                setStartOctave(minOctave);
                const newOctaves = Array.from(
                  { length: endOctave - minOctave + 1 },
                  (_, i) => minOctave + i
                );
                onOctaveChange(newOctaves);
              }
            }}
          />
        </div>
        <div className="input-group">
          <label htmlFor="end-octave">End Octave:</label>
          <input
            id="end-octave"
            type="number"
            min={minOctave}
            max={maxOctave}
            value={endOctave}
            onChange={handleEndOctaveChange}
            onBlur={(e) => {
              if (e.target.value === "") {
                setEndOctave(maxOctave);
                const newOctaves = Array.from(
                  { length: maxOctave - startOctave + 1 },
                  (_, i) => startOctave + i
                );
                onOctaveChange(newOctaves);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
