import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import "./MusicAnalyzer.css";
import {
  QuarterNote,
  EightNote,
  HalfNote,
  WholeNote,
} from "@/components/Icons";
import { Select } from "@/content/blog/shared/Select";
import { audioCoordinator } from "../../utils/audioCoordinator";
import VisuallyHidden from "@/components/VisuallyHidden";
import { Button } from "@/components/Button";

const Transport = Tone.getTransport();

type Note = {
  time: number | string;
  note: string;
  duration: string;
  index?: number;
};

type Example = {
  name: string;
  notes: Note[];
  bassNotes?: Note[];
};

type Examples = {
  [key: string]: Example;
};

type Analysis = {
  noteCount: number;
  uniqueNotes: number;
  mostCommonNote: string;
  stepwiseMotion: string;
  largestLeap: number;
  range: number;
  potentialKey: string;
  mostCommonDuration: string;
};

function MusicAnalyzer() {
  const [selectedExample, setSelectedExample] = useState<string>("mary");
  const [midiData, setMidiData] = useState<Note[] | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentNote, setCurrentNote] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Add useEffect to monitor midiData changes
  useEffect(() => {
    console.log("midiData updated:", midiData);
  }, [midiData]);

  // References for audio
  const synthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);
  const bassSynthRef = useRef<Tone.MonoSynth | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const bassSequenceRef = useRef<Tone.Sequence | null>(null);
  const drumSequenceRef = useRef<Tone.Sequence | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drum samples
  const kickPlayer = useRef<Tone.Player | null>(null);
  const snarePlayer = useRef<Tone.Player | null>(null);
  const hihatPlayer = useRef<Tone.Player | null>(null);

  // Example pieces
  const examples: Examples = {
    mary: {
      name: "Mary Had a Little Lamb",
      notes: [
        // Bar 1
        { time: 0, note: "E4", duration: "4n" },
        { time: "4n", note: "D4", duration: "4n" },
        { time: "2n", note: "C4", duration: "4n" },
        { time: "2n + 4n", note: "D4", duration: "4n" },
        // Bar 2
        { time: "1m", note: "E4", duration: "4n" },
        { time: "1m + 4n", note: "E4", duration: "4n" },
        { time: "1m + 2n", note: "E4", duration: "4n" },
        { time: "1m + 2n + 4n", note: "r", duration: "4n" },
        // Bar 3
        { time: "2m", note: "D4", duration: "4n" },
        { time: "2m + 4n", note: "D4", duration: "4n" },
        { time: "2m + 2n", note: "D4", duration: "4n" },
        { time: "2m + 2n + 4n", note: "r", duration: "4n" },
        // Bar 4
        { time: "3m", note: "E4", duration: "4n" },
        { time: "3m + 4n", note: "G4", duration: "4n" },
        { time: "3m + 2n", note: "G4", duration: "4n" },
        { time: "3m + 2n + 4n", note: "r", duration: "4n" },
        // Bar 5
        { time: "4m", note: "E4", duration: "4n" },
        { time: "4m + 4n", note: "D4", duration: "4n" },
        { time: "4m + 2n", note: "C4", duration: "4n" },
        { time: "4m + 2n + 4n", note: "D4", duration: "4n" },
        // Bar 6
        { time: "5m", note: "E4", duration: "4n" },
        { time: "5m + 4n", note: "E4", duration: "4n" },
        { time: "5m + 2n", note: "E4", duration: "4n" },
        { time: "5m + 2n + 4n", note: "E4", duration: "4n" },
        // Bar 7
        { time: "6m", note: "D4", duration: "4n" },
        { time: "6m + 4n", note: "D4", duration: "4n" },
        { time: "6m + 2n", note: "E4", duration: "4n" },
        { time: "6m + 2n + 4n", note: "D4", duration: "4n" },
        // Bar 8
        { time: "7m", note: "C4", duration: "2n" },
        { time: "7m + 2n", note: "r", duration: "4n" },
        { time: "7m + 2n + 4n", note: "r", duration: "4n" },
        { time: "7m + 4n", note: "r", duration: "4n" },
      ],
      bassNotes: [
        // Bar 1
        { time: 0, note: "C3", duration: "4n" },
        { time: "4n", note: "G3", duration: "4n" },
        { time: "2n", note: "C3", duration: "4n" },
        { time: "2n + 4n", note: "G3", duration: "4n" },
        // Bar 2
        { time: "1m", note: "C3", duration: "4n" },
        { time: "1m + 4n", note: "G3", duration: "4n" },
        { time: "1m + 2n", note: "C3", duration: "4n" },
        { time: "1m + 2n + 4n", note: "G3", duration: "4n" },
        // Bar 3
        { time: "2m", note: "G3", duration: "4n" },
        { time: "2m + 4n", note: "D3", duration: "4n" },
        { time: "2m + 2n", note: "G3", duration: "4n" },
        { time: "2m + 2n + 4n", note: "D3", duration: "4n" },
        // Bar 4
        { time: "3m", note: "C3", duration: "4n" },
        { time: "3m + 4n", note: "G3", duration: "4n" },
        { time: "3m + 2n", note: "C3", duration: "4n" },
        { time: "3m + 2n + 4n", note: "G3", duration: "4n" },
        // Bar 5
        { time: "4m", note: "C3", duration: "4n" },
        { time: "4m + 4n", note: "G3", duration: "4n" },
        { time: "4m + 2n", note: "C3", duration: "4n" },
        { time: "4m + 2n + 4n", note: "G3", duration: "4n" },
        // Bar 6
        { time: "5m", note: "C3", duration: "4n" },
        { time: "5m + 4n", note: "G3", duration: "4n" },
        { time: "5m + 2n", note: "C3", duration: "4n" },
        { time: "5m + 2n + 4n", note: "G3", duration: "4n" },
        // Bar 7
        { time: "6m", note: "G3", duration: "4n" },
        { time: "6m + 4n", note: "D3", duration: "4n" },
        { time: "6m + 2n", note: "G3", duration: "4n" },
        { time: "6m + 2n + 4n", note: "D3", duration: "4n" },
        // Bar 8
        { time: "7m", note: "C3", duration: "4n" },
        { time: "7m + 4n", note: "G3", duration: "4n" },
        { time: "7m + 2n", note: "C3", duration: "4n" },
        { time: "7m + 2n + 4n", note: "C3", duration: "4n" },
      ],
    },
    twinkle: {
      name: "Twinkle, Twinkle, Little Star",
      notes: [
        { time: 0, note: "C4", duration: "4n" },
        { time: "4n", note: "C4", duration: "4n" },
        { time: "2n", note: "G4", duration: "4n" },
        { time: "2n + 4n", note: "G4", duration: "4n" },
        { time: "1m", note: "A4", duration: "4n" },
        { time: "1m + 4n", note: "A4", duration: "4n" },
        { time: "1m + 2n", note: "G4", duration: "2n" },
        { time: "2m", note: "F4", duration: "4n" },
        { time: "2m + 4n", note: "F4", duration: "4n" },
        { time: "2m + 2n", note: "E4", duration: "4n" },
        { time: "2m + 2n + 4n", note: "E4", duration: "4n" },
        { time: "3m", note: "D4", duration: "4n" },
        { time: "3m + 4n", note: "D4", duration: "4n" },
        { time: "3m + 2n", note: "C4", duration: "2n" },
      ],
    },
    jingle: {
      name: "Jingle Bells (beginning)",
      notes: [
        { time: 0, note: "E4", duration: "4n" },
        { time: "4n", note: "E4", duration: "4n" },
        { time: "2n", note: "E4", duration: "2n" },
        { time: "1m", note: "E4", duration: "4n" },
        { time: "1m + 4n", note: "E4", duration: "4n" },
        { time: "1m + 2n", note: "E4", duration: "2n" },
        { time: "2m", note: "E4", duration: "4n" },
        { time: "2m + 4n", note: "G4", duration: "4n" },
        { time: "2m + 2n", note: "C4", duration: "4n" },
        { time: "2m + 2n + 4n", note: "D4", duration: "4n" },
        { time: "3m", note: "E4", duration: "1m" },
      ],
    },
    wholeNotes: {
      name: "Whole Notes Example",
      notes: [
        { time: 0, note: "C4", duration: "1m" },
        { time: "1m", note: "E4", duration: "1m" },
        { time: "2m", note: "G4", duration: "1m" },
        { time: "3m", note: "C5", duration: "1m" },
      ],
    },
  };

  // Initialize Tone.js
  useEffect(() => {
    const initAudio = async () => {
      try {
        await Tone.start();
        const transport = audioCoordinator.registerComponent(
          "music-analyzer",
          stopPlayback
        );
        transport.bpm.value = 120;

        // Initialize melody synth
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          envelope: {
            attack: 0.02,
            decay: 0.1,
            sustain: 0.3,
            release: 1,
          },
        }).toDestination();

        // Initialize bass synth
        bassSynthRef.current = new Tone.MonoSynth({
          oscillator: {
            type: "sine",
          },
          envelope: {
            attack: 0.01,
            decay: 0.1,
            sustain: 0.3,
            release: 0.5,
          },
          filterEnvelope: {
            attack: 0.001,
            decay: 0.1,
            sustain: 0.4,
            release: 0.5,
            baseFrequency: 200,
            octaves: 2,
          },
        }).toDestination();

        // Initialize drum samples
        kickPlayer.current = new Tone.Player({
          url: "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/kick.ogg",
        }).toDestination();

        snarePlayer.current = new Tone.Player({
          url: "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/snare.ogg",
        }).toDestination();

        hihatPlayer.current = new Tone.Player({
          url: "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/hh.ogg",
        }).toDestination();

        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize audio:", error);
      }
    };

    initAudio();

    // Cleanup function
    return () => {
      audioCoordinator.unregisterComponent("music-analyzer");
      stopPlayback();
      if (synthRef.current) synthRef.current.dispose();
      if (bassSynthRef.current) bassSynthRef.current.dispose();
      if (sequenceRef.current) sequenceRef.current.dispose();
      if (bassSequenceRef.current) bassSequenceRef.current.dispose();
      if (drumSequenceRef.current) drumSequenceRef.current.dispose();
      if (partRef.current) partRef.current.dispose();
      if (kickPlayer.current) kickPlayer.current.dispose();
      if (snarePlayer.current) snarePlayer.current.dispose();
      if (hihatPlayer.current) hihatPlayer.current.dispose();
    };
  }, []);

  // Load initial example only once
  useEffect(() => {
    loadExample(selectedExample);
  }, []); // Empty dependency array means this only runs once on mount

  // Load an example piece
  async function loadExample(exampleId: string) {
    stopPlayback();

    // Load the new example
    const newNotes = examples[exampleId].notes;
    console.log("Loading example:", exampleId, "with notes:", newNotes);

    // Update all states in a single batch
    setSelectedExample(exampleId);
    setMidiData(newNotes);
    setAnalysis(null);
    setCurrentNote(null);

    // Analyze the piece
    analyzeMusic(newNotes);
  }

  // Analyze the music
  function analyzeMusic(notes: Note[]) {
    setIsAnalyzing(true);

    // Convert note names to numbers for analysis
    const noteToNumber = (noteName: string): number => {
      const notes = [
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
      const octave = parseInt(noteName.slice(-1));
      const note = noteName.slice(0, -1);

      return notes.indexOf(note) + octave * 12;
    };

    // Extract just the note names (without octave)
    const noteNames = notes.map((n: Note) => n.note.slice(0, -1));

    // Count occurrences of each note
    const noteCounts: { [key: string]: number } = {};
    noteNames.forEach((note: string) => {
      noteCounts[note] = (noteCounts[note] || 0) + 1;
    });

    // Find the most common note (potential key center)
    const mostCommonNote = Object.entries(noteCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Calculate intervals between consecutive notes
    const intervals: number[] = [];
    for (let i = 1; i < notes.length; i++) {
      const interval = Math.abs(
        noteToNumber(notes[i].note) - noteToNumber(notes[i - 1].note)
      );
      intervals.push(interval);
    }

    // Count step-wise motion vs. leaps
    const stepwise = intervals.filter(
      (interval: number) => interval <= 2
    ).length;
    const leaps = intervals.filter((interval: number) => interval > 2).length;

    // Find the range (highest to lowest note)
    const noteNumbers = notes.map((n: Note) => noteToNumber(n.note));
    const highestNote = Math.max(...noteNumbers);
    const lowestNote = Math.min(...noteNumbers);
    const range = highestNote - lowestNote;

    // Detect potential key based on note content
    let potentialKey = mostCommonNote;

    // Check for certain note combinations that suggest major vs. minor
    const hasE = noteNames.includes("E");
    const hasEb = noteNames.includes("D#") || noteNames.includes("Eb");
    const hasA = noteNames.includes("A");
    const hasAb = noteNames.includes("G#") || noteNames.includes("Ab");

    // Very simplified key detection
    if (potentialKey === "C") {
      if (hasEb && hasAb) potentialKey = "C minor";
      else potentialKey = "C major";
    } else if (potentialKey === "G") {
      if (hasEb) potentialKey = "G minor";
      else potentialKey = "G major";
    } else {
      potentialKey += " major/minor";
    }

    // Detect rhythm patterns (very simplified)
    const durations = notes.map((n: Note) => n.duration);
    const commonDuration = durations
      .filter((d: string) => !d.includes("+"))
      .sort()
      .reduce((acc: { [key: string]: number }, curr: string) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});

    const mostCommonDuration = Object.entries(commonDuration).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    // Create the analysis
    const analysisResult: Analysis = {
      noteCount: notes.length,
      uniqueNotes: Object.keys(noteCounts).length,
      mostCommonNote,
      stepwiseMotion: ((stepwise / intervals.length) * 100).toFixed(1) + "%",
      largestLeap: Math.max(...intervals),
      range,
      potentialKey,
      mostCommonDuration:
        mostCommonDuration === "4n"
          ? "Quarter notes"
          : mostCommonDuration === "2n"
          ? "Half notes"
          : mostCommonDuration === "8n"
          ? "Eighth notes"
          : mostCommonDuration,
    };

    setAnalysis(analysisResult);
    setIsAnalyzing(false);
  }

  // Play the music
  const playMusic = async () => {
    if (
      !midiData ||
      isPlaying ||
      !audioCoordinator.isComponentActive("music-analyzer")
    )
      return;

    await Tone.start();
    setIsPlaying(true);

    // Create melody sequence
    const melodySequence = midiData.map((note, index) => {
      if (note.note === "r") return null;
      return {
        note: note.note,
        duration: note.duration,
        index,
      };
    });

    sequenceRef.current = new Tone.Sequence(
      (time, value) => {
        if (!value || !audioCoordinator.isComponentActive("music-analyzer"))
          return;
        setCurrentNote(value.index);
        if (synthRef.current) {
          synthRef.current.triggerAttackRelease(
            value.note,
            value.duration,
            time
          );
        }
      },
      melodySequence,
      "4n"
    ).start(0);

    // Create bass sequence
    if (examples[selectedExample].bassNotes) {
      const bassSequence = examples[selectedExample].bassNotes!.map((note) => ({
        note: note.note,
        duration: note.duration,
      }));

      bassSequenceRef.current = new Tone.Sequence(
        (time, value) => {
          if (!audioCoordinator.isComponentActive("music-analyzer")) return;
          if (bassSynthRef.current) {
            bassSynthRef.current.triggerAttackRelease(
              value.note,
              value.duration,
              time
            );
          }
        },
        bassSequence,
        "4n"
      ).start(0);

      // Create drum sequence with more variation and hi-hats
      const drumPattern = [
        // Bar 1
        { time: "0:0", note: "kick" },
        { time: "0:1", note: "hihat" },
        { time: "0:2", note: "snare" },
        { time: "0:3", note: "hihat" },
        // Bar 2
        { time: "1:0", note: "kick" },
        { time: "1:1", note: "hihat" },
        { time: "1:2", note: "snare" },
        { time: "1:3", note: "hihat" },
        // Bar 3
        { time: "2:0", note: "kick" },
        { time: "2:1", note: "hihat" },
        { time: "2:2", note: "snare" },
        { time: "2:3", note: "hihat" },
        // Bar 4
        { time: "3:0", note: "kick" },
        { time: "3:1", note: "hihat" },
        { time: "3:2", note: "snare" },
        { time: "3:3", note: "hihat" },
        // Bar 5
        { time: "4:0", note: "kick" },
        { time: "4:1", note: "hihat" },
        { time: "4:2", note: "snare" },
        { time: "4:3", note: "hihat" },
        // Bar 6
        { time: "5:0", note: "kick" },
        { time: "5:1", note: "hihat" },
        { time: "5:2", note: "snare" },
        { time: "5:3", note: "hihat" },
        // Bar 7
        { time: "6:0", note: "kick" },
        { time: "6:1", note: "hihat" },
        { time: "6:2", note: "snare" },
        { time: "6:3", note: "hihat" },
        // Bar 8
        { time: "7:0", note: "kick" },
        { time: "7:1", note: "hihat" },
        { time: "7:2", note: "snare" },
        { time: "7:3", note: "hihat" },
      ];

      drumSequenceRef.current = new Tone.Sequence(
        (time, value) => {
          if (!audioCoordinator.isComponentActive("music-analyzer")) return;
          switch (value.note) {
            case "kick":
              if (kickPlayer.current) kickPlayer.current.start(time);
              break;
            case "snare":
              if (snarePlayer.current) snarePlayer.current.start(time);
              break;
            case "hihat":
              if (hihatPlayer.current) hihatPlayer.current.start(time);
              break;
          }
        },
        drumPattern,
        "4n"
      ).start(0);
    }

    // Start the transport
    const transport = audioCoordinator.getComponentTransport("music-analyzer");
    if (transport) {
      transport.start();
      transport.loop = false;
    }

    // Calculate total duration based on the last note's time and duration
    const lastNote = midiData[midiData.length - 1];
    const totalDuration = `${lastNote.time} + ${lastNote.duration}`;

    // Stop at the end
    if (transport) {
      transport.schedule(() => {
        if (audioCoordinator.isComponentActive("music-analyzer")) {
          stopPlayback();
        }
      }, `+${totalDuration}`);
    }
  };

  // Stop playback
  const stopPlayback = () => {
    if (!isPlaying) return;

    const transport = audioCoordinator.getComponentTransport("music-analyzer");
    if (transport) {
      transport.stop();
      transport.cancel();
    }

    if (sequenceRef.current) {
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }

    if (bassSequenceRef.current) {
      bassSequenceRef.current.dispose();
      bassSequenceRef.current = null;
    }

    if (drumSequenceRef.current) {
      drumSequenceRef.current.dispose();
      drumSequenceRef.current = null;
    }

    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    setIsPlaying(false);
    setCurrentNote(null);
  };

  // Convert examples to options array for Select component
  const exampleOptions = Object.entries(examples).map(([id, example]) => ({
    value: id,
    label: example.name,
  }));

  return (
    <div className="demo-container" ref={containerRef}>
      <VisuallyHidden as="h3">Music Analyzer</VisuallyHidden>

      <div className="flex between">
        <Button
          onClick={isPlaying ? stopPlayback : playMusic}
          disabled={!midiData || isAnalyzing || !isInitialized}
        >
          {isPlaying ? "Stop" : isAnalyzing ? "Analyzing..." : "Play Music"}
        </Button>

        <Select
          value={selectedExample}
          onChange={loadExample}
          label="Select Example"
        >
          {exampleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Visualization of the notes */}
      <div className="notes-grid">
        {midiData &&
          midiData.map((note, index) => (
            <div
              key={index}
              className={`note-cell ${currentNote === index ? "active" : ""}`}
            >
              <div className="note-name">{note.note}</div>
              <div className="note-duration">
                {(() => {
                  switch (note.duration) {
                    case "4n":
                      return <QuarterNote />;
                    case "2n":
                      return <HalfNote />;
                    case "8n":
                      return <EightNote />;
                    case "1m":
                      return <WholeNote />;
                    default:
                      return note.duration;
                  }
                })()}
              </div>
            </div>
          ))}
      </div>

      {/* Analysis results */}
      {analysis && (
        <div className="analysis-section">
          <h4 className="analysis-title">Analysis Results</h4>

          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">Total Notes:</div>
              <div className="analysis-value">{analysis.noteCount}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Unique Notes:</div>
              <div className="analysis-value">{analysis.uniqueNotes}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Most Common Note:</div>
              <div className="analysis-value">{analysis.mostCommonNote}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Stepwise Motion:</div>
              <div className="analysis-value">{analysis.stepwiseMotion}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Largest Leap:</div>
              <div className="analysis-value">
                {analysis.largestLeap} semitones
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Note Range:</div>
              <div className="analysis-value">{analysis.range} semitones</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Potential Key:</div>
              <div className="analysis-value">{analysis.potentialKey}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Dominant Rhythm:</div>
              <div className="analysis-value">
                {analysis.mostCommonDuration}
              </div>
            </div>
          </div>

          <div className="analysis-summary">
            <div>
              <strong>Summary:</strong> This piece is primarily in{" "}
              {analysis.potentialKey}, with mostly {analysis.stepwiseMotion}{" "}
              stepwise motion, creating a{" "}
              {analysis.uniqueNotes < 6 ? "simple, accessible" : "more complex"}{" "}
              melody. The range of {analysis.range} semitones makes it{" "}
              {analysis.range > 12 ? "more challenging" : "accessible"} to sing
              or play.
            </div>
          </div>
        </div>
      )}

      <p className="description-text">
        This music analyzer demonstrates how the concepts we've learned—pitch,
        rhythm, harmony, and structure—come together in actual music. Try
        different examples to see how their musical characteristics differ!
      </p>
    </div>
  );
}

export default MusicAnalyzer;
