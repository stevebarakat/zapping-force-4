import React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
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
  return (
    <div className="slider-container">
      {label && showLabel && (
        <div>
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
        <SliderPrimitive.Root
          id={id}
          className="slider"
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          disabled={disabled}
        >
          <SliderPrimitive.Track className="slider-track">
            <SliderPrimitive.Range className="slider-range" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="slider-thumb" />
        </SliderPrimitive.Root>
      </div>
    </div>
  );
}
