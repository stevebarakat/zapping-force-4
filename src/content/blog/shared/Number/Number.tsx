import React from "react";
import "./number.css";

interface NumberProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  labelPosition?: "top" | "left";
  disabled?: boolean;
  suffix?: string;
}

function Number({
  id,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  suffix,
  labelPosition = "top",
  disabled = false,
}: NumberProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    if (!isNaN(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div
      className={`number-wrapper ${labelPosition}`}
      style={labelPosition === "left" ? { gap: "0.5rem" } : {}}
    >
      {label && <label htmlFor={id}>{label}</label>}
      <input
        id={id}
        type="number"
        className="number-input"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
      />
      {suffix && <span className="number-suffix">{suffix}</span>}
    </div>
  );
}

export default Number;
