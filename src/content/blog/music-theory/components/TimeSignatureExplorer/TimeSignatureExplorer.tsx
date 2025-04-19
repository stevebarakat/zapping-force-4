import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/Button";
import "./time-signature.css";
import { Slider } from "@/components/Slider";
import { Select } from "@/content/blog/shared/Select";
import VisuallyHidden from "@/components/VisuallyHidden";

interface TimeSignature {
  beats: number;
  beatValue: number;
  name: string;
  description: string;
}

const TimeSignatureExplorer = () => {
  const [beats, setBeats] = useState(4);
  const [beatValue, setBeatValue] = useState(4);
  const [tempo, setTempo] = useState(110);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const [currentAccent, setCurrentAccent] = useState<number | null>(null);

  // References for Tone.js objects
  const clickHighRef = useRef<Tone.Player | Tone.Synth | null>(null);
  const clickMidRef = useRef<Tone.Player | Tone.Synth | null>(null);
  const clickLowRef = useRef<Tone.Player | Tone.Synth | null>(null);
  const loopRef = useRef<Tone.Loop | Tone.Sequence | null>(null);

  // Available time signatures
  const timeSignatures: TimeSignature[] = [
    {
      beats: 2,
      beatValue: 4,
      name: "2/4",
      description: "Simple duple meter. Common in polkas and marches.",
    },
    {
      beats: 3,
      beatValue: 4,
      name: "3/4",
      description: "Simple triple meter. Used in waltzes and minuets.",
    },
    {
      beats: 4,
      beatValue: 4,
      name: "4/4",
      description:
        "Simple quadruple meter. The most common time signature in Western music.",
    },
    {
      beats: 5,
      beatValue: 4,
      name: "5/4",
      description:
        "Complex asymmetrical meter. Used in jazz and progressive rock.",
    },
    {
      beats: 6,
      beatValue: 8,
      name: "6/8",
      description:
        "Compound duple meter. Has a lilting, flowing feel. Common in folk music.",
    },
    {
      beats: 7,
      beatValue: 8,
      name: "7/8",
      description:
        "Complex asymmetrical meter. Common in Eastern European folk music.",
    },
    {
      beats: 12,
      beatValue: 8,
      name: "12/8",
      description: "Compound quadruple meter. Often used in blues and ballads.",
    },
  ];

  // Initialize audio
  useEffect(() => {
    // Create click sounds
    clickHighRef.current = new Tone.Player({
      url: "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/metronome/high.mp3",
      volume: -10,
    }).toDestination();

    clickMidRef.current = new Tone.Player({
      url: "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/metronome/mid.mp3",
      volume: -10,
    }).toDestination();

    clickLowRef.current = new Tone.Player({
      url: "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/metronome/low.mp3",
      volume: -10,
    }).toDestination();

    // Create a synth fallback for clicks
    setTimeout(() => {
      const highClick = clickHighRef.current;
      const midClick = clickMidRef.current;
      const lowClick = clickLowRef.current;

      if (
        (highClick instanceof Tone.Player && !highClick.loaded) ||
        (midClick instanceof Tone.Player && !midClick.loaded) ||
        (lowClick instanceof Tone.Player && !lowClick.loaded)
      ) {
        console.log("Using synth fallback for clicks");

        // Replace with synths
        if (highClick) highClick.dispose();
        if (midClick) midClick.dispose();
        if (lowClick) lowClick.dispose();

        clickHighRef.current = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        }).toDestination();

        clickMidRef.current = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        }).toDestination();

        clickLowRef.current = new Tone.Synth({
          oscillator: { type: "triangle" },
          envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
        }).toDestination();
      }
    }, 3000);

    // Clean up
    return () => {
      if (clickHighRef.current) clickHighRef.current.dispose();
      if (clickLowRef.current) clickLowRef.current.dispose();
      if (loopRef.current) loopRef.current.dispose();
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Update tempo
  useEffect(() => {
    Tone.Transport.bpm.value = tempo;
  }, [tempo]);

  // Handle time signature selection
  const handleTimeSignatureSelect = (sig: TimeSignature) => {
    setBeats(sig.beats);
    setBeatValue(sig.beatValue);

    // If playing, restart with new time signature
    if (isPlaying) {
      stopMetronome();
      setTimeout(() => startMetronome(), 100);
    }
  };

  // Play click sound
  const playClick = (time: number, accentLevel: number) => {
    if (accentLevel === 2) {
      const highClick = clickHighRef.current;
      if (highClick instanceof Tone.Player && highClick.loaded) {
        highClick.start(time);
      } else if (highClick instanceof Tone.Synth) {
        highClick.triggerAttackRelease("G5", "16n", time);
      }
    } else if (accentLevel === 1) {
      const midClick = clickMidRef.current;
      if (midClick instanceof Tone.Player && midClick.loaded) {
        midClick.start(time);
      } else if (midClick instanceof Tone.Synth) {
        midClick.triggerAttackRelease("E5", "16n", time);
      }
    } else {
      const lowClick = clickLowRef.current;
      if (lowClick instanceof Tone.Player && lowClick.loaded) {
        lowClick.start(time);
      } else if (lowClick instanceof Tone.Synth) {
        lowClick.triggerAttackRelease("C5", "16n", time);
      }
    }
  };

  // Start the metronome
  const startMetronome = async () => {
    // Make sure Tone.js is ready
    await Tone.start();

    // Set playing state
    setIsPlaying(true);

    // Set the time signature in the Transport
    Tone.Transport.timeSignature = [beats, beatValue];

    // Determine note value for loop interval based on beatValue
    let subdivision = "4n"; // quarter note by default
    if (beatValue === 8) subdivision = "8n";
    else if (beatValue === 2) subdivision = "2n";

    // Determine compound vs. simple meter
    const isCompound = beatValue === 8 && beats % 3 === 0;

    // Create a sequence of beats
    const beatSequence = Array.from({ length: beats }, (_, i) => {
      // For compound meters, handle different accent levels
      if (isCompound) {
        if (beats === 12) {
          // For 12/8: high accent on first beat, mid accent on first subdivision of each main beat
          if (i === 0) return 2; // First beat gets high accent
          if (i % 3 === 0) return 1; // First subdivision of each main beat gets mid accent
          return 0; // Other subdivisions get low accent
        } else if (beats === 6) {
          // For 6/8: high accent on first beat, mid accent on first subdivision of second main beat
          if (i === 0) return 2; // First beat gets high accent
          if (i === 3) return 1; // First subdivision of second main beat gets mid accent
          return 0; // Other subdivisions get low accent
        } else if (beats === 7) {
          // For 7/8: high accent on first beat, mid accent on first subdivision of each main beat
          if (i === 0) return 2; // First beat gets high accent
          if (i % 3 === 0 && i !== 0) return 1; // First subdivision of each main beat gets mid accent
          return 0; // Other subdivisions get low accent
        }
      }
      // For simple meters, accent the first beat
      return i === 0 ? 1 : 0;
    });

    // Create a new sequence
    let beatIndex = 0;
    loopRef.current = new Tone.Sequence(
      (time, value) => {
        // Update current beat and accent for visualization
        setCurrentBeat(beatIndex);
        setCurrentAccent(value);
        beatIndex = (beatIndex + 1) % beats;

        // Play the appropriate click
        playClick(time, value);
      },
      beatSequence,
      subdivision
    ).start(0);

    // Start the transport
    Tone.Transport.start();
  };

  // Stop the metronome
  const stopMetronome = () => {
    if (loopRef.current) {
      loopRef.current.stop();
    }
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentBeat(null);
    setCurrentAccent(null);
  };

  // Toggle metronome
  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  // Find the current time signature object
  const currentTimeSignature =
    timeSignatures.find(
      (sig) => sig.beats === beats && sig.beatValue === beatValue
    ) || timeSignatures[2]; // Default to 4/4

  // Convert time signatures to options array
  const timeSignatureOptions = timeSignatures.map((sig) => ({
    value: `${sig.beats}/${sig.beatValue}`,
    label: sig.name,
  }));

  return (
    <div className="time-signature-explorer">
      <VisuallyHidden>Time Signature Explorer</VisuallyHidden>

      {/* Time signature selector */}
      <Select
        value={`${beats}/${beatValue}`}
        onChange={(value) => {
          const [beats, beatValue] = value.split("/").map(Number);
          const sig = timeSignatures.find(
            (s) => s.beats === beats && s.beatValue === beatValue
          );
          if (sig) handleTimeSignatureSelect(sig);
        }}
        label="Time Signature"
        disabled={isPlaying}
      >
        {timeSignatureOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {/* Time signature description */}
      <div className="info-box">
        <div className="time-signature-display">
          <span className="time-signature-number">{beats}</span>
          <div className="time-signature-divider"></div>
          <span className="time-signature-number">{beatValue}</span>
        </div>
        <p className="time-signature-description">
          {currentTimeSignature.description}
        </p>
      </div>

      {/* Beat visualization */}
      <div className="beat-visualization">
        <div className="interactive-grid">
          {Array.from({ length: beats }).map((_, index) => (
            <div
              key={index}
              className={`interactive-grid-item ${
                currentBeat === index ? "active" : ""
              } ${
                currentBeat === index
                  ? currentAccent === 2
                    ? "high-accent"
                    : currentAccent === 1
                    ? "mid-accent"
                    : "low-accent"
                  : ""
              }`}
            >
              <span className="beat-number">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tempo control */}
      <div className="tempo-control">
        <label htmlFor="tempo-slider">Tempo</label>
        <span className="tempo-value">{tempo} BPM</span>
        <Slider
          id="tempo-slider"
          min={20}
          max={200}
          value={tempo}
          onChange={(value) => setTempo(value)}
        />
        <div className="tempo-labels">
          <span>Larghissimo</span>
          <span>Moderato</span>
          <span>Presto</span>
        </div>
      </div>

      {/* Play button */}
      <Button
        onClick={toggleMetronome}
        variant={isPlaying ? "secondary" : "primary"}
      >
        {isPlaying ? "Stop" : "Play Metronome"}
      </Button>

      <div className="info-box">
        Time signatures tell us how many beats are in each measure (top number)
        and which note value gets one beat (bottom number). They help organize
        the rhythmic structure of music.
      </div>
    </div>
  );
};

export default TimeSignatureExplorer;
