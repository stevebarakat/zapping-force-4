import React, { useState, useEffect } from "react";
import { Music, Eye, RefreshCw } from "lucide-react";

type KeySignature = {
  name: string;
  sharps: number;
  flats: number;
  majorKey: string;
  minorKey: string;
  accidentals: string[];
};

// Define all key signatures
const keySignatures: KeySignature[] = [
  {
    name: "C major / A minor",
    sharps: 0,
    flats: 0,
    majorKey: "C major",
    minorKey: "A minor",
    accidentals: [],
  },
  {
    name: "G major / E minor",
    sharps: 1,
    flats: 0,
    majorKey: "G major",
    minorKey: "E minor",
    accidentals: ["F♯"],
  },
  {
    name: "D major / B minor",
    sharps: 2,
    flats: 0,
    majorKey: "D major",
    minorKey: "B minor",
    accidentals: ["F♯", "C♯"],
  },
  {
    name: "A major / F♯ minor",
    sharps: 3,
    flats: 0,
    majorKey: "A major",
    minorKey: "F♯ minor",
    accidentals: ["F♯", "C♯", "G♯"],
  },
  {
    name: "E major / C♯ minor",
    sharps: 4,
    flats: 0,
    majorKey: "E major",
    minorKey: "C♯ minor",
    accidentals: ["F♯", "C♯", "G♯", "D♯"],
  },
  {
    name: "B major / G♯ minor",
    sharps: 5,
    flats: 0,
    majorKey: "B major",
    minorKey: "G♯ minor",
    accidentals: ["F♯", "C♯", "G♯", "D♯", "A♯"],
  },
  {
    name: "F♯ major / D♯ minor",
    sharps: 6,
    flats: 0,
    majorKey: "F♯ major",
    minorKey: "D♯ minor",
    accidentals: ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯"],
  },
  {
    name: "C♯ major / A♯ minor",
    sharps: 7,
    flats: 0,
    majorKey: "C♯ major",
    minorKey: "A♯ minor",
    accidentals: ["F♯", "C♯", "G♯", "D♯", "A♯", "E♯", "B♯"],
  },
  {
    name: "F major / D minor",
    sharps: 0,
    flats: 1,
    majorKey: "F major",
    minorKey: "D minor",
    accidentals: ["B♭"],
  },
  {
    name: "B♭ major / G minor",
    sharps: 0,
    flats: 2,
    majorKey: "B♭ major",
    minorKey: "G minor",
    accidentals: ["B♭", "E♭"],
  },
  {
    name: "E♭ major / C minor",
    sharps: 0,
    flats: 3,
    majorKey: "E♭ major",
    minorKey: "C minor",
    accidentals: ["B♭", "E♭", "A♭"],
  },
  {
    name: "A♭ major / F minor",
    sharps: 0,
    flats: 4,
    majorKey: "A♭ major",
    minorKey: "F minor",
    accidentals: ["B♭", "E♭", "A♭", "D♭"],
  },
  {
    name: "D♭ major / B♭ minor",
    sharps: 0,
    flats: 5,
    majorKey: "D♭ major",
    minorKey: "B♭ minor",
    accidentals: ["B♭", "E♭", "A♭", "D♭", "G♭"],
  },
  {
    name: "G♭ major / E♭ minor",
    sharps: 0,
    flats: 6,
    majorKey: "G♭ major",
    minorKey: "E♭ minor",
    accidentals: ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭"],
  },
  {
    name: "C♭ major / A♭ minor",
    sharps: 0,
    flats: 7,
    majorKey: "C♭ major",
    minorKey: "A♭ minor",
    accidentals: ["B♭", "E♭", "A♭", "D♭", "G♭", "C♭", "F♭"],
  },
];

// Position of accidentals on treble clef staff (line or space index, 0 = bottom line, going up)
const sharpPositions = [5, 2, 6, 3, 7, 4, 8]; // F♯, C♯, G♯, D♯, A♯, E♯, B♯
const flatPositions = [4, 7, 3, 6, 2, 5, 1]; // B♭, E♭, A♭, D♭, G♭, C♭, F♭

