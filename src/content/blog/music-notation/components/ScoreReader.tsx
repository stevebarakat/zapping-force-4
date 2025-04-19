import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Music, Play, Pause } from "lucide-react";
import { Slider } from "@/components/Slider";

type Note = {
  name: string; // e.g., "C4"
  duration: string; // e.g., "4n" for quarter note
  position: number; // vertical position on staff
  measure: number; // which measure it belongs to
  beat: number; // position within measure (0-3 for 4/4 time)
  dotted?: boolean;
  accidental?: "sharp" | "flat" | "natural";
  graceNote?: boolean;
};

type MusicScore = {
  title: string;
  composer: string;
  timeSignature: [number, number]; // [beats per measure, beat value]
  keySignature: {
    sharps: number;
    flats: number;
  };
  tempo: number; // in BPM
  notes: Note[];
};

// Example music scores (simple melodies)
const musicScores: MusicScore[] = [
  {
    title: "Twinkle, Twinkle, Little Star",
    composer: "Traditional",
    timeSignature: [4, 4],
    keySignature: { sharps: 0, flats: 0 }, // C major
    tempo: 80,
    notes: [
      { name: "C4", duration: "4n", position: 11, measure: 0, beat: 0 },
      { name: "C4", duration: "4n", position: 11, measure: 0, beat: 1 },
      { name: "G4", duration: "4n", position: 7, measure: 0, beat: 2 },
      { name: "G4", duration: "4n", position: 7, measure: 0, beat: 3 },
      { name: "A4", duration: "4n", position: 6, measure: 1, beat: 0 },
      { name: "A4", duration: "4n", position: 6, measure: 1, beat: 1 },
      { name: "G4", duration: "2n", position: 7, measure: 1, beat: 2 },
      { name: "F4", duration: "4n", position: 8, measure: 2, beat: 0 },
      { name: "F4", duration: "4n", position: 8, measure: 2, beat: 1 },
      { name: "E4", duration: "4n", position: 9, measure: 2, beat: 2 },
      { name: "E4", duration: "4n", position: 9, measure: 2, beat: 3 },
      { name: "D4", duration: "4n", position: 10, measure: 3, beat: 0 },
      { name: "D4", duration: "4n", position: 10, measure: 3, beat: 1 },
      { name: "C4", duration: "2n", position: 11, measure: 3, beat: 2 },
    ],
  },
  {
    title: "Mary Had a Little Lamb",
    composer: "Traditional",
    timeSignature: [4, 4],
    keySignature: { sharps: 0, flats: 0 }, // C major
    tempo: 90,
    notes: [
      { name: "E4", duration: "4n", position: 9, measure: 0, beat: 0 },
      { name: "D4", duration: "4n", position: 10, measure: 0, beat: 1 },
      { name: "C4", duration: "4n", position: 11, measure: 0, beat: 2 },
      { name: "D4", duration: "4n", position: 10, measure: 0, beat: 3 },
      { name: "E4", duration: "4n", position: 9, measure: 1, beat: 0 },
      { name: "E4", duration: "4n", position: 9, measure: 1, beat: 1 },
      { name: "E4", duration: "2n", position: 9, measure: 1, beat: 2 },
      { name: "D4", duration: "4n", position: 10, measure: 2, beat: 0 },
      { name: "D4", duration: "4n", position: 10, measure: 2, beat: 1 },
      { name: "D4", duration: "2n", position: 10, measure: 2, beat: 2 },
      { name: "E4", duration: "4n", position: 9, measure: 3, beat: 0 },
      { name: "G4", duration: "4n", position: 7, measure: 3, beat: 1 },
      { name: "G4", duration: "2n", position: 7, measure: 3, beat: 2 },
    ],
  },
  {
    title: "Ode to Joy (Simplified)",
    composer: "Ludwig van Beethoven",
    timeSignature: [4, 4],
    keySignature: { sharps: 0, flats: 0 }, // C major
    tempo: 100,
    notes: [
      { name: "E4", duration: "4n", position: 9, measure: 0, beat: 0 },
      { name: "E4", duration: "4n", position: 9, measure: 0, beat: 1 },
      { name: "F4", duration: "4n", position: 8, measure: 0, beat: 2 },
      { name: "G4", duration: "4n", position: 7, measure: 0, beat: 3 },
      { name: "G4", duration: "4n", position: 7, measure: 1, beat: 0 },
      { name: "F4", duration: "4n", position: 8, measure: 1, beat: 1 },
      { name: "E4", duration: "4n", position: 9, measure: 1, beat: 2 },
      { name: "D4", duration: "4n", position: 10, measure: 1, beat: 3 },
      { name: "C4", duration: "4n", position: 11, measure: 2, beat: 0 },
      { name: "C4", duration: "4n", position: 11, measure: 2, beat: 1 },
      { name: "D4", duration: "4n", position: 10, measure: 2, beat: 2 },
      { name: "E4", duration: "4n", position: 9, measure: 2, beat: 3 },
      { name: "E4", duration: "4n", position: 9, measure: 3, beat: 0 },
      { name: "D4", duration: "4n", position: 10, measure: 3, beat: 1 },
      { name: "D4", duration: "2n", position: 10, measure: 3, beat: 2 },
    ],
  },
];

