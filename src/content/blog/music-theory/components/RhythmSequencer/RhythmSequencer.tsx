import React, { useState, useEffect, useCallback, useRef } from "react";
import * as Tone from "tone";
import { Play, Pause } from "lucide-react";
import { drumPatterns, type DrumPattern } from "./presets";
import "./rhythm-sequencer.css";
import VisuallyHidden from "@/components/VisuallyHidden";
import { Slider } from "@/components/Slider";
import { Number } from "../../../shared/Number";
import { Select } from "../../../shared/Select";
import { audioCoordinator } from "../../utils/audioCoordinator";
import IconButton from "@/components/Button/IconButton";

interface DrumPad {
  id: string;
  name: string;
  sound: string;
}

interface Samples {
  [key: string]: Tone.Player;
}

const drumPads: DrumPad[] = [
  {
    id: "kick",
    name: "Kick",
    sound:
      "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/kick.ogg",
  },
  {
    id: "snare",
    name: "Snare",
    sound:
      "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/snare.ogg",
  },
  {
    id: "hh",
    name: "Hi-Hat",
    sound:
      "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/hh.ogg",
  },
  {
    id: "clap",
    name: "Clap",
    sound:
      "https://bzdfmutmiehacjojxtaz.supabase.co/storage/v1/object/public/samples/drums/clap.ogg",
  },
];

const STEPS = 8;
const STEPS_12_8 = 12;
const STEPS_3_4 = 9;
const DEFAULT_BPM = 120;

