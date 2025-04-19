import React from "react";
import { INSTRUMENTS } from "../../../lib/instruments";
import Select from "../../../../shared/Select/Select";

type Props = {
  id?: string;
  labelPosition?: "top" | "left";
  selectedInstrument: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

const formatInstrumentName = (name: string): string => {
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const InstrumentSelector = ({
  id = "instrument-select",
  labelPosition = "top",
  selectedInstrument,
  onChange,
  disabled,
}: Props) => {
  const options = INSTRUMENTS.map((instrument) => ({
    value: instrument.name,
    label: formatInstrumentName(instrument.name),
  }));

  return (
    <div className={`instrument-selector ${labelPosition}`}>
      <Select
        id={id}
        value={selectedInstrument}
        onChange={onChange}
        label="Instrument"
        labelPosition={labelPosition}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
};

export default InstrumentSelector;
