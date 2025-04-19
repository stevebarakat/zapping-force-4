import React, { useState, useRef, useEffect } from "react";
import styles from "./StandingWavesDemo.module.css";
import "@/styles/shared/dark-mode.css";

const StandingWavesDemo = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [enclosureLength, setEnclosureLength] = useState(1.0); // Length in meters
  const [harmonicNumber, setHarmonicNumber] = useState(1); // Current harmonic (1 = fundamental)
  const [speedOfSound, setSpeedOfSound] = useState(343); // m/s
  const [animateWave, setAnimateWave] = useState(true); // Animation toggle

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Calculate frequency from length, speed of sound, and harmonic number
  const calculateFrequency = () => {
    // For a string/pipe closed at both ends: f = (n * v) / (2 * L)
    // n is the harmonic number, v is speed of sound, L is length
    return (harmonicNumber * speedOfSound) / (2 * enclosureLength);
  };

  // Initialize audio
  const startAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Clean up existing nodes
    stopAudio(false);

    // Calculate frequency based on current parameters
    const frequency = calculateFrequency();

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillatorRef.current = oscillator;

    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.2; // Lower volume to prevent loudness
    gainNodeRef.current = gainNode;

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start oscillator
    oscillator.start();

    // Start visualization
    startVisualization();

    setIsPlaying(true);
  };

  // Stop audio
  const stopAudio = (updateState = true) => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (updateState) {
      setIsPlaying(false);
    }
  };

  // Toggle play/stop
  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  // Update frequency when parameters change
  useEffect(() => {
    if (isPlaying && oscillatorRef.current && audioContextRef.current) {
      const frequency = calculateFrequency();
      oscillatorRef.current.frequency.setValueAtTime(
        frequency,
        audioContextRef.current.currentTime
      );
    }
  }, [enclosureLength, harmonicNumber, speedOfSound, isPlaying]);

  // Start visualization
  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let phase = 0;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-bg-darker")
        .trim();
      ctx.fillRect(0, 0, width, height);

      // Draw enclosure boundaries
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      ctx.lineWidth = 4;

      // Left boundary
      ctx.beginPath();
      ctx.moveTo(40, 50);
      ctx.lineTo(40, height - 50);
      ctx.stroke();

      // Right boundary
      ctx.beginPath();
      ctx.moveTo(width - 40, 50);
      ctx.lineTo(width - 40, height - 50);
      ctx.stroke();

      // Draw centerline
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--component-border")
        .trim();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, height / 2);
      ctx.lineTo(width - 40, height / 2);
      ctx.stroke();

      // Draw enclosure measurements
      ctx.font = "14px Arial";
      ctx.fillStyle = "#4b5563";
      ctx.textAlign = "center";
      ctx.fillText(`${enclosureLength} meters`, width / 2, height - 20);

      // Draw standing wave
      const waveWidth = width - 80; // Space between boundaries
      const wavelength = (2 * enclosureLength) / harmonicNumber;
      const frequency = calculateFrequency();

      // Draw forward and backward waves if animation is enabled
      if (animateWave) {
        // Draw forward traveling wave
        ctx.strokeStyle = "rgba(79, 70, 229, 0.3)"; // Light blue
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x <= waveWidth; x++) {
          const xPos = x + 40; // Offset from left boundary
          const xRatio = x / waveWidth;

          // Calculate y-position for traveling wave
          const travelingWaveY =
            height / 2 +
            Math.sin(xRatio * Math.PI * 2 * harmonicNumber - phase) * 50;

          if (x === 0) {
            ctx.moveTo(xPos, travelingWaveY);
          } else {
            ctx.lineTo(xPos, travelingWaveY);
          }
        }

        ctx.stroke();

        // Draw backward traveling wave
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)"; // Light red
        ctx.beginPath();

        for (let x = 0; x <= waveWidth; x++) {
          const xPos = x + 40; // Offset from left boundary
          const xRatio = x / waveWidth;

          // Calculate y-position for reflected wave (moving in opposite direction)
          const reflectedWaveY =
            height / 2 +
            Math.sin(xRatio * Math.PI * 2 * harmonicNumber + phase) * 50;

          if (x === 0) {
            ctx.moveTo(xPos, reflectedWaveY);
          } else {
            ctx.lineTo(xPos, reflectedWaveY);
          }
        }

        ctx.stroke();
      }

      // Draw resulting standing wave
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-blue")
        .trim();
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let x = 0; x <= waveWidth; x++) {
        const xPos = x + 40; // Offset from left boundary
        const xRatio = x / waveWidth;

        // Calculate y-position for standing wave
        // Standing wave is 2*A*sin(kx)*cos(ωt) where:
        // - k is wave number (2π/wavelength)
        // - ω is angular frequency (2πf)
        // - x is position
        // - t is time

        // This simplifies to amplitude * sin(2πx/wavelength) * cos(phase)
        const standingWaveY =
          height / 2 +
          Math.sin(xRatio * Math.PI * 2 * harmonicNumber) *
            Math.cos(phase) *
            80;

        if (x === 0) {
          ctx.moveTo(xPos, standingWaveY);
        } else {
          ctx.lineTo(xPos, standingWaveY);
        }
      }

      ctx.stroke();

      // Draw nodes and antinodes
      for (let i = 0; i <= harmonicNumber; i++) {
        const xPosition = 40 + (i * waveWidth) / harmonicNumber;

        // Draw node
        ctx.fillStyle = "#ef4444"; // Red
        ctx.beginPath();
        ctx.arc(xPosition, height / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Label node
        ctx.font = "12px Arial";
        ctx.fillStyle = "#ef4444";
        ctx.textAlign = "center";
        ctx.fillText("Node", xPosition, height / 2 + 20);

        // Draw antinode if not at the endpoints
        if (i < harmonicNumber) {
          const antinodeX = 40 + ((i + 0.5) * waveWidth) / harmonicNumber;

          ctx.fillStyle = "#10b981"; // Green
          ctx.beginPath();
          ctx.arc(antinodeX, height / 2, 6, 0, Math.PI * 2);
          ctx.fill();

          // Label antinode
          ctx.font = "12px Arial";
          ctx.fillStyle = "#10b981";
          ctx.textAlign = "center";
          ctx.fillText("Antinode", antinodeX, height / 2 - 15);
        }
      }

      // Draw harmonic and frequency information
      ctx.font = "14px Arial";
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";

      const harmonicNames = [
        "Fundamental",
        "Second Harmonic",
        "Third Harmonic",
        "Fourth Harmonic",
        "Fifth Harmonic",
      ];
      const harmonicName =
        harmonicNumber <= 5
          ? harmonicNames[harmonicNumber - 1]
          : `${harmonicNumber}th Harmonic`;

      ctx.fillText(
        `${harmonicName} (${frequency.toFixed(1)} Hz)`,
        width / 2,
        30
      );

      // Update phase for animation if enabled
      if (animateWave) {
        phase += 0.05;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className={styles["standing-waves-demo"]}>
      <div className={styles["visualization-container"]}>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          className={styles["visualization-canvas"]}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles["control-row"]}>
          <div className={styles["control-section"]}>
            <h3 className={styles["section-title"]}>Harmonic Number</h3>
            <div className={styles["harmonic-buttons"]}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setHarmonicNumber(n)}
                  className={`${styles["harmonic-button"]} ${
                    harmonicNumber === n ? styles.selected : ""
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className={styles["harmonic-description"]}>
              The harmonic number determines the number of nodes in the standing
              wave. Higher harmonics create more complex wave patterns.
            </div>
          </div>

          <div className={styles["control-section"]}>
            <h3 className={styles["section-title"]}>Enclosure Length</h3>
            <div className={styles["slider-container"]}>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={enclosureLength}
                onChange={(e) => setEnclosureLength(parseFloat(e.target.value))}
                className={styles.slider}
              />
              <div className={styles["value-display"]}>
                {enclosureLength} meters
              </div>
            </div>
            <div className={styles["enclosure-examples"]}>
              <span className={styles.example}>Flute (~0.6m)</span>
              <span className={styles.example}>Guitar string (~0.65m)</span>
              <span className={styles.example}>Bass string (~1m)</span>
              <span className={styles.example}>Trombone (~1.4m)</span>
            </div>
          </div>
        </div>

        <div className={styles["control-row"]}>
          <div className={styles["control-section"]}>
            <h3 className={styles["section-title"]}>Speed of Sound</h3>
            <div className={styles["slider-container"]}>
              <input
                type="range"
                min="330"
                max="350"
                step="1"
                value={speedOfSound}
                onChange={(e) => setSpeedOfSound(parseFloat(e.target.value))}
                className={styles.slider}
              />
              <div className={styles["value-display"]}>{speedOfSound} m/s</div>
            </div>
            <div className={styles["speed-description"]}>
              The speed of sound varies with temperature. At room temperature
              (20°C), it's approximately 343 m/s in air.
            </div>
          </div>

          <div className={styles["control-options"]}>
            <div className={styles["animation-toggle"]}>
              <label className={styles["toggle-label"]}>
                <input
                  type="checkbox"
                  checked={animateWave}
                  onChange={(e) => setAnimateWave(e.target.checked)}
                  className={styles["toggle-checkbox"]}
                />
                <span>Show Animation</span>
              </label>
            </div>

            <button onClick={togglePlay} className={styles["play-button"]}>
              {isPlaying ? "Stop Sound" : "Play Sound"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles["waves-info"]}>
        <p>
          <strong>Standing waves</strong> form when waves are confined within a
          space and reflect back and forth. When the forward and reflected waves
          superimpose, they create a pattern of stable positions called{" "}
          <strong>nodes</strong> (where the medium doesn't move) and{" "}
          <strong>antinodes</strong>
          (where the medium vibrates with maximum amplitude).
        </p>
        <p>
          For a given enclosure, only certain wavelengths "fit" properly,
          creating resonant standing waves. These discrete frequencies form the{" "}
          <strong>harmonic series</strong>:
        </p>
        <ul className={styles["waves-examples"]}>
          <li>
            In string instruments, standing waves determine the possible pitches
          </li>
          <li>In wind instruments, standing waves form in air columns</li>
          <li>
            In rooms, standing waves can create acoustic "dead spots" or
            reinforcement
          </li>
          <li>In microwave ovens, standing waves cause hot and cold spots</li>
        </ul>
      </div>
    </div>
  );
};

export default StandingWavesDemo;