function RhythmSequencer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [shuffle, setShuffle] = useState(0);
  const [shuffleDisabled, setShuffleDisabled] = useState(false);
  const [timeSignature, setTimeSignature] = useState<"4/4" | "12/8" | "3/4">(
    "4/4"
  );
  const [sequence, setSequence] = useState<{ [key: string]: boolean[] }>(
    drumPads.reduce(
      (acc, pad) => ({
        ...acc,
        [pad.id]: drumPatterns[0].pattern[pad.id] || Array(STEPS).fill(false),
      }),
      {}
    )
  );
  const [currentPreset, setCurrentPreset] = useState<string>("Rock");
  const [isTimeSignatureFromPreset, setIsTimeSignatureFromPreset] =
    useState(false);
  const sequenceRef = useRef<Tone.Sequence | null>(null);

  // Initialize samples
  const [samples] = useState<Samples>(() =>
    drumPads.reduce(
      (acc, pad) => ({
        ...acc,
        [pad.id]: new Tone.Player({
          url: pad.sound,
          onload: () => console.log(`${pad.name} loaded`),
          onerror: (error) =>
            console.error(`Error loading ${pad.name}:`, error),
        }).toDestination(),
      }),
      {} as Samples
    )
  );

  // Get current number of steps based on time signature
  const getStepsForTimeSignature = useCallback((sig: string) => {
    switch (sig) {
      case "12/8":
        return STEPS_12_8;
      case "3/4":
        return STEPS_3_4;
      default:
        return STEPS;
    }
  }, []);

  // Register with audio coordinator and cleanup
  useEffect(() => {
    const stopPlayback = () => {
      if (sequenceRef.current) {
        sequenceRef.current.stop();
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }
      Tone.Transport.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    };

    // Register with audio coordinator
    const transport = audioCoordinator.registerComponent(
      "rhythm-sequencer",
      stopPlayback
    );

    // Cleanup function
    return () => {
      stopPlayback();
      audioCoordinator.unregisterComponent("rhythm-sequencer");
    };
  }, []);

  // Handle sequence playback
  const handleStep = useCallback(
    (time: number) => {
      if (!audioCoordinator.isComponentActive("rhythm-sequencer")) {
        return;
      }

      Object.entries(sequence).forEach(([padId, steps]) => {
        if (steps[currentStep]) {
          samples[padId].start(time);
        }
      });
      setCurrentStep(
        (prev) => (prev + 1) % getStepsForTimeSignature(timeSignature)
      );
    },
    [currentStep, sequence, samples, timeSignature, getStepsForTimeSignature]
  );

  // Set up Tone.js sequence with shuffle
  useEffect(() => {
    if (!audioCoordinator.isComponentActive("rhythm-sequencer")) {
      return;
    }

    const transport =
      audioCoordinator.getComponentTransport("rhythm-sequencer");
    if (!transport) return;

    const steps = getStepsForTimeSignature(timeSignature);

    // Use different subdivisions based on time signature
    let subdivision;
    switch (timeSignature) {
      case "12/8":
        subdivision = "8t"; // Triplet eighth notes for 12/8
        break;
      case "3/4":
        subdivision = "8n"; // Eighth notes for 3/4
        break;
      default:
        subdivision = "8n"; // Eighth notes for 4/4
    }

    const seq = new Tone.Sequence(
      (time) => handleStep(time),
      Array(steps).fill(0),
      subdivision
    ).start(0);

    // Apply shuffle if enabled
    if (shuffle > 0) {
      transport.swing = shuffle;
      transport.swingSubdivision = "8n"; // Always use 8n for swing subdivision
    } else {
      transport.swing = 0;
    }

    // Set time signature and loop length
    if (timeSignature === "3/4") {
      transport.timeSignature = [3, 4];
      transport.loopEnd = "3m";
    } else if (timeSignature === "12/8") {
      transport.timeSignature = [12, 8];
      transport.loopEnd = "1m";
    } else {
      transport.timeSignature = [4, 4];
      transport.loopEnd = "1m";
    }

    sequenceRef.current = seq;

    return () => {
      seq.dispose();
    };
  }, [handleStep, shuffle, timeSignature, getStepsForTimeSignature]);

  // Handle transport state
  useEffect(() => {
    if (!audioCoordinator.isComponentActive("rhythm-sequencer")) {
      return;
    }

    const transport =
      audioCoordinator.getComponentTransport("rhythm-sequencer");
    if (transport) {
      transport.bpm.value = bpm;
    }
  }, [bpm]);

  const toggleTransport = async () => {
    await Tone.start();
    const transport =
      audioCoordinator.getComponentTransport("rhythm-sequencer");
    if (!transport) return;

    if (isPlaying) {
      transport.stop();
      setCurrentStep(0);
    } else {
      transport.start();
      transport.loop = true;
      transport.loopEnd = "1m";
    }
    setIsPlaying(!isPlaying);
  };

  const togglePad = (padId: string, step: number) => {
    setSequence((prev) => ({
      ...prev,
      [padId]: prev[padId].map((value, index) =>
        index === step ? !value : value
      ),
    }));
  };

  const loadPreset = (pattern: DrumPattern) => {
    const newSteps = getStepsForTimeSignature(pattern.timeSignature || "4/4");
    setSequence(
      drumPads.reduce(
        (acc, pad) => ({
          ...acc,
          [pad.id]: pattern.pattern[pad.id] || Array(newSteps).fill(false),
        }),
        {}
      )
    );
    setBpm(pattern.bpm);
    // Reset and disable shuffle if needed
    setShuffle(0);
    setShuffleDisabled(!!pattern.disableShuffle);
    setTimeSignature(pattern.timeSignature || "4/4");
    if (isPlaying) {
      Tone.Transport.stop();
      setIsPlaying(false);
    }
  };

  // Update sequence when time signature changes
  useEffect(() => {
    const newSteps = getStepsForTimeSignature(timeSignature);
    // Only reset if not coming from a preset and not the initial load
    if (!isTimeSignatureFromPreset && currentPreset === "") {
      // Reset to empty pattern
      setSequence(
        drumPads.reduce(
          (acc, pad) => ({
            ...acc,
            [pad.id]: Array(newSteps).fill(false),
          }),
          {}
        )
      );
      // Reset preset selection and enable shuffle
      setShuffleDisabled(false);
      setShuffle(0);
    }
    setIsTimeSignatureFromPreset(false);
  }, [
    timeSignature,
    getStepsForTimeSignature,
    isTimeSignatureFromPreset,
    currentPreset,
  ]);

  return (
    <div className="demo-container">
      <VisuallyHidden as="h3">Rhythm Sequencer</VisuallyHidden>
      <div className="rhythm-controls">
        <div>
          <IconButton
            size="small"
            onClick={toggleTransport}
            style={{ alignSelf: "flex-end" }}
            icon={isPlaying ? <Pause /> : <Play />}
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? "Stop" : "Play"}
          </IconButton>

          <Number
            id="bpm"
            value={bpm}
            onChange={setBpm}
            min={60}
            max={200}
            label="BPM"
            labelPosition="top"
          />

          <Select
            id="timeSignature"
            value={timeSignature}
            onChange={(value: string) => {
              setIsTimeSignatureFromPreset(false);
              setTimeSignature(value as "4/4" | "12/8" | "3/4");
            }}
            label="Time"
            labelPosition="top"
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="12/8">12/8</option>
          </Select>

          <Select
            id="preset"
            value={currentPreset}
            onChange={(value: string) => {
              setCurrentPreset(value);
              const selectedPattern = drumPatterns.find(
                (p) => p.name === value
              );
              if (selectedPattern) {
                setIsTimeSignatureFromPreset(true);
                loadPreset(selectedPattern);
              }
            }}
            label="Preset"
            labelPosition="top"
          >
            {drumPatterns.map((pattern) => (
              <option key={pattern.name} value={pattern.name}>
                {pattern.name}
              </option>
            ))}
          </Select>
        </div>

        <Slider
          value={shuffle * 100}
          onChange={(value) => setShuffle(value / 100)}
          min={0}
          max={100}
          step={1}
          disabled={shuffleDisabled}
          label="Shuffle"
          showValue={true}
          suffix="%"
        />
      </div>
      <div>
        {timeSignature === "3/4" && (
          <ul className="measure-numbers">
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>1</li>
            <li>2</li>
            <li>3</li>
          </ul>
        )}
        {timeSignature === "4/4" && (
          <ul className="measure-numbers">
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>4</li>
            <li>1</li>
            <li>2</li>
            <li>3</li>
            <li>4</li>
          </ul>
        )}
        {timeSignature === "12/8" && (
          <ul className="measure-numbers">
            <li>1</li>
            <li>a</li>
            <li>b</li>
            <li>2</li>
            <li>a</li>
            <li>b</li>
            <li>3</li>
            <li>a</li>
            <li>b</li>
            <li>4</li>
            <li>a</li>
            <li>b</li>
          </ul>
        )}
        {drumPads.map((pad) => (
          <div
            key={pad.id}
            className={`drum-row ${
              timeSignature === "4/4"
                ? "drum-row-4-4"
                : timeSignature === "3/4"
                ? "drum-row-3-4"
                : ""
            }`}
          >
            <div className="drum-label">{pad.name}</div>
            {sequence[pad.id].map((isActive, step) => (
              <button
                key={step}
                className={`drum-pad ${isActive ? "active" : ""} ${
                  step === currentStep && isPlaying ? "current-step" : ""
                }`}
                onClick={() => togglePad(pad.id, step)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default RhythmSequencer;
