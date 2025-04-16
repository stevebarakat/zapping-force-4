import React from "react";
import "./Slider.css";

type SliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  showLabel?: boolean;
  width?: string;
  id?: string;
  suffix?: string;
};

export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  showValue = true,
  showLabel = true,
  suffix,
  id,
}: SliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  return (
    <div className="slider-container">
      {label && showLabel && (
        <div className="flex">
          <label>{label}</label>
          {showValue && (
            <span className="slider-value">
              &nbsp;{value.toFixed(0)}
              {suffix && <span className="slider-suffix">{suffix}</span>}
            </span>
          )}
        </div>
      )}
      <div className="slider-wrapper">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="slider"
        />
      </div>
    </div>
  );
}
