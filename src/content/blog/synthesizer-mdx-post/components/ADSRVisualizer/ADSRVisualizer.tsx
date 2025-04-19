import React, { useState, useRef, useEffect } from "react";
import styles from "./ADSRVisualizer.module.css";

interface ADSRState {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

type SoundType = "synth" | "piano";
type ADSRParameter = keyof ADSRState;

const ADSRVisualizer = () => {
  const [adsr, setADSR] = useState<ADSRState>({
    attack: 0.2,
    decay: 0.3,
    sustain: 0.7,
    release: 0.5,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundType>("synth");

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Draw the ADSR envelope
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let x = 0; x < width; x += width / 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = 0; y < height; y += height / 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw timeline labels
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.textAlign = "center";

    // Key pressed indicator
    if (isPlaying) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "rgba(79, 70, 229, 0.1)");
      gradient.addColorStop(1, "rgba(79, 70, 229, 0.05)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width * 0.7, height);
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    }

    ctx.fillText("Key Pressed", width * 0.35, height - 10);
    ctx.fillText("Key Released", width * 0.85, height - 10);

    // Draw ADSR envelope with glow effect
    ctx.save();

    // Glow effect
    ctx.shadowColor = "rgba(79, 70, 229, 0.5)";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = "#4F46E5";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const startX = 0;
    const startY = height;

    // Starting point
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Calculate ADSR points
    const pixelsPerSecond = (width * 0.7) / (adsr.attack + adsr.decay + 0.5);

    // Attack
    const attackX = startX + adsr.attack * pixelsPerSecond;
    ctx.lineTo(attackX, 0);

    // Decay
    const decayX = attackX + adsr.decay * pixelsPerSecond;
    const sustainY = height * (1 - adsr.sustain);
    ctx.lineTo(decayX, sustainY);

    // Sustain
    const sustainX = width * 0.7;
    ctx.lineTo(sustainX, sustainY);

    // Release
    const releaseX =
      sustainX + width * 0.3 * (adsr.release / (adsr.release + 0.2));
    ctx.lineTo(releaseX, height);

    // Stroke the path
    ctx.stroke();

    // Draw points at key positions
    const drawPoint = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#4F46E5";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawPoint(startX, startY);
    drawPoint(attackX, 0);
    drawPoint(decayX, sustainY);
    drawPoint(sustainX, sustainY);
    drawPoint(releaseX, height);

    ctx.restore();

    // Add labels with improved styling
    ctx.font = "bold 12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.textAlign = "center";

    // Draw label backgrounds
    const drawLabel = (text: string, x: number, y: number) => {
      const padding = 6;
      const metrics = ctx.measureText(text);
      const labelWidth = metrics.width + padding * 2;
      const labelHeight = 20;

      ctx.fillStyle = "rgba(79, 70, 229, 0.1)";
      ctx.fillRect(
        x - labelWidth / 2,
        y - labelHeight / 2,
        labelWidth,
        labelHeight
      );

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fillText(text, x, y + 4);
    };

    // Position labels with better spacing
    drawLabel("A", attackX / 2, height / 2);
    drawLabel("D", attackX + (decayX - attackX) / 2, sustainY / 2);
    drawLabel("S", decayX + (sustainX - decayX) / 2, sustainY - 20);
    drawLabel(
      "R",
      sustainX + (releaseX - sustainX) / 2,
      (height + sustainY) / 2
    );
  }, [adsr, isPlaying]);

  // Play sound with ADSR envelope
  const playSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const audioContext = audioContextRef.current;

