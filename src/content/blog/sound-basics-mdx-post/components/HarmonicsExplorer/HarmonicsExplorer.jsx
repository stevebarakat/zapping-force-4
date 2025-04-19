import React, { useState, useRef, useEffect } from "react";
import styles from "./HarmonicsExplorer.module.css";
import "@/styles/shared/dark-mode.css";

const HarmonicsExplorer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [baseFrequency, setBaseFrequency] = useState(220); // A3
  const [harmonics, setHarmonics] = useState([
    {
      number: 1,
      name: "Fundamental",
      enabled: true,
      amplitude: 1.0,
      color: "#4F46E5",
    },
    {
      number: 2,
      name: "Second Harmonic",
      enabled: false,
      amplitude: 0.5,
      color: "#7C3AED",
    },
    {
      number: 3,
      name: "Third Harmonic",
      enabled: false,
      amplitude: 0.3,
      color: "#EC4899",
    },
    {
      number: 4,
      name: "Fourth Harmonic",
      enabled: false,
      amplitude: 0.2,
      color: "#F59E0B",
    },
    {
      number: 5,
      name: "Fifth Harmonic",
      enabled: false,
      amplitude: 0.15,
      color: "#10B981",
    },
  ]);
  const [selectedPreset, setSelectedPreset] = useState("sine");

  const audioContextRef = useRef(null);
  const oscillatorsRef = useRef([]);
  const gainNodesRef = useRef([]);
  const masterGainRef = useRef(null);
  const waveCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Instrument presets
  const presets = {
    sine: {
      name: "Pure Sine",
      description:
        "A pure sine wave with no harmonics, like a tuning fork or flute.",
      harmonics: [
        { number: 1, enabled: true, amplitude: 1.0 },
        { number: 2, enabled: false, amplitude: 0 },
        { number: 3, enabled: false, amplitude: 0 },
        { number: 4, enabled: false, amplitude: 0 },
        { number: 5, enabled: false, amplitude: 0 },
      ],
    },
    clarinet: {
      name: "Clarinet-like",
      description:
        "Strong on odd harmonics (1, 3, 5), creating a hollow sound.",
      harmonics: [
        { number: 1, enabled: true, amplitude: 1.0 },
        { number: 2, enabled: false, amplitude: 0 },
        { number: 3, enabled: true, amplitude: 0.75 },
        { number: 4, enabled: false, amplitude: 0 },
        { number: 5, enabled: true, amplitude: 0.5 },
      ],
    },
    sawtooth: {
      name: "Sawtooth/Brass",
      description:
        "Rich in harmonics with amplitudes decreasing as frequency increases (like brass instruments).",
      harmonics: [
        { number: 1, enabled: true, amplitude: 1.0 },
        { number: 2, enabled: true, amplitude: 0.5 },
        { number: 3, enabled: true, amplitude: 0.33 },
        { number: 4, enabled: true, amplitude: 0.25 },
        { number: 5, enabled: true, amplitude: 0.2 },
      ],
    },
    square: {
      name: "Square/Reed",
      description:
        "Contains only odd harmonics (1, 3, 5) with stronger presence, like reed instruments.",
      harmonics: [
        { number: 1, enabled: true, amplitude: 1.0 },
        { number: 2, enabled: false, amplitude: 0 },
        { number: 3, enabled: true, amplitude: 0.33 },
        { number: 4, enabled: false, amplitude: 0 },
        { number: 5, enabled: true, amplitude: 0.2 },
      ],
    },
    custom: {
      name: "Custom",
      description: "Create your own harmonic structure by adjusting sliders.",
      harmonics: [...harmonics],
    },
  };

  // Apply preset
  const applyPreset = (presetKey) => {
    if (!presets[presetKey]) return;

    const preset = presets[presetKey];
    const newHarmonics = harmonics.map((h, index) => {
      if (index < preset.harmonics.length) {
        return {
          ...h,
          enabled: preset.harmonics[index].enabled,
          amplitude: preset.harmonics[index].amplitude,
        };
      }
      return h;
    });

    setHarmonics(newHarmonics);
    setSelectedPreset(presetKey);

    // Update audio and visualization if playing
    if (isPlaying) {
      // Cancel existing animation frame before starting new one
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      updateOscillators(newHarmonics);
      startVisualization(); // Restart visualization with new harmonics
    }
  };

  // Initialize audio system
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Create master gain node
    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.2; // Lower overall volume
    masterGain.connect(audioContext.destination);
    masterGainRef.current = masterGain;

    // Create oscillators and gain nodes for each harmonic
    const newOscillators = [];
    const newGainNodes = [];

    harmonics.forEach((harmonic) => {
      // Create gain node
      const gainNode = audioContext.createGain();
      gainNode.gain.value = harmonic.enabled ? harmonic.amplitude * 0.3 : 0;
      gainNode.connect(masterGain);
      newGainNodes.push(gainNode);

      // Create oscillator
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = baseFrequency * harmonic.number;
      oscillator.connect(gainNode);
      oscillator.start();
      newOscillators.push(oscillator);
    });

    oscillatorsRef.current = newOscillators;
    gainNodesRef.current = newGainNodes;
  };

  // Update oscillators when harmonics change
  const updateOscillators = (newHarmonics) => {
    if (!audioContextRef.current || !oscillatorsRef.current.length) return;

    newHarmonics.forEach((harmonic, index) => {
      if (index < gainNodesRef.current.length) {
        // Update gain value based on harmonic state
        gainNodesRef.current[index].gain.setValueAtTime(
          harmonic.enabled ? harmonic.amplitude * 0.3 : 0,
          audioContextRef.current.currentTime
        );
      }
    });
  };

  // Start playing
  const startPlaying = () => {
    // Cleanup existing oscillators
    stopPlaying();

    // Initialize new audio system
    initAudio();

    // Start visualization
    startVisualization();

    setIsPlaying(true);
  };

  // Stop playing
  const stopPlaying = () => {
    if (oscillatorsRef.current.length) {
      oscillatorsRef.current.forEach((osc) => {
        osc.stop();
        osc.disconnect();
      });
      oscillatorsRef.current = [];
      gainNodesRef.current = [];
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsPlaying(false);
  };

  // Toggle play state
  const togglePlay = () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      startPlaying();
    }
  };

  // Update base frequency
  useEffect(() => {
    if (isPlaying && oscillatorsRef.current.length) {
      oscillatorsRef.current.forEach((osc, index) => {
        const harmonicNumber = harmonics[index].number;
        osc.frequency.setValueAtTime(
          baseFrequency * harmonicNumber,
          audioContextRef.current.currentTime
        );
      });

      // Restart visualization to reflect new frequency
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      startVisualization();
    }
  }, [baseFrequency, harmonics, isPlaying]);

  // Update harmonics
  useEffect(() => {
    if (isPlaying) {
      // Cancel existing animation frame before starting new one
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      updateOscillators(harmonics);
      startVisualization(); // Restart visualization when harmonics change
    }

    // Set preset to custom if values changed
    if (selectedPreset !== "custom") {
      const currentSettings = JSON.stringify(
        harmonics.map((h) => ({ enabled: h.enabled, amplitude: h.amplitude }))
      );
      const presetSettings = JSON.stringify(
        presets[selectedPreset].harmonics.map((h) => ({
          enabled: h.enabled,
          amplitude: h.amplitude,
        }))
      );

      if (currentSettings !== presetSettings) {
        setSelectedPreset("custom");
      }
    }
  }, [harmonics, isPlaying, selectedPreset]);

  // Handle harmonic toggle
  const toggleHarmonic = (index) => {
    const newHarmonics = [...harmonics];
    newHarmonics[index].enabled = !newHarmonics[index].enabled;
    setHarmonics(newHarmonics);
  };

  // Handle harmonic amplitude change
  const changeHarmonicAmplitude = (index, value) => {
    const newHarmonics = [...harmonics];
    newHarmonics[index].amplitude = value;
    setHarmonics(newHarmonics);
  };

  // Start visualization
  const startVisualization = () => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set fixed canvas size
    canvas.width = 800;
    canvas.height = 200;

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-bg-darker")
        .trim();
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw center line
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Calculate waveform
      const points = [];
      for (let x = 0; x < canvas.width; x++) {
        const ratio = x / canvas.width;
        let y = canvas.height / 2;

        harmonics.forEach((harmonic) => {
          if (harmonic.enabled) {
            const frequencyRatio = baseFrequency / 220;
            const cycles = 2 * harmonic.number * frequencyRatio;
            const angle =
              ratio * Math.PI * 2 * cycles + phase * harmonic.number;
            y += Math.sin(angle) * harmonic.amplitude * (canvas.height / 4);
          }
        });

        points.push({ x, y });
      }

      // Draw waveform
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-blue")
        .trim();
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();

      phase += 0.02;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlaying();
    };
  }, []);

  return (
    <div className={styles["harmonics-explorer"]}>
      <canvas ref={waveCanvasRef} className={styles["visualization-canvas"]} />
      <div className={styles["spectrum-container"]}>
        <h3 className={styles["spectrum-title"]}>Frequency Spectrum</h3>
        <svg
          className={styles["spectrum-svg"]}
          viewBox="0 0 800 320"
          preserveAspectRatio="xMidYMid meet"
        >
          {harmonics.map((harmonic, index) => {
            const barWidth = 100;
            const barSpacing = 30;
            const maxBarHeight = 200;
            const x = index * (barWidth + barSpacing) + 60;
            const barHeight = harmonic.enabled
              ? harmonic.amplitude * maxBarHeight
              : 0;
            const y = maxBarHeight - barHeight + 50;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={harmonic.color}
                  className={styles["spectrum-bar"]}
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 20}
                  textAnchor="middle"
                  className={styles["harmonic-number"]}
                >
                  {harmonic.number}×
                </text>
                <text
                  x={x + barWidth / 2}
                  y={maxBarHeight + 80}
                  textAnchor="middle"
                  className={styles["frequency-label"]}
                >
                  {baseFrequency * harmonic.number} Hz
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.controls}>
        <div className={styles["presets-section"]}>
          <div className={styles["preset-buttons"]}>
            {Object.keys(presets).map((presetKey) => (
              <button
                key={presetKey}
                onClick={() => applyPreset(presetKey)}
                className={`${styles["preset-button"]} ${
                  selectedPreset === presetKey ? styles.selected : ""
                }`}
              >
                {presets[presetKey].name}
              </button>
            ))}
          </div>
          <div className={styles["preset-description"]}>
            {selectedPreset && presets[selectedPreset].description}
          </div>
        </div>

        <div className={styles["harmonics-controls"]}>
          {harmonics.map((harmonic, index) => (
            <div key={index} className={styles["harmonic-control"]}>
              <div className={styles["harmonic-header"]}>
                <div className={styles["harmonic-checkbox-container"]}>
                  <input
                    type="checkbox"
                    checked={harmonic.enabled}
                    onChange={() => toggleHarmonic(index)}
                    className={styles["harmonic-checkbox"]}
                    id={`harmonic-${index}`}
                  />
                  <label
                    htmlFor={`harmonic-${index}`}
                    className={styles["harmonic-checkbox-label"]}
                  >
                    {harmonic.name}
                  </label>
                </div>
                <span className={styles["harmonic-frequency"]}>
                  {harmonic.number}×{baseFrequency} Hz
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={harmonic.amplitude}
                onChange={(e) =>
                  changeHarmonicAmplitude(index, parseFloat(e.target.value))
                }
                className={styles.slider}
              />
            </div>
          ))}
        </div>

        <div className={styles["bottom-controls"]}>
          <div className={styles["frequency-controls"]}>
            <div className={styles["frequency-buttons"]}>
              <button
                className={`${styles["frequency-button"]} ${
                  baseFrequency === 110 ? styles.selected : ""
                }`}
                onClick={() => setBaseFrequency(110)}
              >
                A2 (110 Hz)
              </button>
              <button
                className={`${styles["frequency-button"]} ${
                  baseFrequency === 220 ? styles.selected : ""
                }`}
                onClick={() => setBaseFrequency(220)}
              >
                A3 (220 Hz)
              </button>
              <button
                className={`${styles["frequency-button"]} ${
                  baseFrequency === 440 ? styles.selected : ""
                }`}
                onClick={() => setBaseFrequency(440)}
              >
                A4 (440 Hz)
              </button>
            </div>
          </div>

          <button onClick={togglePlay} className={styles["play-button"]}>
            {isPlaying ? "Stop Sound" : "Play Sound"}
          </button>
        </div>
      </div>

      <div className={styles["harmonics-info"]}>
        <p>
          Musical sounds are composed of multiple frequency components called{" "}
          <strong>harmonics</strong>. The <strong>fundamental frequency</strong>{" "}
          (first harmonic) determines the perceived pitch, while the pattern and
          strength of higher harmonics create the characteristic{" "}
          <strong>timbre</strong> or tone color that helps us distinguish
          different instruments.
        </p>
      </div>
    </div>
  );
};

export default HarmonicsExplorer;