// Mapping of note durations to note head styles
const noteHeadStyles = {
  "1n": { filled: false, headSize: 1.0 }, // Whole note (open)
  "2n": { filled: false, headSize: 1.0 }, // Half note (open)
  "4n": { filled: true, headSize: 1.0 }, // Quarter note (filled)
  "8n": { filled: true, headSize: 1.0 }, // Eighth note (filled)
  "16n": { filled: true, headSize: 1.0 }, // Sixteenth note (filled)
};

// Mapping of note durations to stem additions (flags)
const noteStemFlags = {
  "1n": "", // Whole note (no stem)
  "2n": "stem", // Half note (stem only)
  "4n": "stem", // Quarter note (stem only)
  "8n": "flag", // Eighth note (stem with flag)
  "16n": "flag2", // Sixteenth note (stem with double flag)
};

function ScoreReader() {
  const [selectedScore, setSelectedScore] = useState<MusicScore>(
    musicScores[0]
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 1.0 = normal tempo

  const synthRef = useRef<Tone.Synth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const totalMeasures =
    Math.max(...selectedScore.notes.map((note) => note.measure)) + 1;

  // Initialize synth
  useEffect(function initSynth() {
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

    return function cleanup() {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Play the selected score
  async function playScore() {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    try {
      // Ensure audio context is running
      await Tone.start();
      setIsPlaying(true);

      // Calculate adjusted tempo
      const adjustedTempo = selectedScore.tempo * playbackSpeed;
      Tone.Transport.bpm.value = adjustedTempo;

      // Set time signature
      Tone.Transport.timeSignature = selectedScore.timeSignature;

      // Define events for the sequence
      const events = selectedScore.notes.map((note, index) => ({
        time: `${note.measure}:${note.beat}`,
        note: note.name,
        duration: note.duration,
        index,
      }));

      // Create a sequence
      sequenceRef.current = new Tone.Part(function (time, event) {
        // Update UI to show current note
        setCurrentNoteIndex(event.index);

        // Play the note
        if (synthRef.current) {
          // Get duration in seconds based on tempo
          const durationInSeconds = Tone.Time(event.duration).toSeconds();
          synthRef.current.triggerAttackRelease(
            event.note,
            durationInSeconds,
            time
          );
        }
      }, events).start(0);

      // Start the transport
      Tone.Transport.start();

      // Calculate total duration and set auto-stop
      const lastNote = selectedScore.notes[selectedScore.notes.length - 1];
      const lastMeasure = lastNote.measure;
      const lastBeat = lastNote.beat;
      const lastDuration = Tone.Time(lastNote.duration).toSeconds();

      // Convert to seconds based on tempo
      const measureDuration =
        (60 / adjustedTempo) * selectedScore.timeSignature[0];
      const totalDuration =
        lastMeasure * measureDuration +
        (lastBeat + 1) * (measureDuration / selectedScore.timeSignature[0]) +
        lastDuration;

      // Add a little buffer at the end
      setTimeout(function () {
        stopPlayback();
      }, (totalDuration + 0.5) * 1000);
    } catch (error) {
      console.error("Error playing score:", error);
      setIsPlaying(false);
    }
  }

  // Stop playback
  function stopPlayback() {
    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    setCurrentNoteIndex(null);
  }

  // Get note style based on duration
  function getNoteStyle(noteDuration: string) {
    return (
      noteHeadStyles[noteDuration as keyof typeof noteHeadStyles] || {
        filled: true,
        headSize: 1.0,
      }
    );
  }

  // Get note flag style based on duration
  function getNoteFlag(noteDuration: string) {
    return noteStemFlags[noteDuration as keyof typeof noteStemFlags] || "stem";
  }

  // Calculate x position for a note based on measure and beat
  function getXPosition(measure: number, beat: number): number {
    const startX = 120; // After clef and time signature
    const measureWidth = 180;
    const beatWidth = measureWidth / selectedScore.timeSignature[0];

    return startX + measure * measureWidth + beat * beatWidth;
  }

  // Render ledger lines if needed
  function renderLedgerLines(note: Note) {
    const staffTopLine = 40;
    const staffBottomLine = 80;
    const ledgerLines = [];

    // Add ledger lines above the staff
    if (note.position < 5) {
      for (let pos = 4; pos >= note.position; pos -= 2) {
        const yPos = staffTopLine - (5 - pos) * 5;
        ledgerLines.push(
          <div
            key={`ledger-top-${pos}-${note.measure}-${note.beat}`}
            className="ledger-line"
            style={{
              top: `${yPos}px`,
              left: `${getXPosition(note.measure, note.beat) - 10}px`,
            }}
          />
        );
      }
    }

    // Add ledger lines below the staff
    if (note.position > 13) {
      for (let pos = 14; pos <= note.position; pos += 2) {
        const yPos = staffBottomLine + (pos - 13) * 5;
        ledgerLines.push(
          <div
            key={`ledger-bottom-${pos}-${note.measure}-${note.beat}`}
            className="ledger-line"
            style={{
              top: `${yPos}px`,
              left: `${getXPosition(note.measure, note.beat) - 10}px`,
            }}
          />
        );
      }
    }

    return ledgerLines;
  }

  return (
    <div className="demo-container">
      <h3 className="component-title">Score Reader</h3>

      <div className="score-controls">
        <div className="score-selector">
          <label htmlFor="score-select">Select Piece:</label>
          <select
            id="score-select"
            value={selectedScore.title}
            onChange={(e) => {
              const selected = musicScores.find(
                (score) => score.title === e.target.value
              );
              if (selected) {
                stopPlayback();
                setSelectedScore(selected);
              }
            }}
            disabled={isPlaying}
            className="select"
          >
            {musicScores.map((score) => (
              <option key={score.title} value={score.title}>
                {score.title}
              </option>
            ))}
          </select>
        </div>

        <div className="speed-control">
          <Slider
            value={playbackSpeed * 100}
            onChange={(value) => setPlaybackSpeed(value / 100)}
            min={50}
            max={150}
            step={10}
            label="Speed"
            showValue={true}
            suffix="%"
          />
        </div>

        <button
          onClick={playScore}
          className={`button ${isPlaying ? "stop" : "play"}`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Stop" : "Play"}
        </button>
      </div>

      <div className="score-header">
        <h4 className="score-title">{selectedScore.title}</h4>
        <p className="score-composer">By {selectedScore.composer}</p>
      </div>

      <div className="score-display">
        <div className="scroll-container">
          <div
            className="staff"
            style={{ width: `${totalMeasures * 180 + 120}px` }}
          >
            {/* Clef and time signature */}
            <div className="clef-time-signature">
              <div className="clef">𝄞</div>
              <div className="time-signature">
                <div className="time-upper">
                  {selectedScore.timeSignature[0]}
                </div>
                <div className="time-lower">
                  {selectedScore.timeSignature[1]}
                </div>
              </div>
            </div>

            {/* Staff lines */}
            <div className="staff-lines">
              {[0, 1, 2, 3, 4].map((line) => (
                <div key={`line-${line}`} className="staff-line" />
              ))}
            </div>

            {/* Measure bars */}
            <div className="measure-bars">
              {Array.from({ length: totalMeasures + 1 }).map((_, index) => (
                <div
                  key={`bar-${index}`}
                  className="measure-bar"
                  style={{ left: `${120 + index * 180}px` }}
                />
              ))}
            </div>

            {/* Notes */}
            <div className="notes">
              {selectedScore.notes.map((note, index) => {
                const noteStyle = getNoteStyle(note.duration);
                const noteFlag = getNoteFlag(note.duration);
                const xPos = getXPosition(note.measure, note.beat);
                const yPos = 40 + (note.position - 5) * 5;

                return (
                  <React.Fragment key={`note-${index}`}>
                    {/* Render ledger lines if needed */}
                    {renderLedgerLines(note)}

                    {/* Note head */}
                    <div
                      className={`note ${noteStyle.filled ? "filled" : ""} ${
                        currentNoteIndex === index ? "active" : ""
                      }`}
                      style={{
                        left: `${xPos}px`,
                        top: `${yPos}px`,
                        transform: `scale(${noteStyle.headSize})`,
                      }}
                    >
                      {/* Note stem and flags for notes that have them */}
                      {noteFlag !== "" && (
                        <div className={`note-stem ${noteFlag}`}>
                          {noteFlag === "flag" && <div className="flag" />}
                          {noteFlag === "flag2" && (
                            <>
                              <div className="flag flag-top" />
                              <div className="flag flag-bottom" />
                            </>
                          )}
                        </div>
                      )}

                      {/* Dot for dotted notes */}
                      {note.dotted && <div className="note-dot" />}

                      {/* Accidentals */}
                      {note.accidental === "sharp" && (
                        <div className="accidental sharp">♯</div>
                      )}
                      {note.accidental === "flat" && (
                        <div className="accidental flat">♭</div>
                      )}
                      {note.accidental === "natural" && (
                        <div className="accidental natural">♮</div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="score-info">
        <p>
          <strong>Key:</strong>{" "}
          {selectedScore.keySignature.sharps > 0
            ? `${selectedScore.keySignature.sharps} sharp${
                selectedScore.keySignature.sharps > 1 ? "s" : ""
              }`
            : selectedScore.keySignature.flats > 0
            ? `${selectedScore.keySignature.flats} flat${
                selectedScore.keySignature.flats > 1 ? "s" : ""
              }`
            : "C major / A minor"}
        </p>
        <p>
          <strong>Time Signature:</strong> {selectedScore.timeSignature[0]}/
          {selectedScore.timeSignature[1]}
        </p>
        <p>
          <strong>Tempo:</strong> {selectedScore.tempo} BPM
        </p>
      </div>

      <style jsx>{`
        .score-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .score-selector {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .select {
          padding: 0.25rem 0.5rem;
          border: 1px solid var(--component-border);
          border-radius: 4px;
          background-color: var(--component-bg);
          color: var(--text-primary);
          cursor: pointer;
        }

        .speed-control {
          flex: 1;
          min-width: 200px;
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
        }

        .button.play {
          background-color: var(--primary-blue);
          color: white;
        }

        .button.stop {
          background-color: hsl(0 80% 50%);
          color: white;
        }

        .score-header {
          text-align: center;
          margin-bottom: 1rem;
        }

        .score-title {
          font-size: 1.25rem;
          margin: 0 0 0.25rem 0;
        }

        .score-composer {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .score-display {
          width: 100%;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .scroll-container {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .staff {
          position: relative;
          height: 120px;
          min-width: 500px;
          padding-top: 10px;
        }

        .clef-time-signature {
          position: absolute;
          left: 10px;
          top: 0;
          display: flex;
          align-items: center;
          height: 100%;
        }

        .clef {
          font-size: 5rem;
          line-height: 0;
          color: var(--text-primary);
        }

        .time-signature {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-left: 20px;
          font-size: 2rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .staff-lines {
          position: absolute;
          top: 40px;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 40px;
        }

        .staff-line {
          height: 1px;
          width: 100%;
          background-color: var(--text-primary);
        }

        .measure-bars {
          position: absolute;
          top: 30px;
          left: 0;
          right: 0;
          height: 60px;
        }

        .measure-bar {
          position: absolute;
          top: 0;
          height: 100%;
          width: 1px;
          background-color: var(--text-primary);
        }

        .notes {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .note {
          position: absolute;
          width: 12px;
          height: 10px;
          background-color: transparent;
          border: 2px solid var(--text-primary);
          border-radius: 50%;
          transform-origin: center;
        }

        .note.filled {
          background-color: var(--text-primary);
        }

        .note.active {
          background-color: var(--primary-blue);
          border-color: var(--primary-blue);
        }

        .note-stem {
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 30px;
          background-color: var(--text-primary);
          transform-origin: bottom right;
          transform: translateY(-100%);
        }

        .note.active .note-stem {
          background-color: var(--primary-blue);
        }

        .flag {
          position: absolute;
          top: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-top: 2px solid var(--text-primary);
          border-right: 2px solid var(--text-primary);
          border-radius: 0 100% 0 0;
        }

        .note.active .flag {
          border-color: var(--primary-blue);
        }

        .flag-top {
          top: 0;
        }

        .flag-bottom {
          top: 10px;
        }

        .note-dot {
          position: absolute;
          top: 50%;
          right: -10px;
          width: 4px;
          height: 4px;
          background-color: var(--text-primary);
          border-radius: 50%;
          transform: translateY(-50%);
        }

        .note.active .note-dot {
          background-color: var(--primary-blue);
        }

        .accidental {
          position: absolute;
          top: 50%;
          left: -15px;
          font-size: 1.2rem;
          line-height: 0;
          transform: translateY(-50%);
          color: var(--text-primary);
        }

        .note.active .accidental {
          color: var(--primary-blue);
        }

        .ledger-line {
          position: absolute;
          width: 20px;
          height: 1px;
          background-color: var(--text-primary);
        }

        .score-info {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .score-info p {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
        }

        .score-info p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .score-controls {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

export default ScoreReader;
