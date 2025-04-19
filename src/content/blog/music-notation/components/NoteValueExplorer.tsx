import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Clock, Play, Pause, Music, Volume2 } from "lucide-react";
import { Slider } from "@/components/Slider";

type NoteValue = {
  name: string;
  symbol: string;
  description: string;
  duration: number; // In beats
  svgPath: string; // SVG path for the note symbol
  textSymbol?: string; // Unicode musical symbol if available
  restSvgPath?: string; // SVG path for the rest symbol
  restTextSymbol?: string; // Unicode rest symbol if available
};

const noteValues: NoteValue[] = [
  {
    name: "Whole Note",
    symbol: "𝅝",
    description: "Lasts for 4 beats in 4/4 time",
    duration: 4,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z",
    textSymbol: "𝅝",
    restSvgPath: "M10,10 H16 V12 H10 Z",
    restTextSymbol: "𝄻",
  },
  {
    name: "Half Note",
    symbol: "𝅗𝅥",
    description: "Lasts for 2 beats in 4/4 time",
    duration: 2,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z M17,12 L17,4",
    textSymbol: "𝅗𝅥",
    restSvgPath: "M10,8 H16 V10 H10 Z",
    restTextSymbol: "𝄼",
  },
  {
    name: "Quarter Note",
    symbol: "♩",
    description: "Lasts for 1 beat in 4/4 time",
    duration: 1,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z M17,4 L17,20 Z",
    textSymbol: "♩",
    restSvgPath: "M12,8 C15,12 10,16 14,20",
    restTextSymbol: "𝄽",
  },
  {
    name: "Eighth Note",
    symbol: "♪",
    description: "Lasts for 1/2 beat in 4/4 time",
    duration: 0.5,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z M17,4 L17,20 Z M17,20 C20,16 22,14 24,12",
    textSymbol: "♪",
    restSvgPath: "M12,8 A4,4 0 1,1 16,12",
    restTextSymbol: "𝄾",
  },
  {
    name: "Sixteenth Note",
    symbol: "𝅘𝅥𝅯",
    description: "Lasts for 1/4 beat in 4/4 time",
    duration: 0.25,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z M17,4 L17,20 Z M17,20 C20,16 22,14 24,12 M17,14 C20,10 22,8 24,6",
    textSymbol: "𝅘𝅥𝅯",
    restSvgPath: "M12,8 A4,4 0 1,1 16,12 M12,16 A4,4 0 1,1 16,20",
    restTextSymbol: "𝄿",
  },
  {
    name: "Dotted Half Note",
    symbol: "𝅗𝅥.",
    description: "Lasts for 3 beats in 4/4 time (2 + 1)",
    duration: 3,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z M17,12 L17,4 M26,8 A2,2 0 1,1 26,8.1",
    textSymbol: "𝅗𝅥.",
    restSvgPath: "M10,8 H16 V10 H10 Z M19,9 A2,2 0 1,1 19,9.1",
    restTextSymbol: "𝄼.",
  },
  {
    name: "Dotted Quarter Note",
    symbol: "♩.",
    description: "Lasts for 1.5 beats in 4/4 time (1 + 0.5)",
    duration: 1.5,
    svgPath:
      "M12,8 C12,5.79 14.24,4 17,4 C19.76,4 22,5.79 22,8 C22,10.21 19.76,12 17,12 C14.24,12 12,10.21 12,8 Z M17,4 L17,20 Z M23,10 A2,2 0 1,1 23,10.1",
    textSymbol: "♩.",
    restSvgPath: "M12,8 C15,12 10,16 14,20 M18,14 A2,2 0 1,1 18,14.1",
    restTextSymbol: "𝄽.",
  },
];