    // Stop any playing oscillator
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
    }

    // Create gain node for envelope
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNodeRef.current = gainNode;

    // Create oscillator
    const oscillator = audioContext.createOscillator();

    // Choose sound type based on activeSound
    if (activeSound === "synth") {
      oscillator.type = "sawtooth";
      oscillator.frequency.value = 440; // A4
    } else {
      // Piano-like sound (simplified approximation)
      oscillator.type = "triangle";
      oscillator.frequency.value = 261.63; // C4

      // Add a second oscillator for harmonics
      const oscillator2 = audioContext.createOscillator();
      oscillator2.type = "sine";
      oscillator2.frequency.value = 523.25; // C5 (octave above)
      oscillator2.connect(gainNode);

      // Start the second oscillator
      oscillator2.start();

      // Store it to stop later
      const originalStop = oscillator.stop;
      oscillator.stop = function (when?: number) {
        originalStop.call(this, when);
        oscillator2.stop(when);
      };
    }

    oscillator.connect(gainNode);
    oscillatorRef.current = oscillator;

    // Apply ADSR envelope
    const now = audioContext.currentTime;

    // Start with zero gain
    gainNode.gain.setValueAtTime(0, now);

    // Attack - ramp up to full volume
    gainNode.gain.linearRampToValueAtTime(1, now + adsr.attack);

    // Decay - fall to sustain level
    gainNode.gain.linearRampToValueAtTime(
      adsr.sustain,
      now + adsr.attack + adsr.decay
    );

    // Sustain happens automatically by holding the gain value

    // Start the oscillator
    oscillator.start();

    setIsPlaying(true);
  };

  // Release the sound (apply release phase)
  const releaseSound = () => {
    if (
      !audioContextRef.current ||
      !gainNodeRef.current ||
      !oscillatorRef.current
    )
      return;

    const now = audioContextRef.current.currentTime;

    // Release - ramp down to zero
    gainNodeRef.current.gain.cancelScheduledValues(now);
    gainNodeRef.current.gain.setValueAtTime(
      gainNodeRef.current.gain.value,
      now
    );
    gainNodeRef.current.gain.linearRampToValueAtTime(0, now + adsr.release);

    // Stop oscillator after release time
    setTimeout(() => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
    }, adsr.release * 1000);

    setIsPlaying(false);
  };

  const handleADSRChange = (parameter: ADSRParameter, value: number) => {
    setADSR((prev) => ({
      ...prev,
      [parameter]: value,
    }));
  };

  const getPreset = (presetName: string): ADSRState => {
    switch (presetName) {
      case "pluck":
        return {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.1,
        };
      case "pad":
        return {
          attack: 0.5,
          decay: 0.5,
          sustain: 0.8,
          release: 1.0,
        };
      case "piano":
        return {
          attack: 0.01,
          decay: 0.3,
          sustain: 0.7,
          release: 0.4,
        };
      case "brass":
        return {
          attack: 0.1,
          decay: 0.1,
          sustain: 0.9,
          release: 0.1,
        };
      default:
        return adsr;
    }
  };

  const applyPreset = (presetName: string) => {
    setADSR(getPreset(presetName));
  };

  // Clean up
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

  return (
    <div className={styles.container}>
      <div className={styles.waveformContainer}>
        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className={styles.canvas}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.controlSection}>
          <h3 className={styles.controlTitle}>Presets</h3>
          <div className={styles.presetButtons}>
            <button
              onClick={() => applyPreset("pluck")}
              className={styles.presetButton}
            >
              Pluck
            </button>
            <button
              onClick={() => applyPreset("pad")}
              className={styles.presetButton}
            >
              Pad
            </button>
            <button
              onClick={() => applyPreset("piano")}
              className={styles.presetButton}
            >
              Piano
            </button>
            <button
              onClick={() => applyPreset("brass")}
              className={styles.presetButton}
            >
              Brass
            </button>
          </div>
        </div>

        <div className={styles.soundToggle}>
          <button
            onClick={() => setActiveSound("synth")}
            className={`${styles.soundButton} ${
              activeSound === "synth" ? styles.selected : ""
            }`}
          >
            Synth Sound
          </button>
          <button
            onClick={() => setActiveSound("piano")}
            className={`${styles.soundButton} ${
              activeSound === "piano" ? styles.selected : ""
            }`}
          >
            Piano-like Sound
          </button>
        </div>

        <div className={styles.controlSection}>
          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>
              Attack: {adsr.attack.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0.01"
              max="2"
              step="0.01"
              value={adsr.attack}
              onChange={(e) =>
                handleADSRChange("attack", parseFloat(e.target.value))
              }
              className={styles.slider}
            />
            <div className={styles.parameterDescription}>
              How quickly the sound reaches full volume
            </div>
          </div>

          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>
              Decay: {adsr.decay.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0.01"
              max="2"
              step="0.01"
              value={adsr.decay}
              onChange={(e) =>
                handleADSRChange("decay", parseFloat(e.target.value))
              }
              className={styles.slider}
            />
            <div className={styles.parameterDescription}>
              How quickly the sound falls to the sustain level
            </div>
          </div>

          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>
              Sustain: {(adsr.sustain * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={adsr.sustain}
              onChange={(e) =>
                handleADSRChange("sustain", parseFloat(e.target.value))
              }
              className={styles.slider}
            />
            <div className={styles.parameterDescription}>
              The volume level while the key is held down
            </div>
          </div>

          <div className={styles.sliderContainer}>
            <label className={styles.sliderLabel}>
              Release: {adsr.release.toFixed(2)}s
            </label>
            <input
              type="range"
              min="0.01"
              max="3"
              step="0.01"
              value={adsr.release}
              onChange={(e) =>
                handleADSRChange("release", parseFloat(e.target.value))
              }
              className={styles.slider}
            />
            <div className={styles.parameterDescription}>
              How quickly the sound fades after release
            </div>
          </div>
        </div>

        <div className={styles.playControls}>
          <button
            onMouseDown={playSound}
            onMouseUp={releaseSound}
            onMouseLeave={isPlaying ? releaseSound : undefined}
            onTouchStart={playSound}
            onTouchEnd={releaseSound}
            className={styles.playButton}
          >
            Hold to Play
          </button>
        </div>

        <div className={styles.description}>
          <p>
            The ADSR envelope shapes how a sound evolves over time. Try
            different settings and notice how they affect the character of the
            sound. Fast attack with low sustain creates percussive sounds, while
            slow attack with high sustain creates pad-like textures.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ADSRVisualizer;
