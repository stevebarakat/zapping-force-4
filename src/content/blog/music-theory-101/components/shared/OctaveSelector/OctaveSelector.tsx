import React, { useState, useEffect } from "react";
import { Select } from "@/content/blog/shared/Select";

type OctaveSelectorProps = {
  octaveRange: { min: number; max: number };
  onOctaveChange: (octaveRange: { min: number; max: number }) => void;
  availableOctaves: number[]; // Array of available octaves for the instrument
};

function OctaveSelector({
  octaveRange,
  onOctaveChange,
  availableOctaves,
}: OctaveSelectorProps) {
  const [localOctaveRange, setLocalOctaveRange] = useState(octaveRange);

  useEffect(() => {
    setLocalOctaveRange(octaveRange);
  }, [octaveRange]);

  const handleOctaveRangeChange = (type: string, value: string) => {
    const newRange = { ...localOctaveRange };

    if (type === "min") {
      // Ensure min doesn't exceed max
      const newMin = parseInt(value);
      if (newMin <= localOctaveRange.max) {
        newRange.min = newMin;
      }
    } else {
      // Ensure max isn't below min
      const newMax = parseInt(value);
      if (newMax >= localOctaveRange.min) {
        newRange.max = newMax;
      }
    }

    setLocalOctaveRange(newRange);
    onOctaveChange(newRange);
  };

  // Filter available octaves for min selector (should be less than or equal to current max)
  const minOctaveOptions = availableOctaves.filter(
    (oct) => oct <= localOctaveRange.max
  );

  // Filter available octaves for max selector (should be greater than or equal to current min)
  const maxOctaveOptions = availableOctaves.filter(
    (oct) => oct >= localOctaveRange.min
  );

  return (
    <div className="octave-controls">
      <div className="octave-control">
        <Select
          value={localOctaveRange.min.toString()}
          onChange={(value: string) => handleOctaveRangeChange("min", value)}
          label="Lowest"
          labelPosition="left"
        >
          {minOctaveOptions.map((octave) => (
            <option key={octave} value={octave.toString()}>
              {octave.toString()}
            </option>
          ))}
        </Select>
      </div>

      <div className="octave-control">
        <Select
          value={localOctaveRange.max.toString()}
          onChange={(value: string) => handleOctaveRangeChange("max", value)}
          label="Highest"
          labelPosition="left"
        >
          {maxOctaveOptions.map((octave) => (
            <option key={octave} value={octave.toString()}>
              {octave.toString()}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default OctaveSelector;
