import React from "react";

type HalfNoteProps = {
  className?: string;
  size?: number;
  color?: string;
};

export function HalfNote<HalfNoteProps>({
  className = "",
  size = 24,
  color = "currentColor",
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="18" r="4" />
      <path d="M16 18V2" />
    </svg>
  );
}
