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
  const spectrumCanvasRef = useRef(null);
  const animationRef = useRef(null);

  // Add new refs for container dimensions
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

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

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Set canvas dimensions based on container width
        setDimensions({
          width: containerWidth,
          height: Math.min(400, containerWidth * 0.5), // Maintain aspect ratio with max height
        });
      }
    };

    // Initial size
    handleResize();

    // Add resize listener
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Modify startVisualization to use responsive dimensions
  const startVisualization = () => {
    const waveCanvas = waveCanvasRef.current;
    const spectrumCanvas = spectrumCanvasRef.current;
    if (!waveCanvas || !spectrumCanvas) {
      console.error("Canvas elements not found");
      return;
    }

    // Set canvas dimensions
    waveCanvas.width = dimensions.width;
    waveCanvas.height = dimensions.height;
    spectrumCanvas.width = dimensions.width;
    spectrumCanvas.height = dimensions.height * 0.5;

    const waveCtx = waveCanvas.getContext("2d");
    const spectrumCtx = spectrumCanvas.getContext("2d");

    if (!waveCtx || !spectrumCtx) {
      console.error("Could not get canvas context");
      return;
    }

    // Calculate responsive font sizes
    const baseFontSize = Math.max(10, Math.min(14, dimensions.width / 50));
    const titleFontSize = Math.max(12, Math.min(16, dimensions.width / 40));

    const waveWidth = waveCanvas.width;
    const waveHeight = waveCanvas.height;
    const spectrumWidth = spectrumCanvas.width;
    const spectrumHeight = spectrumCanvas.height;

    // Clear any existing animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Set canvas background to make it visible
    waveCtx.fillStyle = "#1a1a1a";
    waveCtx.fillRect(0, 0, waveWidth, waveHeight);
    spectrumCtx.fillStyle = "#1a1a1a";
    spectrumCtx.fillRect(0, 0, spectrumWidth, spectrumHeight);

    let phase = 0;

    const draw = () => {
      // Clear canvases
      waveCtx.clearRect(0, 0, waveWidth, waveHeight);
      spectrumCtx.clearRect(0, 0, spectrumWidth, spectrumHeight);

      // Draw background
      waveCtx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-bg-darker")
        .trim();
      waveCtx.fillRect(0, 0, waveWidth, waveHeight);
      spectrumCtx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-bg-darker")
        .trim();
      spectrumCtx.fillRect(0, 0, spectrumWidth, spectrumHeight);

      // Draw center line on waveform
      waveCtx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      waveCtx.lineWidth = 1;
      waveCtx.beginPath();
      waveCtx.moveTo(0, waveHeight / 2);
      waveCtx.lineTo(waveWidth, waveHeight / 2);
      waveCtx.stroke();

      // Calculate combined waveform
      const points = [];
      for (let x = 0; x < waveWidth; x++) {
        const ratio = x / waveWidth;
        let y = waveHeight / 2;

        // Add contribution from each enabled harmonic
        harmonics.forEach((harmonic) => {
          if (harmonic.enabled) {
            const cycles = 2 * harmonic.number; // Show 2 cycles of fundamental
            const angle =
              ratio * Math.PI * 2 * cycles + phase * harmonic.number;
            y += Math.sin(angle) * harmonic.amplitude * (waveHeight / 4);
          }
        });

        points.push({ x, y });
      }

      // Draw combined waveform
      waveCtx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-blue")
        .trim();
      waveCtx.lineWidth = 2;
      waveCtx.beginPath();

      points.forEach((point, index) => {
        if (index === 0) {
          waveCtx.moveTo(point.x, point.y);
        } else {
          waveCtx.lineTo(point.x, point.y);
        }
      });

      waveCtx.stroke();

      // Draw spectrum
      const barWidth = Math.min(dimensions.width / 15, 50);
      const barSpacing = Math.max(5, dimensions.width / 80);
      const maxBarHeight = spectrumHeight - 40;

      // Draw frequency axis
      spectrumCtx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      spectrumCtx.lineWidth = 1;
      spectrumCtx.beginPath();
      spectrumCtx.moveTo(0, spectrumHeight - 30);
      spectrumCtx.lineTo(spectrumWidth, spectrumHeight - 30);
      spectrumCtx.stroke();

      // Draw frequency labels
      spectrumCtx.font = `${baseFontSize}px Arial`;
      spectrumCtx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-primary")
        .trim();
      spectrumCtx.textAlign = "center";

      // Draw spectrum bars
      harmonics.forEach((harmonic, index) => {
        const barHeight = harmonic.enabled
          ? harmonic.amplitude * maxBarHeight
          : 0;
        const x = index * (barWidth + barSpacing) + barSpacing * 2;
        const y = spectrumHeight - 30 - barHeight;

        // Draw bar
        spectrumCtx.fillStyle = harmonic.color;
        spectrumCtx.fillRect(x, y, barWidth, barHeight);

        // Draw outline
        spectrumCtx.strokeStyle = getComputedStyle(document.documentElement)
          .getPropertyValue("--component-border")
          .trim();
        spectrumCtx.lineWidth = 1;
        spectrumCtx.strokeRect(x, y, barWidth, barHeight);

        // Draw frequency label
        spectrumCtx.fillStyle = getComputedStyle(document.documentElement)
          .getPropertyValue("--text-primary")
          .trim();
        spectrumCtx.fillText(
          `${baseFrequency * harmonic.number} Hz`,
          x + barWidth / 2,
          spectrumHeight - 10
        );

        // Draw harmonic number
        spectrumCtx.fillStyle = getComputedStyle(document.documentElement)
          .getPropertyValue("--text-primary")
          .trim();
        spectrumCtx.fillText(
          `${harmonic.number}×`,
          x + barWidth / 2,
          spectrumHeight - 50 - barHeight
        );
      });

      // Add spectrum title
      spectrumCtx.font = `${titleFontSize}px Arial`;
      spectrumCtx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-primary")
        .trim();
      spectrumCtx.textAlign = "center";
      spectrumCtx.fillText("Frequency Spectrum", spectrumWidth / 2, 20);

      // Add waveform title
      waveCtx.font = `${titleFontSize}px Arial`;
      waveCtx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-primary")
        .trim();
      waveCtx.textAlign = "center";
      waveCtx.fillText("Resulting Waveform", waveWidth / 2, 20);

      // Update phase for animation
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
      <div ref={containerRef} className={styles["visualization-container"]}>
        <canvas
          ref={waveCanvasRef}
          className={styles["visualization-canvas"]}
        />
        <canvas
          ref={spectrumCanvasRef}
          className={styles["visualization-canvas"]}
        />
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
