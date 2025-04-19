import React, { useState, useRef, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import styles from "./SimpleOscillator.module.css";

type WaveformType = "sine" | "square" | "sawtooth" | "triangle";

function SimpleOscillator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440); // A4 note
  const [waveform, setWaveform] = useState<WaveformType>("sine");
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drawing the waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get the computed styles to access CSS variables
    const computedStyle = getComputedStyle(document.documentElement);
    const bgColor = computedStyle
      .getPropertyValue("--component-bg-darker")
      .trim();
    const primaryBlue = computedStyle.getPropertyValue("--primary-blue").trim();

    // Clear with background color from CSS
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = primaryBlue;
    ctx.lineWidth = 2;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Draw waveform
    const cycles = frequency < 100 ? 1 : 3; // Show more cycles for higher frequencies

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * 2 * cycles;
      let y = centerY;

      switch (waveform) {
        case "sine":
          y = centerY + Math.sin(t) * (height / 3) * volume;
          break;
        case "square":
          y = centerY + (Math.sin(t) > 0 ? 1 : -1) * (height / 3) * volume;
          break;
        case "sawtooth":
          y =
            centerY +
            ((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * height * 0.6 * volume;
          break;
        case "triangle":
          y =
            centerY +
            (Math.abs((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) - 0.25) *
              height *
              1.2 *
              volume;
          break;
        default:
          y = centerY;
      }

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [waveform, frequency, volume]);

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Stop any playing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create an oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNode);

    // Start the oscillator
    oscillator.start();
    oscillatorRef.current = oscillator;

    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  const toggleSound = () => {
    if (isPlaying) {
      stopSound();
    } else {
      startSound();
    }
  };

  const handleWaveformChange = (newWaveform: WaveformType) => {
    setWaveform(newWaveform);
    // Update the oscillator if it's playing
    if (oscillatorRef.current) {
      oscillatorRef.current.type = newWaveform;
    }
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrequency = parseFloat(e.target.value);
    setFrequency(newFrequency);
    // Update the oscillator if it's playing
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        newFrequency,
        audioContextRef.current.currentTime
      );
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    // Update the gain node if it exists
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        newVolume,
        audioContextRef.current.currentTime
      );
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
    };
  }, []);

  // Notes for the piano keys
  const notes = [
    { name: "C4", frequency: 261.63 },
    { name: "D4", frequency: 293.66 },
    { name: "E4", frequency: 329.63 },
    { name: "F4", frequency: 349.23 },
    { name: "G4", frequency: 392.0 },
    { name: "A4", frequency: 440.0 },
    { name: "B4", frequency: 493.88 },
    { name: "C5", frequency: 523.25 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.waveformContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className={styles.canvas}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlSection}>
          <h3 className={styles.controlTitle}>Waveform</h3>
          <div className={styles.buttonGroup}>
            {["sine", "square", "sawtooth", "triangle"].map((type) => (
              <button
                key={type}
                onClick={() => handleWaveformChange(type as WaveformType)}
                className={`${styles.button} ${
                  waveform === type ? styles.selected : ""
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlSection}>
          <div className={styles.pianoKeys}>
            {notes.map((note) => (
              <button
                key={note.name}
                className={styles.pianoKey}
                onClick={() => {
                  setFrequency(note.frequency);
                  if (oscillatorRef.current && audioContextRef.current) {
                    oscillatorRef.current.frequency.setValueAtTime(
                      note.frequency,
                      audioContextRef.current.currentTime
                    );
                  }
                }}
              >
                {note.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlSection}>
          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>
              Frequency: {frequency.toFixed(1)} Hz
            </label>
            <Slider.Root
              className={styles.sliderRoot}
              min={50}
              max={1000}
              step={1}
              value={[frequency]}
              onValueChange={([value]) => {
                setFrequency(value);
                if (oscillatorRef.current && audioContextRef.current) {
                  oscillatorRef.current.frequency.setValueAtTime(
                    value,
                    audioContextRef.current.currentTime
                  );
                }
              }}
            >
              <Slider.Track className={styles.sliderTrack}>
                <Slider.Range className={styles.sliderRange} />
              </Slider.Track>
              <Slider.Thumb className={styles.sliderThumb} />
            </Slider.Root>
          </div>

          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>
              Volume: {Math.round(volume * 100)}%
            </label>
            <Slider.Root
              className={styles.sliderRoot}
              min={0}
              max={1}
              step={0.01}
              value={[volume]}
              onValueChange={([value]) => {
                setVolume(value);
                if (gainNodeRef.current && audioContextRef.current) {
                  gainNodeRef.current.gain.setValueAtTime(
                    value,
                    audioContextRef.current.currentTime
                  );
                }
              }}
            >
              <Slider.Track className={styles.sliderTrack}>
                <Slider.Range className={styles.sliderRange} />
              </Slider.Track>
              <Slider.Thumb className={styles.sliderThumb} />
            </Slider.Root>
          </div>
        </div>

        <div className={styles.controlSection}>
          <button onClick={toggleSound} className={styles.button}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SimpleOscillator;