const NoteValueExplorer = () => {
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(60); // BPM
  const [showRests, setShowRests] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // Initialize synth
  useEffect(() => {
    synthRef.current = new Tone.Synth({
      oscillator: {
        type: "triangle",
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    }).toDestination();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      Tone.Transport.cancel();
      Tone.Transport.stop();
    };
  }, []);

  // Update tempo
  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  const playNoteValue = async (index: number) => {
    if (isPlaying) return;

    const noteValue = noteValues[index];
    setSelectedNoteIndex(index);
    setIsPlaying(true);

    try {
      // Ensure audio context is running
      await Tone.start();

      // Calculate note duration in seconds based on tempo
      const beatDuration = 60 / tempo; // seconds per beat
      const durationInSeconds = noteValue.duration * beatDuration;

      // If showing rests, play silence for the duration
      if (showRests) {
        // For rests, we'll just set a timeout for the duration
        setTimeout(() => {
          setIsPlaying(false);
          setSelectedNoteIndex(null);
        }, durationInSeconds * 1000);
      } else {
        // Play the note
        if (synthRef.current) {
          synthRef.current.triggerAttackRelease("C4", durationInSeconds);
        }

        // Reset after the duration
        setTimeout(() => {
          setIsPlaying(false);
        }, durationInSeconds * 1000 + 100); // Add a small buffer
      }
    } catch (error) {
      console.error("Error playing note:", error);
      setIsPlaying(false);
      setSelectedNoteIndex(null);
    }
  };

  const stopPlayback = () => {
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    setSelectedNoteIndex(null);
  };

  return (
    <div className="demo-container">
      <h3 className="component-title">Note Value Explorer</h3>

      <div className="controls">
        <div className="toggle-container">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showRests}
              onChange={() => setShowRests(!showRests)}
              className="toggle-input"
            />
            <span className="toggle-text">Show Rests</span>
          </label>
        </div>

        <div className="tempo-control">
          <Clock size={16} />
          <Slider
            value={tempo}
            onChange={(value) => setTempo(value)}
            min={40}
            max={208}
            step={1}
            label="Tempo"
            showValue={true}
            suffix=" BPM"
          />
        </div>
      </div>

      <div className="note-values-grid">
        {noteValues.map((noteValue, index) => (
          <div
            key={index}
            className={`note-value-card ${
              selectedNoteIndex === index ? "active" : ""
            }`}
            onClick={() => playNoteValue(index)}
          >
            <div className="note-symbol">
              {showRests ? (
                <div className="rest-symbol">{noteValue.restTextSymbol}</div>
              ) : (
                <div className="note-symbol-text">{noteValue.textSymbol}</div>
              )}
            </div>
            <div className="note-info">
              <h4>{noteValue.name}</h4>
              <p>{noteValue.description}</p>
              <div className="duration-indicator">
                <div
                  className="duration-bar"
                  style={{
                    width: `${Math.min(100, noteValue.duration * 25)}%`,
                  }}
                ></div>
              </div>
            </div>
            {isPlaying && selectedNoteIndex === index && (
              <div className="playing-indicator">
                <span>Playing</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="legend">
        <h4>Understanding Note Values</h4>
        <p>
          In standard notation, the duration of a note is shown by its shape.
          The relationship between different note values is based on division by
          two: a half note is half the duration of a whole note, a quarter note
          is half of a half note, and so on.
        </p>
        <p>
          A dot placed after a note increases its duration by half. For example,
          a dotted half note equals a half note plus a quarter note.
        </p>
      </div>

      <style jsx>{`
        .controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .toggle-container {
          display: flex;
          align-items: center;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .toggle-input {
          margin-right: 0.5rem;
        }

        .toggle-text {
          font-size: 0.9rem;
        }

        .tempo-control {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
        }

        .note-values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .note-value-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .note-value-card:hover {
          background-color: var(--component-bg-darker);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .note-value-card.active {
          border-color: var(--primary-blue);
          background-color: hsl(210 50% 50% / 0.1);
        }

        .note-symbol {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 60px;
          height: 60px;
          font-size: 2.5rem;
          margin-right: 1rem;
        }

        .note-symbol-text {
          line-height: 1;
        }

        .rest-symbol {
          line-height: 1;
          font-size: 2.5rem;
        }

        .note-info {
          flex: 1;
        }

        .note-info h4 {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
        }

        .note-info p {
          margin: 0 0 0.5rem 0;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .duration-indicator {
          width: 100%;
          height: 8px;
          background-color: var(--component-bg-darker);
          border-radius: 4px;
          overflow: hidden;
        }

        .duration-bar {
          height: 100%;
          background-color: var(--primary-blue);
          border-radius: 4px;
        }

        .playing-indicator {
          position: absolute;
          top: 0;
          right: 0;
          background-color: var(--primary-blue);
          color: white;
          font-size: 0.7rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0 0 0 8px;
        }

        .legend {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .legend h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .legend p {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
        }

        .legend p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .controls {
            flex-direction: column;
            align-items: stretch;
          }

          .note-values-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default NoteValueExplorer;