function KeySignatureReader() {
  const [currentKey, setCurrentKey] = useState<KeySignature | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Choose a random key signature on mount
  useEffect(function initKey() {
    selectRandomKey();
  }, []);

  // Select a random key signature
  function selectRandomKey() {
    const randomIndex = Math.floor(Math.random() * keySignatures.length);
    setCurrentKey(keySignatures[randomIndex]);
    setShowAnswer(false);
    setUserAnswer("");
    setFeedback(null);
  }

  // Toggle showing the answer
  function toggleShowAnswer() {
    setShowAnswer(!showAnswer);
  }

  // Check user's answer
  function checkAnswer() {
    if (!currentKey || !userAnswer) return;

    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const correctAnswers = [
      currentKey.majorKey.toLowerCase(),
      currentKey.minorKey.toLowerCase(),
      currentKey.name.toLowerCase(),
    ];

    // Check if the user's answer matches any of the correct answers
    const isCorrect = correctAnswers.some(
      (answer) =>
        normalizedUserAnswer === answer ||
        normalizedUserAnswer.includes(answer) ||
        answer.includes(normalizedUserAnswer)
    );

    setFeedback({
      correct: isCorrect,
      message: isCorrect
        ? "Correct! Well done!"
        : `Not quite. This key signature represents ${currentKey.name}.`,
    });

    // Show the answer after feedback
    setShowAnswer(true);
  }

  // Render the staff with key signature
  function renderKeySignature() {
    if (!currentKey) return null;

    // Determine if we're using sharps or flats
    const isSharp = currentKey.sharps > 0;
    const accidentalCount = isSharp ? currentKey.sharps : currentKey.flats;
    const positions = isSharp ? sharpPositions : flatPositions;

    return (
      <div className="staff-container">
        <div className="staff">
          {/* Clef symbol */}
          <div className="clef">𝄞</div>

          {/* Staff lines */}
          <div className="staff-lines">
            {[0, 1, 2, 3, 4].map((line) => (
              <div key={`line-${line}`} className="staff-line" />
            ))}
          </div>

          {/* Key signature */}
          <div className="key-signature">
            {Array.from({ length: accidentalCount }).map((_, index) => {
              const position = positions[index];
              const yPos = 70 - position * 10; // Calculate y position

              return (
                <div
                  key={`accidental-${index}`}
                  className="accidental"
                  style={{ top: `${yPos}px`, left: `${70 + index * 15}px` }}
                >
                  {isSharp ? "♯" : "♭"}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-container">
      <h3 className="component-title">Key Signature Reader</h3>

      <div className="key-explorer">
        {renderKeySignature()}

        <div className="controls">
          <div className="input-group">
            <label htmlFor="key-input">What key is this?</label>
            <input
              id="key-input"
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter key (e.g., G major or E minor)"
              disabled={showAnswer}
              className="input"
            />
            <button
              onClick={checkAnswer}
              disabled={!userAnswer || showAnswer}
              className="button check-button"
            >
              Check
            </button>
          </div>

          <div className="button-group">
            <button onClick={toggleShowAnswer} className="button reveal-button">
              <Eye size={16} />
              {showAnswer ? "Hide Answer" : "Show Answer"}
            </button>

            <button onClick={selectRandomKey} className="button new-button">
              <RefreshCw size={16} />
              New Key Signature
            </button>
          </div>
        </div>

        {/* Feedback area */}
        {feedback && (
          <div
            className={`feedback ${feedback.correct ? "correct" : "incorrect"}`}
          >
            {feedback.message}
          </div>
        )}

        {/* Answer area */}
        {showAnswer && currentKey && (
          <div className="answer-area">
            <h4>Key Signature Information</h4>
            <ul className="key-info">
              <li>
                <strong>Key Signature:</strong> {currentKey.name}
              </li>
              <li>
                <strong>Accidentals:</strong>{" "}
                {currentKey.accidentals.length === 0
                  ? "None"
                  : currentKey.accidentals.join(", ")}
              </li>
              <li>
                <strong>
                  Number of {currentKey.sharps > 0 ? "Sharps" : "Flats"}:
                </strong>{" "}
                {currentKey.sharps > 0 ? currentKey.sharps : currentKey.flats}
              </li>
            </ul>
            <div className="key-tips">
              <h4>How to Identify</h4>
              {currentKey.sharps > 0 ? (
                <p>
                  For sharp keys, the last sharp is a half step below the major
                  key name. Here, the last sharp is{" "}
                  {currentKey.accidentals[currentKey.accidentals.length - 1]}.
                </p>
              ) : currentKey.flats > 0 ? (
                <p>
                  For flat keys, the second-to-last flat is the name of the
                  major key. Here, the flats are{" "}
                  {currentKey.accidentals.join(", ")}.
                </p>
              ) : (
                <p>No sharps or flats indicates either C major or A minor.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .key-explorer {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .staff-container {
          width: 100%;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 8px;
          padding: 1rem;
        }

        .staff {
          position: relative;
          height: 120px;
          width: 100%;
        }

        .clef {
          position: absolute;
          left: 10px;
          top: 0;
          font-size: 5rem;
          line-height: 0;
          color: var(--text-primary);
        }

        .staff-lines {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .staff-line {
          height: 1px;
          width: 100%;
          background-color: var(--text-primary);
        }

        .key-signature {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .accidental {
          position: absolute;
          font-size: 2rem;
          color: var(--text-primary);
          transform: translateY(-50%);
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .input-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .input-group label {
          margin-right: 0.5rem;
          font-weight: 500;
        }

        .input {
          flex: 1;
          min-width: 200px;
          padding: 0.5rem;
          border: 1px solid var(--component-border);
          border-radius: 4px;
          background-color: var(--component-bg);
          color: var(--text-primary);
        }

        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
          background-color: var(--primary-blue);
          color: white;
        }

        .button:hover {
          background-color: var(--primary-blue-hover);
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .check-button {
          background-color: hsl(120 70% 35%);
        }

        .check-button:hover {
          background-color: hsl(120 70% 30%);
        }

        .reveal-button {
          background-color: hsl(210 50% 50%);
        }

        .reveal-button:hover {
          background-color: hsl(210 50% 45%);
        }

        .new-button {
          background-color: hsl(280 70% 50%);
        }

        .new-button:hover {
          background-color: hsl(280 70% 45%);
        }

        .feedback {
          padding: 0.75rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .feedback.correct {
          background-color: hsl(120 70% 90%);
          color: hsl(120 70% 30%);
        }

        .feedback.incorrect {
          background-color: hsl(0 70% 90%);
          color: hsl(0 70% 30%);
        }

        .answer-area {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .answer-area h4 {
          margin-top: 0;
          margin-bottom: 0.75rem;
        }

        .key-info {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem 0;
        }

        .key-info li {
          margin-bottom: 0.5rem;
        }

        .key-tips {
          background-color: hsl(45 100% 90% / 0.3);
          padding: 0.75rem;
          border-radius: 4px;
          border-left: 3px solid hsl(45 100% 50%);
        }

        .key-tips p {
          margin: 0;
          font-size: 0.9rem;
        }

        @media (min-width: 768px) {
          .controls {
            flex-direction: row;
            justify-content: space-between;
          }

          .input-group {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default KeySignatureReader;
