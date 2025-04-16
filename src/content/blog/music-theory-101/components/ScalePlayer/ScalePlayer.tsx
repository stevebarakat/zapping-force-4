import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import "./scale-player.css";
import "@/content/blog/shared/dark-mode.css";
import VisuallyHidden from "@/components/VisuallyHidden";
import { Play } from "lucide-react";
import { Callout } from "@/components/Callout";
import { Select } from "@/content/blog/shared/Select";
import { audioCoordinator } from "../ClientComponents";
import { INSTRUMENT_TYPES } from "@/consts";
import SharedKeyboard from "../shared/SharedKeyboard/SharedKeyboard";
import { Button } from "@/components/Button";

type ScaleType =
  | "major"
  | "minor"
  | "pentatonic"
  | "blues"
  | "dorian"
  | "mixolydian";

type Scale = {
  name: string;
  pattern: number[];
  description: string;
};

const ScalePlayer = () => {
  const [selectedScale, setSelectedScale] = useState<ScaleType>("major");
  const [selectedRoot, setSelectedRoot] = useState("C4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const keyboardRef = useRef<any>(null);

  // Define scale patterns (intervals from the root note)
  const scales: Record<ScaleType, Scale> = {
    major: {
      name: "Major Scale",
      pattern: [0, 2, 4, 5, 7, 9, 11, 12],
      description:
        "Bright and happy sounding. Used in most pop, rock, and classical music.",
    },
    minor: {
      name: "Natural Minor Scale",
      pattern: [0, 2, 3, 5, 7, 8, 10, 12],
      description:
        "Melancholic or sad sounding. Common in emotional ballads and many genres.",
    },
    pentatonic: {
      name: "Major Pentatonic Scale",
      pattern: [0, 2, 4, 7, 9, 12],
      description:
        "Five-note scale with no semitones. Used in folk and blues music.",
    },
    blues: {
      name: "Blues Scale",
      pattern: [0, 3, 5, 6, 7, 10, 12],
      description:
        'Based on the minor pentatonic with an added "blue note". Foundation of blues.',
    },
    dorian: {
      name: "Dorian Mode",
      pattern: [0, 2, 3, 5, 7, 9, 10, 12],
      description:
        "Minor mode with a raised 6th. Common in jazz and Celtic music.",
    },
    mixolydian: {
      name: "Mixolydian Mode",
      pattern: [0, 2, 4, 5, 7, 9, 10, 12],
      description:
        "Major scale with a flattened 7th. Used in folk and rock music.",
    },
  };

  // Root note options
  const rootNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  // Handle audio initialization
  useEffect(() => {
    const handleClick = async () => {
      if (!isInitialized) {
        await Tone.start();
        setIsInitialized(true);
      }
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isInitialized]);

  // Register with audio coordinator
  useEffect(() => {
    if (isInitialized) {
      audioCoordinator.registerComponent("scale-player");
    }

    return () => {
      if (isInitialized) {
        audioCoordinator.unregisterComponent("scale-player");
        setIsPlaying(false);
        setCurrentNote(null);
        setIsInitialized(false);
      }
    };
  }, [isInitialized]);

  // Generate notes for the selected scale
  const generateScaleNotes = (): string[] => {
    const rootIndex = rootNotes.indexOf(selectedRoot.slice(0, -1));
    const octave = parseInt(selectedRoot.slice(-1));

    return scales[selectedScale].pattern.map((interval: number) => {
      const noteIndex = (rootIndex + interval) % 12;
      const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
      return `${rootNotes[noteIndex]}${noteOctave}`;
    });
  };

  // Play the selected scale
  const playScale = async () => {
    if (
      isPlaying ||
      !keyboardRef.current ||
      !audioCoordinator.isComponentActive("scale-player")
    )
      return;

    setIsPlaying(true);
    const notes = generateScaleNotes();

    // Schedule the notes to play in sequence
    const duration = 0.4; // Duration of each note

    notes.forEach((note: string, index: number) => {
      if (!audioCoordinator.isComponentActive("scale-player")) {
        setIsPlaying(false);
        setCurrentNote(null);
        return;
      }

      // Use the keyboard's playNote method
      keyboardRef.current?.playNote(note, Tone.now() + index * duration);

      // Update current note being played
      setTimeout(() => {
        if (!audioCoordinator.isComponentActive("scale-player")) {
          setIsPlaying(false);
          setCurrentNote(null);
          return;
        }

        setCurrentNote(index);

        // Reset when done
        if (index === notes.length - 1) {
          setTimeout(() => {
            setIsPlaying(false);
            setCurrentNote(null);
          }, duration * 1000);
        }
      }, index * duration * 1000);
    });
  };

  // Convert scales object to options array
  const scaleOptions = Object.entries(scales).map(([key, scale]) => ({
    value: key,
    label: scale.name,
  }));

  // Convert root notes to options array
  const rootNoteOptions = rootNotes.map((note) => ({
    value: `${note}4`,
    label: note,
  }));

  return (
    <div className="demo-container" ref={containerRef}>
      <VisuallyHidden as="h3">Scale Explorer</VisuallyHidden>
      <div className="flex between">
        {/* Play button */}
        <Button
          onClick={playScale}
          style={{ alignSelf: "flex-end" }}
          disabled={isPlaying}
        >
          <Play />
          {isPlaying ? "Playing..." : "Play"}
        </Button>
        {/* Scale Type Selector */}
        <Select
          id="scale-type"
          value={selectedScale}
          onChange={(value) => setSelectedScale(value as ScaleType)}
          label="Scale Type"
        >
          {scaleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {/* Root Note Selector */}
        <Select
          id="root-note"
          value={selectedRoot}
          onChange={setSelectedRoot}
          label="Root Note"
          disabled={isPlaying}
        >
          {rootNoteOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="info-box">{scales[selectedScale].description}</div>

      <div className="interactive-grid">
        {generateScaleNotes().map((note, index) => (
          <div
            key={index}
            className={`interactive-grid-item ${
              currentNote === index ? "active" : ""
            }`}
          >
            {note}
          </div>
        ))}
      </div>

      {/* Hidden keyboard for audio playback */}
      <div style={{ display: "none" }}>
        <SharedKeyboard
          ref={keyboardRef}
          instrumentType={INSTRUMENT_TYPES.PIANO}
          octaveRange={{ min: 2, max: 6 }}
          showLabels={false}
          onKeyClick={() => {}}
          showOctaves={false}
        />
      </div>
    </div>
  );
};

export default ScalePlayer;
