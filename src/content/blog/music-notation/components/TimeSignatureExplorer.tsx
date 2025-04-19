import React, { useState, useRef, useEffect } from "react";
import * as Tone from "tone";
import { Music, Play, Pause } from "lucide-react";
import { Slider } from "@/components/Slider";

type TimeSignature = {
  id: string;
  name: string;
  signature: [number, number]; // [beats per measure, beat value]
  description: string;
  beatGrouping: number[]; // How to group beats (e.g., [3, 3, 2] for 8/8 grouped as 3+3+2)
  commonIn: string[];
};

const timeSignatures: TimeSignature[] = [
  {
    id: "4-4",
    name: "4/4 (Common Time)",
    signature: [4, 4],
    description:
      "The most common time signature in Western music. Four quarter-note beats per measure.",
    beatGrouping: [1, 1, 1, 1],
    commonIn: ["Pop", "Rock", "Classical", "Jazz", "Most Western music"],
  },
  {
    id: "3-4",
    name: "3/4 (Waltz Time)",
    signature: [3, 4],
    description:
      "Three quarter-note beats per measure. Creates a lilting, dance-like feel.",
    beatGrouping: [1, 1, 1],
    commonIn: ["Waltzes", "Folk music", "Classical", "Country"],
  },
  {
    id: "2-4",
    name: "2/4 (March Time)",
    signature: [2, 4],
    description:
      "Two quarter-note beats per measure. Often used in marches and polkas.",
    beatGrouping: [1, 1],
    commonIn: ["Marches", "Polkas", "Folk music"],
  },
  {
    id: "6-8",
    name: "6/8 (Compound Duple)",
    signature: [6, 8],
    description:
      "Six eighth-note beats per measure, typically grouped in two groups of three.",
    beatGrouping: [3, 3],
    commonIn: ["Ballads", "Folk music", "Baroque music", "Irish jigs"],
  },
  {
    id: "9-8",
    name: "9/8 (Compound Triple)",
    signature: [9, 8],
    description:
      "Nine eighth-note beats per measure, typically grouped in three groups of three.",
    beatGrouping: [3, 3, 3],
    commonIn: ["Folk music", "Complex jazz", "Some classical pieces"],
  },
  {
    id: "5-4",
    name: "5/4 (Asymmetrical)",
    signature: [5, 4],
    description:
      "Five quarter-note beats per measure, often grouped as 3+2 or 2+3.",
    beatGrouping: [3, 2], // Could also be [2, 3]
    commonIn: ["Modern jazz", "Progressive rock", "Some folk music"],
  },
  {
    id: "7-8",
    name: "7/8 (Asymmetrical)",
    signature: [7, 8],
    description:
      "Seven eighth-note beats per measure, often grouped as 2+2+3, 3+2+2, or 2+3+2.",
    beatGrouping: [2, 2, 3], // Could also be [3, 2, 2] or [2, 3, 2]
    commonIn: ["Balkan folk music", "Progressive rock", "Modern classical"],
  },
  {
    id: "12-8",
    name: "12/8 (Compound Quadruple)",
    signature: [12, 8],
    description:
      "Twelve eighth-note beats per measure, typically grouped in four groups of three.",
    beatGrouping: [3, 3, 3, 3],
    commonIn: ["Blues", "Gospel", "Ballads", "Jazz"],
  },
];

