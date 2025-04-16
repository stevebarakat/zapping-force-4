import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "./Button";
import { Select } from "./Select";

// Define available instruments
const INSTRUMENTS = [
  "piano",
  "bass-electric",
  "bassoon",
  "cello",
  "clarinet",
  "contrabass",
  "flute",
  "french-horn",
  "guitar-acoustic",
  "guitar-electric",
  "harmonium",
  "harp",
  "organ",
  "saxophone",
  "trombone",
  "trumpet",
  "tuba",
  "violin",
  "xylophone",
] as const;

type Instrument = (typeof INSTRUMENTS)[number];

interface InstrumentPlayerProps {
  onNotePlay?: (note: string) => void;
}

export const InstrumentPlayer: React.FC<InstrumentPlayerProps> = ({
  onNotePlay,
}) => {
  const [selectedInstrument, setSelectedInstrument] =
    useState<Instrument>("piano");
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const instrumentRef = useRef<Tone.Sampler | null>(null);

  // Initialize the instrument
  useEffect(() => {
    const initializeInstrument = async () => {
      try {
        // Create a new sampler
        const newInstrument = new Tone.Sampler({
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
          baseUrl: `/samples/${selectedInstrument}/`,
          onload: () => {
            console.log(`${selectedInstrument} samples loaded successfully!`);
            setIsLoaded(true);
            setError(null);
          },
          onerror: (error) => {
            console.error(
              `Error loading ${selectedInstrument} samples:`,
              error
            );
            setError(
              `Error loading ${selectedInstrument} samples. Please try another instrument.`
            );
            setTimeout(() => {
              setError(null);
              setIsLoaded(true);
            }, 3000);
          },
        }).toDestination();

        // Set release time for better sound
        newInstrument.release = 0.5;

        // Store the instrument reference
        instrumentRef.current = newInstrument;

        // Start audio context
        await Tone.start();
        console.log("Audio context started");
      } catch (e) {
        console.error("Error initializing instrument:", e);
        setError(
          "Error initializing instrument. Please try another instrument."
        );
        setTimeout(() => {
          setError(null);
          setIsLoaded(true);
        }, 3000);
      }
    };

    initializeInstrument();

    return () => {
      if (instrumentRef.current) {
        instrumentRef.current.dispose();
      }
    };
  }, [selectedInstrument]);

  // Play a note
  const playNote = async (note: string) => {
    if (instrumentRef.current && isLoaded) {
      try {
        // Ensure audio context is running
        if (Tone.context.state !== "running") {
          await Tone.start();
        }
        instrumentRef.current.triggerAttackRelease(note, "2n");
        onNotePlay?.(note);
      } catch (e) {
        console.error("Error playing note:", e);
        setError("Error playing note. Please try another instrument.");
        setTimeout(() => {
          setError(null);
          setIsLoaded(true);
        }, 3000);
      }
    }
  };

  // Define available notes
  const notes = [
    "C4",
    "C#4",
    "D4",
    "D#4",
    "E4",
    "F4",
    "F#4",
    "G4",
    "G#4",
    "A4",
    "A#4",
    "B4",
    "C5",
  ];

  return (
    <div className="p-4">
      <div className="mb-4">
        <Select
          value={selectedInstrument}
          onChange={(value) => setSelectedInstrument(value as Instrument)}
          options={INSTRUMENTS.map((instrument) => ({
            value: instrument,
            label:
              instrument.charAt(0).toUpperCase() +
              instrument.slice(1).replace("-", " "),
          }))}
        />
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {notes.map((note) => (
          <Button
            key={note}
            onClick={() => playNote(note)}
            disabled={!isLoaded}
          >
            {note}
          </Button>
        ))}
      </div>
    </div>
  );
};
