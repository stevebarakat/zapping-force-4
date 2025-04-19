import React, { useState } from "react";

type ClefType = "treble" | "bass" | "alto" | "tenor";

type ClefInfo = {
  symbol: string;
  name: string;
  description: string;
  referenceNote: string;
  clefLine: number;
  rangeDescription: string;
  commonInstruments: string[];
};

const clefInfo: Record<ClefType, ClefInfo> = {
  treble: {
    symbol: "𝄞",
    name: "Treble Clef (G Clef)",
    description:
      "The treble clef indicates that the second line from the bottom (G4) is the G above middle C.",
    referenceNote: "G4",
    clefLine: 2,
    rangeDescription: "Typically used for notes above middle C (C4)",
    commonInstruments: [
      "Violin",
      "Flute",
      "Guitar",
      "Piano (right hand)",
      "Trumpet",
      "Saxophone",
    ],
  },
  bass: {
    symbol: "𝄢",
    name: "Bass Clef (F Clef)",
    description:
      "The bass clef indicates that the second line from the top (F3) is the F below middle C.",
    referenceNote: "F3",
    clefLine: 4,
    rangeDescription: "Typically used for notes below middle C (C4)",
    commonInstruments: [
      "Bass guitar",
      "Cello",
      "Tuba",
      "Trombone",
      "Piano (left hand)",
      "Double bass",
    ],
  },
  alto: {
    symbol: "𝄡",
    name: "Alto Clef (C Clef)",
    description:
      "The alto clef indicates that the middle line (C4) is middle C.",
    referenceNote: "C4",
    clefLine: 3,
    rangeDescription: "Used for the middle range between bass and treble",
    commonInstruments: ["Viola", "Alto trombone", "Viola da gamba"],
  },
  tenor: {
    symbol: "𝄡",
    name: "Tenor Clef (C Clef)",
    description:
      "The tenor clef indicates that the second line from the top (C4) is middle C.",
    referenceNote: "C4",
    clefLine: 4,
    rangeDescription: "Used for the tenor range, between bass and alto",
    commonInstruments: [
      "Cello (high passages)",
      "Bassoon (high passages)",
      "Trombone (high passages)",
    ],
  },
};

const ClefExplorer = () => {
  const [selectedClef, setSelectedClef] = useState<ClefType>("treble");

  const renderStaff = (clef: ClefType) => {
    const info = clefInfo[clef];

    // Determine if the clef is a C clef (alto or tenor)
    const isCClef = clef === "alto" || clef === "tenor";

    // Calculate the position of the reference line
    const referenceLinePosition = info.clefLine;

    return (
      <div className="staff-container">
        <div className="staff">
          {/* Clef symbol */}
          <div className="clef">{info.symbol}</div>

          {/* Staff lines */}
          <div className="staff-lines">
            {[1, 2, 3, 4, 5].map((line) => (
              <div
                key={`line-${line}`}
                className={`staff-line ${
                  line === referenceLinePosition ? "reference-line" : ""
                }`}
              ></div>
            ))}
          </div>

          {/* Reference note highlight */}
          <div
            className="reference-note"
            style={{
              top: `${(referenceLinePosition - 1) * 20 + 40}px`,
              backgroundColor: isCClef
                ? "hsl(330 80% 70% / 0.3)"
                : "hsl(120 80% 70% / 0.3)",
            }}
          >
            <span className="reference-label">{info.referenceNote}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="demo-container">
      <h3 className="component-title">Clef Explorer</h3>

      <div className="clef-explorer">
        <div className="clef-selector">
          {(Object.keys(clefInfo) as ClefType[]).map((clef) => (
            <button
              key={clef}
              className={`clef-button ${selectedClef === clef ? "active" : ""}`}
              onClick={() => setSelectedClef(clef)}
            >
              {clefInfo[clef].name}
            </button>
          ))}
        </div>

        <div className="clef-display">
          {renderStaff(selectedClef)}

          <div className="clef-info">
            <h4>{clefInfo[selectedClef].name}</h4>
            <p>{clefInfo[selectedClef].description}</p>
            <p>
              <strong>Range:</strong> {clefInfo[selectedClef].rangeDescription}
            </p>
            <div className="instruments">
              <strong>Common instruments:</strong>
              <ul>
                {clefInfo[selectedClef].commonInstruments.map(
                  (instrument, index) => (
                    <li key={index}>{instrument}</li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .clef-explorer {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .clef-selector {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .clef-button {
          padding: 0.5rem 1rem;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .clef-button:hover {
          background-color: var(--component-bg-darker);
        }

        .clef-button.active {
          background-color: var(--primary-blue);
          color: white;
        }

        .clef-display {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .staff-container {
          width: 100%;
        }

        .staff {
          position: relative;
          height: 150px;
          width: 100%;
          margin: 0 auto;
          padding-left: 60px;
        }

        .clef {
          position: absolute;
          left: 10px;
          top: 25px;
          font-size: 5rem;
          line-height: 0;
          color: var(--text-primary);
        }

        .staff-lines {
          position: relative;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 40px 0;
        }

        .staff-line {
          height: 2px;
          width: 100%;
          background-color: var(--text-primary);
        }

        .reference-line {
          height: 2px;
          background-color: hsl(210 80% 50% / 0.5);
        }

        .reference-note {
          position: absolute;
          left: 70px;
          height: 20px;
          width: 40px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .reference-label {
          font-weight: bold;
          font-size: 0.9rem;
        }

        .clef-info {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .clef-info h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .clef-info p {
          margin-bottom: 0.75rem;
        }

        .instruments {
          margin-top: 0.5rem;
        }

        .instruments ul {
          margin-top: 0.25rem;
          padding-left: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 0.25rem;
        }

        @media (min-width: 768px) {
          .clef-display {
            flex-direction: row;
          }

          .staff-container {
            flex: 1;
          }

          .clef-info {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ClefExplorer;
