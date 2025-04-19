import React, { useState, useRef, useEffect } from "react";
import styles from "./FrequencyDemo.module.css";
import "@/styles/shared/dark-mode.css";

const FrequencyDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(440);
  const [showVisualization, setShowVisualization] = useState(true);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const frequencyRanges = [
    { range: "Bass", min: 20, max: 250, color: "#3b82f6" }, // Blue
    { range: "Mid", min: 250, max: 4000, color: "#10b981" }, // Green
    { range: "High", min: 4000, max: 14500, color: "#f59e0b" }, // Amber
    { range: "Very High", min: 14500, max: 20000, color: "#ef4444" }, // Red
  ];

  const noteFrequencies = [
    { note: "A1", frequency: 55, description: "Very low A (bass)" },
    { note: "A2", frequency: 110, description: "Low A (cello)" },
    { note: "A3", frequency: 220, description: "Bass A (bass guitar)" },
    { note: "A4", frequency: 440, description: "Middle A (standard tuning)" },
    { note: "A5", frequency: 880, description: "High A (violin)" },
    { note: "A6", frequency: 1760, description: "Very high A (piccolo)" },
    { note: "A7", frequency: 3520, description: "Extremely high A" },
    {
      note: "A8",
      frequency: 7040,
      description: "Highest A (near upper hearing limit)",
    },
  ];

  // Start or update oscillator
  const startOscillator = () => {
    // Create AudioContext if it doesn't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop current oscillator if it exists
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create gain node if it doesn't exist
    if (!gainNodeRef.current) {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.2; // Lower volume to avoid sudden loud sounds
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;
    }

    // Create and configure oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.connect(gainNodeRef.current);
    oscillator.start();
    oscillatorRef.current = oscillator;

    // Start visualization
    if (showVisualization) {
      startVisualization();
    }

    setIsPlaying(true);
  };

  // Stop oscillator
  const stopOscillator = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsPlaying(false);
  };

  // Toggle play state
  const togglePlay = () => {
    if (isPlaying) {
      stopOscillator();
    } else {
      startOscillator();
    }
  };

  // Update frequency while playing
  useEffect(() => {
    if (isPlaying && oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        frequency,
        audioContextRef.current.currentTime
      );
    }
  }, [frequency, isPlaying]);

  // Update visualization when frequency changes
  useEffect(() => {
    if (showVisualization) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      // Clear any existing animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Draw static waveform
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-bg-darker")
        .trim();
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw waveform
      ctx.strokeStyle = getCurrentRangeColor();
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Calculate wavelength based on frequency
      const cycles = Math.max(1, Math.min(20, frequency / 50));

      for (let x = 0; x < width; x++) {
        const ratio = x / width;
        const angle = ratio * Math.PI * 2 * cycles;
        const y = height / 2 + Math.sin(angle) * (height / 3);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw frequency value
      ctx.font = "16px Arial";
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-primary")
        .trim();
      ctx.textAlign = "center";
      ctx.fillText(`${frequency} Hz`, width / 2, 30);

      // Draw range label
      const currentRange = getCurrentRange();
      ctx.fillStyle = currentRange.color;
      ctx.fillText(currentRange.range + " Range", width / 2, 60);

      // Start animation if playing
      if (isPlaying) {
        startVisualization();
      }
    }
  }, [frequency, showVisualization, isPlaying]);

  // Draw frequency visualization
  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let phase = 0;
    const amplitude = height / 3;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-bg-darker")
        .trim();
      ctx.fillRect(0, 0, width, height);

      // Draw center line
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Draw waveform
      ctx.strokeStyle = getCurrentRangeColor();
      ctx.lineWidth = 2;
      ctx.beginPath();

      // Calculate wavelength based on frequency
      const cycles = Math.max(1, Math.min(20, frequency / 50));

      for (let x = 0; x < width; x++) {
        const ratio = x / width;
        const angle = ratio * Math.PI * 2 * cycles + phase;
        const y = height / 2 + Math.sin(angle) * amplitude;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Draw frequency value
      ctx.font = "16px Arial";
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-primary")
        .trim();
      ctx.textAlign = "center";
      ctx.fillText(`${frequency} Hz`, width / 2, 30);

      // Draw range label
      const currentRange = getCurrentRange();
      ctx.fillStyle = currentRange.color;
      ctx.fillText(currentRange.range + " Range", width / 2, 60);

      // Update phase for animation
      phase += 0.1 * (frequency / 440); // Speed based on frequency

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Get current frequency range
  const getCurrentRange = () => {
    for (const range of frequencyRanges) {
      if (frequency >= range.min && frequency <= range.max) {
        return range;
      }
    }
    return frequencyRanges[0]; // Default to bass
  };

  // Get color for current frequency range
  const getCurrentRangeColor = () => {
    return getCurrentRange().color;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Find closest note for current frequency
  const getClosestNote = () => {
    let closestNote = noteFrequencies[0];
    let minDifference = Math.abs(frequency - closestNote.frequency);

    for (const note of noteFrequencies) {
      const difference = Math.abs(frequency - note.frequency);
      if (difference < minDifference) {
        minDifference = difference;
        closestNote = note;
      }
    }

    return closestNote;
  };

  return (
    <div className={styles["frequency-demo"]}>
      <div className={styles["visualization-container"]}>
        <canvas
          ref={canvasRef}
          width={800}
          height={200}
          className={styles["frequency-canvas"]}
        />
      </div>

      <div className={styles["frequency-controls"]}>
        <div className={styles["slider-container"]}>
          <div className={styles["frequency-slider-labels"]}>
            <span>20 Hz</span>
            <span>100 Hz</span>
            <span>1 kHz</span>
            <span>10 kHz</span>
            <span>20 kHz</span>
          </div>

          <div className={styles["frequency-slider"]}>
            <div className={styles["frequency-ranges"]}>
              {frequencyRanges.map((range) => (
                <div
                  key={range.range}
                  className={styles["frequency-range"]}
                  style={{
                    backgroundColor: range.color,
                    left: `${
                      ((Math.log10(range.min) - Math.log10(20)) /
                        (Math.log10(20000) - Math.log10(20))) *
                      100
                    }%`,
                    width: `${
                      ((Math.log10(range.max) - Math.log10(range.min)) /
                        (Math.log10(20000) - Math.log10(20))) *
                      100
                    }%`,
                  }}
                >
                  {range.range}
                </div>
              ))}
            </div>

            <input
              type="range"
              min={Math.log10(20)}
              max={Math.log10(20000)}
              step="0.001"
              value={Math.log10(frequency)}
              onChange={(e) =>
                setFrequency(Math.round(Math.pow(10, e.target.value)))
              }
              className={styles.slider}
              style={{ background: "transparent" }}
            />
          </div>
        </div>

        <div className={styles["controls-row"]}>
          <div className={styles["note-buttons"]}>
            {noteFrequencies.map(
              ({ note, frequency: noteFreq, description }) => (
                <button
                  key={note}
                  onClick={() => setFrequency(noteFreq)}
                  className={`${styles["note-button"]} ${
                    Math.abs(frequency - noteFreq) < 5 ? styles.active : ""
                  }`}
                >
                  <div className={styles["note-name"]}>{note}</div>
                  <div className={styles["note-freq"]}>{noteFreq} Hz</div>
                </button>
              )
            )}
          </div>

          <button onClick={togglePlay} className={styles["play-button"]}>
            {isPlaying ? "Stop Sound" : "Play Sound"}
          </button>
        </div>
      </div>

      <div className={styles["frequency-info"]}>
        <p>
          <strong>Frequency</strong> determines the perceived pitch of a sound.
          The human ear can typically hear frequencies from 20 Hz (very low
          bass) to 20,000 Hz (very high treble).
        </p>
        <p>
          The current frequency ({frequency} Hz) is in the{" "}
          <strong style={{ color: getCurrentRangeColor() }}>
            {getCurrentRange().range}
          </strong>{" "}
          range.
          {frequency > 14500 && (
            <span style={{ color: "#ef4444" }}>
              {" "}
              Note: Most adults cannot hear frequencies above 14,500 Hz due to
              natural hearing loss with age.
            </span>
          )}
          {Math.abs(frequency - getClosestNote().frequency) < 5 &&
            ` This is very close to the note ${getClosestNote().note} (${
              getClosestNote().description
            }).`}
        </p>
        <ul className={styles["frequency-facts"]}>
          <li>Each octave represents a doubling of frequency</li>
          <li>The standard tuning reference note A4 = 440 Hz</li>
          <li>
            Most human speech falls between 85-255 Hz (male) and 165-255 Hz
            (female)
          </li>
          <li>The higher the frequency, the shorter the wavelength</li>
        </ul>
      </div>
    </div>
  );
};

export default FrequencyDemo;
