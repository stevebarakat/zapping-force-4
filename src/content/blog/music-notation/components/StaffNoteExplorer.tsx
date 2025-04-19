import React, { useState, useRef } from "react";
import type { CSSProperties } from "react";
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

// Define custom property type
interface CustomStyle extends CSSProperties {
  "--label-offset": string;
}

const StaffNoteExplorer = () => {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const samplerRef = useRef<Tone.Sampler | null>(null);

  // Initialize sampler
  React.useEffect(() => {
    const baseUrl = "https://tonejs.github.io/audio/salamander/";
    const sampleConfig: Partial<Tone.SamplerOptions> = {
      urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
      },
      baseUrl,
      onload: () => {
        setIsLoaded(true);
      },
    };

    samplerRef.current = new Tone.Sampler(sampleConfig).toDestination();

    return () => {
      if (samplerRef.current) {
        samplerRef.current.dispose();
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
    if (!isLoaded) return;

    try {
      await Tone.start();
      if (samplerRef.current) {
        setActiveNotes((prev) => new Set(prev).add(note.name));
        samplerRef.current.triggerAttackRelease(note.name, "2n");

        // Remove note from active set after it finishes playing
        setTimeout(() => {
          setActiveNotes((prev) => {
            const newSet = new Set(prev);
            newSet.delete(note.name);
            return newSet;
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Error playing note:", error);
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
            {[...staffNotes].reverse().map((note, index) => (
              <div
                key={note.name}
                className={`${styles.noteArea} ${
                  activeNotes.has(note.name) ? styles.active : ""
                }`}
                onClick={() => playNote(note)}
              >
                <div
                  className={styles.noteLabel}
                  style={
                    { "--label-offset": `${20 + index * 15}px` } as CustomStyle
                  }
                >
                  {note.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information panel */}
        <div className="info-box">
          {!isLoaded ? (
            <p>Loading piano samples...</p>
          ) : activeNotes.size > 0 ? (
            <>
              <h4>Playing Notes: {Array.from(activeNotes).join(", ")}</h4>
              <p>Click on multiple lines or spaces to play notes together!</p>
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
