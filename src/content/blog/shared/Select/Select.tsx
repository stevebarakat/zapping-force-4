import React from "react";
import "./select.css";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  labelPosition?: "top" | "left";
  disabled?: boolean;
  children?: React.ReactNode;
}

function Select({
  id,
  value,
  onChange,
  label,
  labelPosition = "left",
  disabled = false,
  children,
}: SelectProps) {
  return (
    <div
      className={`select-wrapper ${labelPosition}`}
      style={{ gap: labelPosition === "left" ? "0.5rem" : "0" }}
    >
      {label && <label htmlFor={id}>{label}</label>}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  );
}

export default Select;
