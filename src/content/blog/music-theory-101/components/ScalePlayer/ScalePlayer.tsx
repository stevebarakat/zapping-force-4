import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import "./scale-player.css";
import "@/content/blog/shared/dark-mode.css";
import VisuallyHidden from "@/components/VisuallyHidden";
import { Play } from "lucide-react";
import { Callout } from "@/components/Callout";
import { Select } from "@/content/blog/shared/Select";
import { audioCoordinator } from "../../utils/audioCoordinator";
import { Button } from "@/components/Button";
import { InstrumentPlayer } from "../shared/InstrumentPlayer";
import { INSTRUMENT_TYPES } from "@/consts";
import { InstrumentProvider } from "../../lib/contexts/InstrumentContext";
import { useInstrument } from "../../lib/hooks/useInstrument";

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

const ScalePlayerContent = () => {
  const [selectedScale, setSelectedScale] = useState<ScaleType>("major");
  const [selectedRoot, setSelectedRoot] = useState("C4");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState("piano");
  const [octaveRange, setOctaveRange] = useState({ min: 3, max: 5 });
  const containerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

  // Get instrument context
  const { playNote, stopNote, isSamplerReady } = useInstrument();

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
      const transport = audioCoordinator.registerComponent(
        "scale-player",
        stopScale
      );
      // Set up any transport-specific settings here
      transport.bpm.value = 120;
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
    if (isPlaying || !audioCoordinator.isComponentActive("scale-player"))
      return;

    // Make sure Tone.js is ready
    await Tone.start();
    setIsPlaying(true);

    const scaleNotes = generateScaleNotes();
    let currentIndex = 0;
    let isGoingUp = true;

    // Create a loop to play the scale
    loopRef.current = new Tone.Loop((time) => {
      // Only play if this component is still active
      if (!audioCoordinator.isComponentActive("scale-player")) {
        if (loopRef.current) {
          loopRef.current.stop();
        }
        setIsPlaying(false);
        return;
      }

      // Play the current note
      if (isSamplerReady) {
        playNote(scaleNotes[currentIndex], "8n");
      }

      // Update current note for visualization
      setCurrentNote(currentIndex);

      // Move to next note
      if (isGoingUp) {
        currentIndex++;
        // If we've reached the top, start going down
        if (currentIndex >= scaleNotes.length) {
          isGoingUp = false;
          currentIndex = scaleNotes.length - 1;
        }
      } else {
        currentIndex--;
        // If we've reached the bottom, stop the loop
        if (currentIndex < 0) {
          // Update visualization one last time before stopping
          setCurrentNote(0);
          if (loopRef.current) {
            loopRef.current.stop();
          }
          setIsPlaying(false);
        }
      }
    }, "4n");

    // Start the loop
    const transport = audioCoordinator.getComponentTransport("scale-player");
    if (transport && loopRef.current) {
      loopRef.current.start(0);
      transport.start();
    }
  };

  // Stop playing the scale
  const stopScale = () => {
    if (!isPlaying) return;

    const transport = audioCoordinator.getComponentTransport("scale-player");
    if (transport) {
      transport.stop();
    }

    if (loopRef.current) {
      loopRef.current.stop();
    }
    setIsPlaying(false);
    setCurrentNote(null);
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

  // Get active keys for visualization
  const getActiveKeys = () => {
    if (currentNote === null) return [];
    const scaleNotes = generateScaleNotes();
    return [scaleNotes[currentNote]];
  };

  return (
    <div className="demo-container" ref={containerRef}>
      <VisuallyHidden as="h3">Scale Explorer</VisuallyHidden>
      <div className="controls">
        {/* Play button */}
        <Button
          onClick={isPlaying ? stopScale : playScale}
          style={{ alignSelf: "flex-end" }}
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
          style={{ maxWidth: "15ch" }}
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

      <InstrumentPlayer
        instrumentType={selectedInstrument}
        octaveRange={octaveRange}
        showLabels={true}
        activeKeys={getActiveKeys()}
        onInstrumentChange={(instrument) => {
          setSelectedInstrument(instrument);
        }}
        onOctaveRangeChange={(newRange) => setOctaveRange(newRange)}
      />
    </div>
  );
};

const ScalePlayer = () => {
  return (
    <InstrumentProvider>
      <ScalePlayerContent />
    </InstrumentProvider>
  );
};

export default ScalePlayer;