function TimeSignatureExplorer() {
  const [selectedTimeSignature, setSelectedTimeSignature] =
    useState<TimeSignature>(timeSignatures[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const [tempo, setTempo] = useState(100); // BPM

  const metronomeRef = useRef<Tone.Players | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

  // Initialize audio
  useEffect(function initAudio() {
    // Create click sounds for metronome
    metronomeRef.current = new Tone.Players({
      highClick: "/audio/metronome/click1.mp3",
      lowClick: "/audio/metronome/click2.mp3",
    }).toDestination();

    // Create fallback synth if audio files fail to load
    const fallbackTimeout = setTimeout(() => {
      if (!metronomeRef.current?.loaded) {
        console.log("Using synth fallback for metronome clicks");

        metronomeRef.current?.dispose();
        metronomeRef.current = new Tone.Players({
          highClick: {
            url: "",
            onload: () => {
              // Use a synth for high click
              const highSynth = new Tone.Synth({
                oscillator: { type: "triangle" },
                envelope: {
                  attack: 0.001,
                  decay: 0.1,
                  sustain: 0,
                  release: 0.1,
                },
              }).toDestination();

              // Monkey patch the trigger method to use the synth
              (metronomeRef.current as any).get("highClick").trigger = (
                time: number
              ) => {
                highSynth.triggerAttackRelease("G5", "32n", time);
              };
            },
          },
          lowClick: {
            url: "",
            onload: () => {
              // Use a synth for low click
              const lowSynth = new Tone.Synth({
                oscillator: { type: "triangle" },
                envelope: {
                  attack: 0.001,
                  decay: 0.1,
                  sustain: 0,
                  release: 0.1,
                },
              }).toDestination();

              // Monkey patch the trigger method to use the synth
              (metronomeRef.current as any).get("lowClick").trigger = (
                time: number
              ) => {
                lowSynth.triggerAttackRelease("C5", "32n", time);
              };
            },
          },
        }).toDestination();
      }
    }, 3000);

    return function cleanup() {
      clearTimeout(fallbackTimeout);

      if (metronomeRef.current) {
        metronomeRef.current.dispose();
      }
      if (loopRef.current) {
        loopRef.current.dispose();
      }
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  // Update tempo
  useEffect(
    function updateTempo() {
      Tone.Transport.bpm.value = tempo;
    },
    [tempo]
  );

  // Play metronome with the selected time signature
  async function playMetronome() {
    if (isPlaying) {
      stopMetronome();
      return;
    }

    if (!metronomeRef.current) return;

    try {
      // Ensure audio context is running
      await Tone.start();
      setIsPlaying(true);

      // Set time signature
      Tone.Transport.timeSignature = selectedTimeSignature.signature;

      // Determine appropriate subdivision based on beat value
      const beatValue = selectedTimeSignature.signature[1];
      let subdivision;

      switch (beatValue) {
        case 2:
          subdivision = "2n"; // Half note
          break;
        case 4:
          subdivision = "4n"; // Quarter note
          break;
        case 8:
          subdivision = "8n"; // Eighth note
          break;
        case 16:
          subdivision = "16n"; // Sixteenth note
          break;
        default:
          subdivision = "4n"; // Default to quarter note
      }

      // Create metronome loop
      loopRef.current = new Tone.Loop(function (time) {
        // Get current beat based on Tone.js Transport position
        const currentPosition = Tone.Transport.position.split(":");
        const currentBar = parseInt(currentPosition[0]);
        const beat =
          parseInt(currentPosition[1]) % selectedTimeSignature.signature[0];

        setCurrentBeat(beat);

        // Determine which click to use (high for first beat, low for others)
        // For compound meters, use high click at the start of each beat group
        let useHighClick = false;

        if (beat === 0) {
          // Always use high click for first beat of the measure
          useHighClick = true;
        } else {
          // Check if this beat starts a new grouping
          let beatsSoFar = 0;
          for (let i = 0; i < selectedTimeSignature.beatGrouping.length; i++) {
            beatsSoFar += selectedTimeSignature.beatGrouping[i];
            if (beat === beatsSoFar) {
              useHighClick = true;
              break;
            }
          }
        }

        // Play the appropriate click
        if (useHighClick) {
          metronomeRef.current?.get("highClick").start(time);
        } else {
          metronomeRef.current?.get("lowClick").start(time);
        }
      }, subdivision).start(0);

      // Start the transport
      Tone.Transport.start();
    } catch (error) {
      console.error("Error starting metronome:", error);
      setIsPlaying(false);
    }
  }

  // Stop the metronome
  function stopMetronome() {
    if (loopRef.current) {
      loopRef.current.stop();
    }
    Tone.Transport.stop();
    setIsPlaying(false);
    setCurrentBeat(null);
  }

  // Render beat visualization based on selected time signature
  function renderBeats() {
    const { signature, beatGrouping } = selectedTimeSignature;
    const totalBeats = signature[0];

    // For compound meters, show the grouping structure
    let beatElements = [];
    let currentBeatIndex = 0;

    for (let group = 0; group < beatGrouping.length; group++) {
      const groupSize = beatGrouping[group];

      // Create a container for this beat group
      beatElements.push(
        <div key={`group-${group}`} className="beat-group">
          {Array.from({ length: groupSize }).map((_, i) => {
            const beatIndex = currentBeatIndex + i;
            return (
              <div
                key={`beat-${beatIndex}`}
                className={`beat ${currentBeat === beatIndex ? "active" : ""} ${
                  i === 0 ? "group-start" : ""
                }`}
              >
                {beatIndex + 1}
              </div>
            );
          })}
        </div>
      );

      currentBeatIndex += groupSize;
    }

    return beatElements;
  }

  return (
    <div className="demo-container">
      <h3 className="component-title">Time Signature Explorer</h3>

      <div className="time-signature-controls">
        <div className="signature-selector">
          <label htmlFor="time-sig-select">Time Signature:</label>
          <select
            id="time-sig-select"
            value={selectedTimeSignature.id}
            onChange={(e) => {
              const selected = timeSignatures.find(
                (sig) => sig.id === e.target.value
              );
              if (selected) {
                if (isPlaying) {
                  stopMetronome();
                }
                setSelectedTimeSignature(selected);
              }
            }}
            className="select"
          >
            {timeSignatures.map((timeSig) => (
              <option key={timeSig.id} value={timeSig.id}>
                {timeSig.name}
              </option>
            ))}
          </select>
        </div>

        <div className="tempo-control">
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

        <button
          onClick={playMetronome}
          className={`button ${isPlaying ? "playing" : ""}`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? "Stop" : "Play"}
        </button>
      </div>

      <div className="time-signature-display">
        <div className="time-signature-symbol">
          <div className="time-upper">{selectedTimeSignature.signature[0]}</div>
          <div className="time-lower">{selectedTimeSignature.signature[1]}</div>
        </div>

        <div className="beats-display">{renderBeats()}</div>
      </div>

      <div className="time-signature-info">
        <h4>{selectedTimeSignature.name}</h4>
        <p>{selectedTimeSignature.description}</p>

        <div className="beat-grouping">
          <strong>Beat Grouping:</strong>{" "}
          {selectedTimeSignature.beatGrouping.join(" + ")}
        </div>

        <div className="common-in">
          <strong>Commonly Used In:</strong>
          <ul>
            {selectedTimeSignature.commonIn.map((genre, index) => (
              <li key={index}>{genre}</li>
            ))}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .time-signature-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .signature-selector {
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

        .tempo-control {
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
          background-color: var(--primary-blue);
          color: white;
        }

        .button:hover {
          background-color: var(--primary-blue-hover);
        }

        .button.playing {
          background-color: hsl(0 80% 50%);
        }

        .time-signature-display {
          display: flex;
          align-items: center;
          gap: 2rem;
          background-color: var(--component-bg);
          border: 1px solid var(--component-border);
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .time-signature-symbol {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 3rem;
          font-weight: bold;
          line-height: 1;
          color: var(--text-primary);
        }

        .beats-display {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          flex: 1;
          align-items: center;
          justify-content: center;
        }

        .beat-group {
          display: flex;
          border: 1px dashed hsl(210 30% 70% / 0.3);
          border-radius: 4px;
          padding: 0.25rem;
        }

        .beat {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background-color: var(--component-bg-darker);
          border: 1px solid var(--component-border);
          border-radius: 4px;
          font-weight: 500;
          margin: 0 0.25rem;
          transition: all 0.2s ease;
        }

        .beat.group-start {
          background-color: hsl(210 30% 85% / 0.3);
        }

        .beat.active {
          background-color: var(--primary-blue);
          color: white;
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .time-signature-info {
          background-color: var(--component-bg-darker);
          padding: 1rem;
          border-radius: 8px;
        }

        .time-signature-info h4 {
          margin-top: 0;
          margin-bottom: 0.5rem;
        }

        .time-signature-info p {
          margin-bottom: 1rem;
        }

        .beat-grouping {
          margin-bottom: 0.75rem;
        }

        .common-in {
          margin-top: 0.75rem;
        }

        .common-in ul {
          margin-top: 0.5rem;
          padding-left: 1.5rem;
        }

        .common-in li {
          margin-bottom: 0.25rem;
        }

        @media (max-width: 768px) {
          .time-signature-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .time-signature-display {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

export default TimeSignatureExplorer;
