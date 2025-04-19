import React from "react";

interface MusicalStaffProps {
  notes: string[];
  className?: string;
}

const MusicalStaff: React.FC<MusicalStaffProps> = ({
  notes,
  className = "",
}) => {
  // Staff dimensions
  const STAFF_WIDTH = 240;
  const STAFF_HEIGHT = 160;
  const LINE_SPACING = 12;
  const TOP_MARGIN = 40;
  const LEFT_MARGIN = 60; // Increased to make room for key signature

  // Staff line labels (from bottom to top)
  const STAFF_LINES = [
    { note: "E", position: 4 },
    { note: "G", position: 3 },
    { note: "B", position: 2 },
    { note: "D", position: 1 },
    { note: "F", position: 0 },
  ];

  // Get unique accidentals from notes
  const getAccidentals = () => {
    const sharps = new Set<string>();
    notes.forEach((note) => {
      if (note.includes("#")) {
        sharps.add(note.replace(/[0-9]/, ""));
      }
    });
    return Array.from(sharps);
  };

  // Note positions (y-coordinates) for each note, starting from middle C
  const notePositions: { [key: string]: number } = {
    C: TOP_MARGIN + LINE_SPACING * 5, // Middle C (first ledger line below)
    D: TOP_MARGIN + LINE_SPACING * 4.5, // Between lines
    E: TOP_MARGIN + LINE_SPACING * 4, // On line
    F: TOP_MARGIN + LINE_SPACING * 3.5, // Between lines
    G: TOP_MARGIN + LINE_SPACING * 3, // On line
    A: TOP_MARGIN + LINE_SPACING * 2.5, // Between lines
    B: TOP_MARGIN + LINE_SPACING * 2, // On line
    "C#": TOP_MARGIN + LINE_SPACING * 5, // Same as C
    "D#": TOP_MARGIN + LINE_SPACING * 4.5, // Same as D
    "F#": TOP_MARGIN + LINE_SPACING * 3.5, // Same as F
    "G#": TOP_MARGIN + LINE_SPACING * 3, // Same as G
    "A#": TOP_MARGIN + LINE_SPACING * 2.5, // Same as A
  };

  // Helper function to get note position
  const getNotePosition = (note: string) => {
    const baseNote = note.replace(/[0-9]/, "");
    return notePositions[baseNote] || 0;
  };

  // Helper function to determine if a note needs a ledger line
  const needsLedgerLine = (note: string) => {
    const baseNote = note.replace(/[0-9]/, "");
    return baseNote === "C" || baseNote === "C#"; // Middle C needs a ledger line
  };

  const accidentals = getAccidentals();

  return (
    <div className={`musical-staff ${className}`}>
      <svg
        width={STAFF_WIDTH}
        height={STAFF_HEIGHT}
        viewBox={`0 0 ${STAFF_WIDTH} ${STAFF_HEIGHT}`}
      >
        {/* Draw staff lines with labels */}
        {STAFF_LINES.map(({ note, position }) => (
          <g key={position}>
            <line
              x1={LEFT_MARGIN}
              y1={TOP_MARGIN + position * LINE_SPACING}
              x2={STAFF_WIDTH - LEFT_MARGIN}
              y2={TOP_MARGIN + position * LINE_SPACING}
              stroke="currentColor"
              strokeWidth="1"
            />
            {/* Line label */}
            <text
              x={LEFT_MARGIN - 40}
              y={TOP_MARGIN + position * LINE_SPACING + 5}
              fill="currentColor"
              fontSize="14"
              fontFamily="serif"
              textAnchor="middle"
            >
              {note}
            </text>
          </g>
        ))}

        {/* Draw key signature */}
        {accidentals.map((accidental, index) => {
          const baseNote = accidental.replace("#", "");
          const y = getNotePosition(baseNote);
          const x = LEFT_MARGIN - 15 + index * 12;

          return (
            <text
              key={accidental}
              x={x}
              y={y + 5}
              fill="currentColor"
              fontSize="16"
              fontFamily="serif"
            >
              ♯
            </text>
          );
        })}

        {/* Draw notes */}
        {notes.map((note, index) => {
          const x = LEFT_MARGIN + 40 + index * 35;
          const y = getNotePosition(note);

          return (
            <g key={index}>
              {/* Ledger line for middle C */}
              {needsLedgerLine(note) && (
                <line
                  x1={x - 8}
                  y1={y}
                  x2={x + 8}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                />
              )}

              {/* Note head (hollow) - smaller whole notes */}
              <ellipse
                cx={x}
                cy={y}
                rx="6"
                ry="4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MusicalStaff;
