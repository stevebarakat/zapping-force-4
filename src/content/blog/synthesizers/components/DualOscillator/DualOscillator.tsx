import React, { useState, useRef, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import styles from "./DualOscillator.module.css";

type WaveformType = "sine" | "square" | "sawtooth" | "triangle";

const DualOscillator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440); // A4 note
  const [waveform, setWaveform] = useState<WaveformType>("sawtooth");
  const [volume, setVolume] = useState(0.5);
  const [detune, setDetune] = useState(7); // Slight detuning for second oscillator

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillator1Ref = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    const cycles = 3;

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * 2 * cycles;
      let y1 = calculateOscillatorY(t, waveform, centerY, height, volume);

      const detuneFactor = 1 + detune / 1200;
      const t2 = t * detuneFactor;
      let y2 = calculateOscillatorY(t2, waveform, centerY, height, volume);

      let y = (y1 + y2) / 2;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw a second, lighter line to represent the detuned oscillator
    ctx.beginPath();
    ctx.strokeStyle = primaryBlue + "4D"; // 30% opacity version of primary blue
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x++) {
      const t = (x / width) * Math.PI * 2 * cycles;
      const detuneFactor = 1 + detune / 1200;
      const t2 = t * detuneFactor;
      let y = calculateOscillatorY(t2, waveform, centerY, height, volume);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }, [waveform, frequency, volume, detune]);

  // Helper function to calculate Y position based on waveform type
  const calculateOscillatorY = (
    t: number,
    waveformType: WaveformType,
    centerY: number,
    height: number,
    amplitude: number
  ): number => {
    switch (waveformType) {
      case "sine":
        return centerY + Math.sin(t) * (height / 3) * amplitude;
      case "square":
        return centerY + (Math.sin(t) > 0 ? 1 : -1) * (height / 3) * amplitude;
      case "sawtooth":
        return (
          centerY +
          ((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * height * 0.6 * amplitude
        );
      case "triangle":
        return (
          centerY +
          (Math.abs((t % (Math.PI * 2)) / (Math.PI * 2) - 0.5) - 0.25) *
            height *
            1.2 *
            amplitude
        );
      default:
        return centerY;
    }
  };

  // Initialize or update audio
  const startSound = () => {
    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    // Stop any playing oscillators
    if (oscillator1Ref.current) {
      oscillator1Ref.current.stop();
      oscillator1Ref.current.disconnect();
    }

    if (oscillator2Ref.current) {
      oscillator2Ref.current.stop();
      oscillator2Ref.current.disconnect();
    }

    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create oscillator 1
    const oscillator1 = audioContext.createOscillator();
    oscillator1.type = waveform;
    oscillator1.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator1.connect(gainNode);

    // Create oscillator 2 with detune
    const oscillator2 = audioContext.createOscillator();
    oscillator2.type = waveform;
    oscillator2.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator2.detune.setValueAtTime(detune, audioContext.currentTime); // Detune in cents
    oscillator2.connect(gainNode);

    // Start the oscillators
    oscillator1.start();
    oscillator2.start();

    oscillator1Ref.current = oscillator1;
    oscillator2Ref.current = oscillator2;

    setIsPlaying(true);
  };

  const stopSound = () => {
    if (oscillator1Ref.current) {
      oscillator1Ref.current.stop();
      oscillator1Ref.current.disconnect();
      oscillator1Ref.current = null;
    }

    if (oscillator2Ref.current) {
      oscillator2Ref.current.stop();
      oscillator2Ref.current.disconnect();
      oscillator2Ref.current = null;
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
    // Update the oscillators if they're playing
    if (oscillator1Ref.current) {
      oscillator1Ref.current.type = newWaveform;
    }
    if (oscillator2Ref.current) {
      oscillator2Ref.current.type = newWaveform;
    }
  };

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrequency = parseFloat(e.target.value);
    setFrequency(newFrequency);
    // Update the oscillators if they're playing
    if (oscillator1Ref.current && audioContextRef.current) {
      oscillator1Ref.current.frequency.setValueAtTime(
        newFrequency,
        audioContextRef.current.currentTime
      );
    }
    if (oscillator2Ref.current && audioContextRef.current) {
      oscillator2Ref.current.frequency.setValueAtTime(
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

  const handleDetuneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDetune = parseFloat(e.target.value);
    setDetune(newDetune);
    // Update oscillator 2 if it's playing
    if (oscillator2Ref.current && audioContextRef.current) {
      oscillator2Ref.current.detune.setValueAtTime(
        newDetune,
        audioContextRef.current.currentTime
      );
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillator1Ref.current) {
        oscillator1Ref.current.stop();
        oscillator1Ref.current.disconnect();
      }
      if (oscillator2Ref.current) {
        oscillator2Ref.current.stop();
        oscillator2Ref.current.disconnect();
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.controlSection}>
        <button onClick={toggleSound} className={styles.playButton}>
          {isPlaying ? "Stop" : "Play"}
        </button>
        <div className={styles.sliderContainer}>
          <label className={styles.sliderLabel}>
            Volume: {Math.round(volume * 100)}%
          </label>
          <Slider.Root
            className={styles.sliderRoot}
            value={[volume]}
            onValueChange={([value]) =>
              handleVolumeChange({
                target: { value: value.toString() },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            max={1}
            step={0.01}
          >
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Range className={styles.sliderRange} />
            </Slider.Track>
            <Slider.Thumb className={styles.sliderThumb} />
          </Slider.Root>
        </div>
        <div className={styles.sliderContainer}>
          <label className={styles.sliderLabel}>
            Frequency: {frequency.toFixed(1)} Hz
          </label>
          <Slider.Root
            className={styles.sliderRoot}
            value={[frequency]}
            onValueChange={([value]) =>
              handleFrequencyChange({
                target: { value: value.toString() },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            min={50}
            max={1000}
            step={1}
          >
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Range className={styles.sliderRange} />
            </Slider.Track>
            <Slider.Thumb className={styles.sliderThumb} />
          </Slider.Root>
        </div>
      </div>

      <div className={styles.waveformContainer}>
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className={styles.canvas}
        />
      </div>

      <div className={styles.controls}>
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

        <div
          className={`${styles.sliderContainer} ${styles.oscillatorSection}`}
        >
          <label className={styles.sliderLabel}>Detune: {detune} cents</label>
          <Slider.Root
            className={styles.sliderRoot}
            value={[detune]}
            onValueChange={([value]) =>
              handleDetuneChange({
                target: { value: value.toString() },
              } as React.ChangeEvent<HTMLInputElement>)
            }
            min={-50}
            max={50}
            step={1}
          >
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Range className={styles.sliderRange} />
            </Slider.Track>
            <Slider.Thumb className={styles.sliderThumb} />
          </Slider.Root>
          <div className={styles.info}>
            <div className={styles.infoIcon}>i</div>
            <div className={styles.infoText}>
              Detune adds a second oscillator slightly offset from the main
              frequency. This creates a richer "fatter" sound similar to how
              multiple musicians playing together creates a fuller sound than a
              single instrument.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DualOscillator;
