import React, { useState, useEffect, useRef } from "react";
import * as Tone from "tone";
import { Button } from "@/components/Button";
import "./chord-progression.css";
import "@/styles/shared/dark-mode.css";
import { Select } from "@/content/blog/shared/Select";
import VisuallyHidden from "@/components/VisuallyHidden";
import { INSTRUMENT_TYPES } from "@/consts";
import { Slider } from "@/components/Slider";
import { Play } from "lucide-react";
import { InstrumentPlayer } from "../shared/InstrumentPlayer";
import { InstrumentProvider } from "../../lib/contexts/InstrumentContext";

// Define types
type Note = string;
type ChordType = "major" | "minor" | "dom7" | "maj7" | "min7";
type ProgressionKey =
  | "pop"
  | "fifties"
  | "blues"
  | "andalusian"
  | "jazz"
  | "canon";

interface Progression {
  name: string;
  numerals: string[];
  pattern: string;
  chordTypes: ChordType[];
  description: string;
}

interface Chord {
  numeral: string;
  notes: string[];
  name: string;
}

interface Progressions {
  [key: string]: Progression;
}

const ChordProgressionPlayerContent = () => {
  const [selectedProgression, setSelectedProgression] =
    useState<ProgressionKey>("pop");
  const [selectedKey, setSelectedKey] = useState<Note>("C");
  const [currentChord, setCurrentChord] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(
    INSTRUMENT_TYPES.PIANO
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [bpm, setBpm] = useState(80);
  const [octaveRange, setOctaveRange] = useState({ min: 2, max: 5 });

  // Reference to synth
  const synthRef = useRef<Tone.PolySynth<Tone.Synth> | Tone.Sampler | null>(
    null
  );
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // Define notes
  const allNotes: Note[] = [
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

  // Define common chord progressions (in Roman numerals)
  const progressions: Progressions = {
    pop: {
      name: "Pop Progression",
      numerals: ["I", "V", "vi", "IV"],
      pattern: "I - V - vi - IV",
      chordTypes: ["major", "major", "minor", "major"],
      description:
        "The most common progression in pop music. Used in countless hit songs.",
    },
    fifties: {
      name: "50s Progression",
      numerals: ["I", "vi", "IV", "V"],
      pattern: "I - vi - IV - V",
      chordTypes: ["major", "minor", "major", "major"],
      description:
        "Classic doo-wop progression from the 1950s. Creates a nostalgic feeling.",
    },
    blues: {
      name: "12-Bar Blues",
      pattern: "I-I-I-I-IV-IV-I-I-V-IV-I-V",
      numerals: [
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "IV",
        "IV",
        "IV",
        "IV",
        "IV",
        "IV",
        "IV",
        "IV",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "I",
        "V",
        "V",
        "V",
        "V",
        "IV",
        "IV",
        "IV",
        "IV",
        "I",
        "I",
        "I",
        "I",
        "V",
        "V",
        "V",
        "V",
      ],
      chordTypes: [
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
        "dom7",
      ],
      description:
        "The foundation of blues and early rock and roll. Uses dominant 7th chords throughout.",
    },
    andalusian: {
      name: "Andalusian Cadence",
      numerals: ["i", "VII", "VI", "V"],
      pattern: "i - VII - VI - V",
      chordTypes: ["minor", "major", "major", "major"],
      description:
        "Descending progression from Spanish flamenco music. Creates a dramatic, exotic sound.",
    },
    jazz: {
      name: "Jazz Progression",
      numerals: ["ii", "V", "I"],
      pattern: "ii - V - I",
      chordTypes: ["min7", "dom7", "maj7"],
      description:
        "The most common harmonic movement in jazz. Creates sophisticated harmony.",
    },
    canon: {
      name: "Canon Progression",
      numerals: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"],
      pattern: "I - V - vi - iii - IV - I - IV - V",
      chordTypes: [
        "major",
        "major",
        "minor",
        "minor",
        "major",
        "major",
        "major",
        "major",
      ],
      description:
        "Based on Pachelbel's Canon. Creates a flowing, circular feeling.",
    },
  };

  // Define chord types and their intervals
  const chordTypes: Record<ChordType, number[]> = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    dom7: [0, 4, 7, 10],
    maj7: [0, 4, 7, 11],
    min7: [0, 3, 7, 10],
  };

  // Convert Roman numeral to scale degree
  const romanToScaleDegree = (roman: string): number => {
    const numerals: Record<string, number> = {
      i: 0,
      I: 0,
      ii: 1,
      II: 1,
      iii: 2,
      III: 2,
      iv: 3,
      IV: 3,
      v: 4,
      V: 4,
      vi: 5,
      VI: 5,
      vii: 6,
      VII: 6,
    };
    return numerals[roman];
  };

  // Initialize synth
  useEffect(() => {
    const initializeInstrument = async () => {
      try {
        let newInstrument: Tone.PolySynth<Tone.Synth> | Tone.Sampler;

        // Use Tone.js built-in samples for reliability
        if (selectedInstrument === INSTRUMENT_TYPES.SYNTH) {
          newInstrument = new Tone.PolySynth(Tone.Synth, {
            envelope: {
              attack: 0.02,
              decay: 0.1,
              sustain: 0.3,
              release: 1,
            },
          }).toDestination();
          setIsLoaded(true);
          synthRef.current = newInstrument as Tone.PolySynth;
        } else {
          // For sampled instruments, use different configurations based on instrument type
          let baseUrl = "https://tonejs.github.io/audio/salamander/";
          let sampleConfig: Partial<Tone.SamplerOptions> = {
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
            baseUrl: "",
            onload: () => {},
            onerror: () => {},
          };

          // Customize the sampler based on instrument type
          switch (selectedInstrument) {
            case INSTRUMENT_TYPES.PIANO:
              // Use default piano samples
              break;

            case INSTRUMENT_TYPES.XYLO:
              // Use local xylophone samples in MP3 format
              const xyloUrls: Record<string, string> = {};
              const xyloNotes = [
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
              const xyloNotesOctave4 = ["F", "F#", "G", "G#", "A", "A#", "B"];
              xyloNotesOctave4.forEach((note) => {
                const noteWithOctave = `${note}4`;
                const safeNote = note.replace("#", "s");
                xyloUrls[noteWithOctave] = `${safeNote}4.mp3`;
              });
              [5, 6, 7].forEach((octave) => {
                xyloNotes.forEach((note) => {
                  const noteWithOctave = `${note}${octave}`;
                  const safeNote = note.replace("#", "s");
                  xyloUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              xyloUrls["C8"] = "C8.mp3";
              newInstrument = new Tone.Sampler({
                urls: xyloUrls,
                baseUrl: "/audio/xylo-mp3/",
                onload: () => {
                  console.log("Xylophone samples loaded successfully!");
                  setIsLoaded(true);
                  synthRef.current = newInstrument;
                },
                onerror: (error: Error) => {
                  console.error("Error loading xylophone samples:", error);
                  setTimeout(() => {
                    setIsLoaded(true);
                  }, 3000);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.FLUTE:
              // Use local flute samples in MP3 format
              const fluteUrls: Record<string, string> = {};
              const fluteNotes = [
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
              [4, 5, 6].forEach((octave) => {
                fluteNotes.forEach((note) => {
                  const noteWithOctave = `${note}${octave}`;
                  const safeNote = note.replace("#", "s");
                  fluteUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              fluteUrls["B3"] = "B3.mp3";
              fluteUrls["C#7"] = "Cs7.mp3";
              newInstrument = new Tone.Sampler({
                urls: fluteUrls,
                baseUrl: "/audio/flute-mp3/",
                onload: () => {
                  console.log("Flute samples loaded successfully!");
                  setIsLoaded(true);
                  synthRef.current = newInstrument;
                },
                onerror: (error: Error) => {
                  console.error("Error loading flute samples:", error);
                  setTimeout(() => {
                    setIsLoaded(true);
                  }, 3000);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.VIOLIN:
              // Use local violin samples in MP3 format
              const violinUrls: Record<string, string> = {};
              const violinNotes = [
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
              const violinNotesOctave3 = ["G#", "A", "A#", "B"];
              violinNotesOctave3.forEach((note) => {
                const noteWithOctave = `${note}3`;
                const safeNote = note.replace("#", "s");
                violinUrls[noteWithOctave] = `${safeNote}3.mp3`;
              });
              [4, 5, 6].forEach((octave) => {
                violinNotes.forEach((note) => {
                  const noteWithOctave = `${note}${octave}`;
                  const safeNote = note.replace("#", "s");
                  violinUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              const violinNotesOctave7 = ["C", "C#", "D", "D#", "E"];
              violinNotesOctave7.forEach((note) => {
                const noteWithOctave = `${note}7`;
                const safeNote = note.replace("#", "s");
                violinUrls[noteWithOctave] = `${safeNote}7.mp3`;
              });
              newInstrument = new Tone.Sampler({
                urls: violinUrls,
                baseUrl: "/audio/violin-mp3/",
                onload: () => {
                  console.log("Violin samples loaded successfully!");
                  setIsLoaded(true);
                  synthRef.current = newInstrument;
                },
                onerror: (error: Error) => {
                  console.error("Error loading violin samples:", error);
                  setTimeout(() => {
                    setIsLoaded(true);
                  }, 3000);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.CELLO:
              // Use local cello samples in MP3 format
              const celloUrls: Record<string, string> = {};
              const celloNotes = [
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
              [2, 3, 4].forEach((octave) => {
                celloNotes.forEach((note) => {
                  const noteWithOctave = `${note}${octave}`;
                  const safeNote = note.replace("#", "s");
                  celloUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              const availableNotesOctave5 = [
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
              ];
              availableNotesOctave5.forEach((note) => {
                const noteWithOctave = `${note}5`;
                const safeNote = note.replace("#", "s");
                celloUrls[noteWithOctave] = `${safeNote}5.mp3`;
              });
              newInstrument = new Tone.Sampler({
                urls: celloUrls,
                baseUrl: "/audio/cello-mp3/",
                onload: () => {
                  console.log("Cello samples loaded successfully!");
                  setIsLoaded(true);
                  synthRef.current = newInstrument;
                },
                onerror: (error: Error) => {
                  console.error("Error loading cello samples:", error);
                  setTimeout(() => {
                    setIsLoaded(true);
                  }, 3000);
                },
              }).toDestination();
              return;

            case INSTRUMENT_TYPES.HORN:
              // Use local horn samples in MP3 format
              const hornUrls: Record<string, string> = {};
              const hornNotes = [
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
              ["A#", "B"].forEach((note) => {
                const noteWithOctave = `${note}1`;
                const safeNote = note.replace("#", "s");
                hornUrls[noteWithOctave] = `${safeNote}1.mp3`;
              });
              [2, 3, 4].forEach((octave) => {
                hornNotes.forEach((note) => {
                  const noteWithOctave = `${note}${octave}`;
                  const safeNote = note.replace("#", "s");
                  hornUrls[noteWithOctave] = `${safeNote}${octave}.mp3`;
                });
              });
              const hornNotesOctave5 = ["C", "C#", "D", "D#", "E", "F"];
              hornNotesOctave5.forEach((note) => {
                const noteWithOctave = `${note}5`;
                const safeNote = note.replace("#", "s");
                hornUrls[noteWithOctave] = `${safeNote}5.mp3`;
              });
              newInstrument = new Tone.Sampler({
                urls: hornUrls,
                baseUrl: "/audio/horn-mp3/",
                onload: () => {
                  console.log("Horn samples loaded successfully!");
                  setIsLoaded(true);
                  synthRef.current = newInstrument;
                },
                onerror: (error: Error) => {
                  console.error("Error loading horn samples:", error);
                  setTimeout(() => {
                    setIsLoaded(true);
                  }, 3000);
                },
              }).toDestination();
              return;
          }

          // Common configuration for sampled instruments
          sampleConfig = {
            ...sampleConfig,
            baseUrl,
            onload: () => {
              console.log(`${selectedInstrument} samples loaded successfully!`);
              setIsLoaded(true);
              synthRef.current = newInstrument;
            },
            onerror: (error: Error) => {
              console.error(
                `Error loading ${selectedInstrument} samples:`,
                error
              );
              setTimeout(() => {
                setIsLoaded(true);
              }, 3000);
            },
          };

          // Create the sampler with the appropriate configuration
          newInstrument = new Tone.Sampler(sampleConfig).toDestination();
        }

        // Start audio context
        await Tone.start();
        console.log("Audio context started");
      } catch (e) {
        console.error("Error initializing instrument:", e);
        setTimeout(() => {
          setIsLoaded(true);
        }, 3000);
      }
    };

    initializeInstrument();

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
      }
      if (sequenceRef.current) {
        sequenceRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, [selectedInstrument]);

  // Update BPM based on progression
  useEffect(() => {
    switch (selectedProgression) {
      case "blues":
        setBpm(90);
        break;
      case "jazz":
        setBpm(100);
        break;
      case "canon":
        setBpm(80);
        break;
      case "andalusian":
        setBpm(90);
        break;
      default:
        setBpm(80);
    }
  }, [selectedProgression]);

  // Update tempo in real-time
  useEffect(() => {
    if (isPlaying) {
      Tone.Transport.bpm.value = bpm;
    }
  }, [bpm, isPlaying]);

  // Get notes for a chord based on key, scale degree, and chord type
  const getChordNotes = (
    key: Note,
    scaleDegree: number,
    chordType: ChordType
  ): string[] => {
    // Major scale intervals in semitones
    const majorScale = [0, 2, 4, 5, 7, 9, 11];

    // Get the root note index
    const rootIndex = allNotes.indexOf(key);

    // Get the scale degree note index
    const scaleNoteIndex = (rootIndex + majorScale[scaleDegree]) % 12;
    const scaleNote = allNotes[scaleNoteIndex];

    // Get the chord intervals
    const intervals = chordTypes[chordType];

    // Calculate all notes in the chord
    const chordNotes = intervals.map((interval: number) => {
      const noteIndex = (scaleNoteIndex + interval) % 12;
      // For blues, pop, and fifties, use octave 5 for a brighter sound
      return `${allNotes[noteIndex]}${
        selectedProgression === "blues" ||
        selectedProgression === "pop" ||
        selectedProgression === "fifties"
          ? "5"
          : "4"
      }`;
    });

    // For blues, pop, and fifties, add a bass note two octaves lower
    if (
      selectedProgression === "blues" ||
      selectedProgression === "pop" ||
      selectedProgression === "fifties" ||
      selectedProgression === "canon"
    ) {
      const bassNote = `${scaleNote}2`; // Add root note two octaves lower
      return [bassNote, ...chordNotes];
    }

    return chordNotes;
  };

  // Generate all chords for the current progression
  const generateProgressionChords = (): Chord[] => {
    const progression = progressions[selectedProgression];

    return progression.numerals.map((numeral: string, index: number) => {
      const scaleDegree = romanToScaleDegree(numeral);
      const chordType = progression.chordTypes[index];
      const notes = getChordNotes(selectedKey, scaleDegree, chordType);

      return {
        numeral,
        notes,
        name: `${
          allNotes[
            (allNotes.indexOf(selectedKey) + romanToScaleDegree(numeral)) % 12
          ]
        }${
          chordType === "minor"
            ? "m"
            : chordType === "dom7"
            ? "7"
            : chordType === "maj7"
            ? "maj7"
            : chordType === "min7"
            ? "m7"
            : ""
        }`,
      };
    });
  };

  // Play a single chord
  const playChord = (notes: string[], time: number): void => {
    if (synthRef.current && isLoaded) {
      // For blues, arpeggiate the chord while keeping bass steady
      if (selectedProgression === "blues") {
        // Get the bass note (first note) and chord notes (remaining notes)
        const bassNote = notes[0];
        const chordNotes = notes.slice(1);

        // Play the bass note as a steady quarter note
        synthRef.current.triggerAttackRelease(bassNote, "4n", time);

        // Arpeggiate the chord notes
        chordNotes.forEach((note, index) => {
          synthRef.current?.triggerAttackRelease(
            note,
            "8n",
            time + index * Tone.Time("8n").toSeconds()
          );
        });
      }
      // For Jazz ii-V-I, play first three beats and rest on fourth
      else if (selectedProgression === "jazz") {
        // Get the bass note (first note) and chord notes (remaining notes)
        const bassNote = notes[0];
        const chordNotes = notes.slice(1);

        // Play the full chord for first three beats
        synthRef.current.triggerAttackRelease(chordNotes, "2n", time);

        // Play bass note on first three beats
        synthRef.current.triggerAttackRelease(bassNote, "8n", time);
        synthRef.current.triggerAttackRelease(
          bassNote,
          "8n",
          time + Tone.Time("8n").toSeconds()
        );
        synthRef.current.triggerAttackRelease(
          bassNote,
          "8n",
          time + Tone.Time("8n").toSeconds() * 2
        );
        // Fourth beat is a rest (no note played)
      }
      // For Andalusian Cadence, use flamenco rhythm pattern
      else if (selectedProgression === "andalusian") {
        // Get the bass note (first note) and chord notes (remaining notes)
        const bassNote = notes[0];
        const chordNotes = notes.slice(1);

        // Play the full chord with flamenco rhythm
        // In 12/8 time, we'll use a pattern of 3+3+3+3 eighth notes
        synthRef.current.triggerAttackRelease(chordNotes, "2n", time);

        // Play bass notes in a flamenco pattern
        // Pattern: 1-2-3-1-2-3-1-2-3-1-2-3 (in 12/8)
        for (let i = 0; i < 4; i++) {
          synthRef.current.triggerAttackRelease(
            bassNote,
            "8n",
            time + i * Tone.Time("8n").toSeconds()
          );
        }
      }
      // For pop and fifties, keep the current pattern with arpeggiated bass
      else if (
        selectedProgression === "pop" ||
        selectedProgression === "fifties" ||
        selectedProgression === "canon"
      ) {
        // Get the bass note (first note) and chord notes (remaining notes)
        const bassNote = notes[0];
        const chordNotes = notes.slice(1);

        // Play the full chord
        synthRef.current.triggerAttackRelease(chordNotes, "2n", time);

        // Arpeggiate the bass note
        synthRef.current.triggerAttackRelease(bassNote, "8n", time);
        synthRef.current.triggerAttackRelease(
          bassNote,
          "8n",
          time + Tone.Time("8n").toSeconds()
        );
        synthRef.current.triggerAttackRelease(
          bassNote,
          "8n",
          time + Tone.Time("8n").toSeconds() * 2
        );
        synthRef.current.triggerAttackRelease(
          bassNote,
          "8n",
          time + Tone.Time("8n").toSeconds() * 3
        );
      } else {
        // For other progressions, play the chord normally with the passed time
        synthRef.current.triggerAttackRelease(notes, "2n", time);
      }
    }
  };

  // Play the entire progression
  const playProgression = async (): Promise<void> => {
    if (isPlaying) return;

    // Make sure Tone.js is ready
    await Tone.start();

    // Set playing state
    setIsPlaying(true);

    // Get all chords in the progression
    const chords = generateProgressionChords();

    // Set tempo and time signature based on progression
    Tone.Transport.bpm.value = bpm;

    // Set time signature for Andalusian Cadence to 4/8
    if (selectedProgression === "andalusian") {
      Tone.Transport.timeSignature = [4, 8];
      // In 4/8, each measure is 4 beats of triplets
      Tone.Transport.loopEnd = `${chords.length}m`;
    } else {
      Tone.Transport.timeSignature = [4, 4];
    }

    // Calculate the total duration in measures
    const totalDuration =
      selectedProgression === "andalusian"
        ? chords.length // One measure per chord in 4/8
        : chords.length * (selectedProgression === "blues" ? 1 : 2);

    // Create a sequence to play each chord
    sequenceRef.current = new Tone.Sequence(
      (time: number, index: number) => {
        // Update current chord for highlighting
        setCurrentChord(index);

        // Play the chord
        playChord(chords[index].notes, time);
      },
      [...Array(chords.length).keys()],
      selectedProgression === "blues"
        ? "4n"
        : selectedProgression === "andalusian"
        ? "1m"
        : "2n" // Use full measure for Andalusian Cadence
    );

    // Start the sequence
    Tone.Transport.start();
    if (sequenceRef.current) {
      sequenceRef.current.start(0);
    }

    // Stop after playing through once
    Tone.Transport.schedule((time) => {
      stopProgression();
    }, `+${totalDuration}m`);
  };

  // Stop the progression
  const stopProgression = (): void => {
    if (!isPlaying) return;

    Tone.Transport.stop();
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
    }
    setIsPlaying(false);
    setCurrentChord(null);
  };

  // Get all chords in the current progression
  const progressionChords = generateProgressionChords();

  // Get active keys for visualization
  const getActiveKeys = () => {
    if (currentChord === null) return [];
    const chords = generateProgressionChords();
    const currentChordData = chords[currentChord];

    // Get all notes including the bass note
    return currentChordData.notes;
  };

  // Get highlighted keys (bass note) for visualization
  const getHighlightedKeys = () => {
    if (currentChord === null) return [];
    const chords = generateProgressionChords();
    const currentChordData = chords[currentChord];

    // The bass note is always the first note in the chord
    return [currentChordData.notes[0]];
  };

  return (
    <div className="demo-container">
      <VisuallyHidden>Chord Progression Player</VisuallyHidden>

      <div className="controls">
        {/* Play button */}
        <Button
          size="small"
          onClick={isPlaying ? stopProgression : playProgression}
          variant={isPlaying ? "secondary" : "primary"}
          style={{ display: "flex", alignSelf: "flex-end" }}
        >
          <Play size={16} />
          {isPlaying ? "Stop" : "Play"}
        </Button>

        {/* Progression selector */}
        <Select
          label="Progression"
          labelPosition="top"
          disabled={isPlaying}
          value={selectedProgression}
          onChange={(value) => setSelectedProgression(value as ProgressionKey)}
        >
          {Object.entries(progressions).map(([key, progression]) => (
            <option key={key} value={key}>
              {progression.name}
            </option>
          ))}
        </Select>

        {/* Key selector */}
        <Select
          label="Key"
          labelPosition="top"
          disabled={isPlaying}
          value={selectedKey}
          onChange={(value) => setSelectedKey(value as Note)}
        >
          {allNotes.map((note) => (
            <option key={note} value={note}>
              {note}
            </option>
          ))}
        </Select>

        {/* BPM control */}
        <div className="flex-col gap-12" style={{ alignSelf: "flex-start" }}>
          <div className="flex">
            <Slider
              value={bpm}
              onChange={(value) => setBpm(value)}
              min={40}
              max={120}
              step={1}
              label="Tempo (BPM)"
            />
          </div>
        </div>
      </div>

      {/* Progression pattern and description */}
      <div className="info-box">
        {/* Chord visualization */}
        <div className="chord-visualization">
          {progressionChords.map((chord: Chord, index: number) => (
            <div
              key={index}
              className={`chord-card ${currentChord === index ? "active" : ""}`}
            >
              <div className="chord-name">{chord.name}</div>
              <div className="chord-numeral">{chord.numeral}</div>
            </div>
          ))}
        </div>
        <div className="progression-description">
          {progressions[selectedProgression].description}
        </div>
      </div>
      {/* Instrument Player */}
      <InstrumentPlayer
        octaveRange={octaveRange}
        showLabels={true}
        activeKeys={getActiveKeys()}
        highlightedKeys={getHighlightedKeys()}
        onOctaveRangeChange={(newRange) => setOctaveRange(newRange)}
      />
    </div>
  );
};

const ChordProgressionPlayer = () => {
  return (
    <InstrumentProvider>
      <ChordProgressionPlayerContent />
    </InstrumentProvider>
  );
};

export default ChordProgressionPlayer;
