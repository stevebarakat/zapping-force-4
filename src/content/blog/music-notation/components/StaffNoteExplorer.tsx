import React, { useState, useRef } from "react";
import * as Tone from "tone";
import { Play } from "lucide-react";
import "@/styles/shared/dark-mode.css";
import styles from "./StaffNoteExplorer.module.css";
import { Button } from "@/components/Button";

type Note = {
  name: string;
  frequency: number;
  isLine: boolean;
  position: number; // 1 is bottom line (E4), counting up
};

const StaffNoteExplorer = () => {
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<Tone.Synth | null>(null);

  // Initialize synth
  React.useEffect(() => {
    synthRef.current = new Tone.Synth({
      oscillator: { type: "triangle" },
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
    };
  }, []);

  // Define staff notes in order from bottom to top
  const staffNotes: Note[] = [
    { name: "E4", frequency: 329.63, isLine: true, position: 9 }, // Bottom line
    { name: "F4", frequency: 349.23, isLine: false, position: 8 }, // First space
    { name: "G4", frequency: 392.0, isLine: true, position: 7 }, // Second line
    { name: "A4", frequency: 440.0, isLine: false, position: 6 }, // Second space
    { name: "B4", frequency: 493.88, isLine: true, position: 5 }, // Middle line
    { name: "C5", frequency: 523.25, isLine: false, position: 4 }, // Third space
    { name: "D5", frequency: 587.33, isLine: true, position: 3 }, // Fourth line
    { name: "E5", frequency: 659.25, isLine: false, position: 2 }, // Fourth space
    { name: "F5", frequency: 698.46, isLine: true, position: 1 }, // Top line
  ];

  const playNote = async (note: Note) => {
    if (isPlaying) return;

    setIsPlaying(true);
    setActiveNote(note);

    try {
      await Tone.start();
      if (synthRef.current) {
        synthRef.current.triggerAttackRelease(note.name, "2n");
      }

      setTimeout(() => {
        setIsPlaying(false);
      }, 1500);
    } catch (error) {
      console.error("Error playing note:", error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="demo-container">
      <h3 className="component-title">Staff Note Explorer</h3>

      <div className={styles.staffContainer}>
        <div className={styles.staff}>
          {/* Treble clef */}
          <div className={styles.clef}>𝄞</div>

          {/* Staff lines */}
          <div className={styles.staffLines}>
            {[1, 2, 3, 4, 5].map((line) => (
              <div key={`line-${line}`} className={styles.staffLine} />
            ))}
          </div>

          {/* Note positions */}
          <div className={styles.noteAreas}>
            {[...staffNotes].reverse().map((note) => (
              <div
                key={note.name}
                className={`${styles.noteArea} ${
                  activeNote?.name === note.name ? styles.active : ""
                }`}
                onClick={() => playNote(note)}
              >
                <div className={styles.noteLabel}>{note.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Information panel */}
        <div className="info-box">
          {activeNote ? (
            <>
              <h4>Selected Note: {activeNote.name}</h4>
              <p>
                This note is on {activeNote.isLine ? "a line" : "a space"} of
                the staff.
              </p>
              <p>Frequency: {activeNote.frequency.toFixed(2)} Hz</p>
              <Button onClick={() => playNote(activeNote)} disabled={isPlaying}>
                <Play size={16} />
                {isPlaying ? "Playing..." : "Play Again"}
              </Button>
            </>
          ) : (
            <p>
              Click on a line or space to see and hear its corresponding note.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffNoteExplorer;
